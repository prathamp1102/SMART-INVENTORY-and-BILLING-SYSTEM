const Invoice = require("../models/InvoiceModel");
const ProductModel = require("../models/Productmodel");
const UserModel = require("../models/Usermodel");
const { sendInvoiceEmail, verifySmtp } = require("../utils/emailService");

// POP_BRANCH now deep-populates the organization inside branch
// so invoice.branch.organization gives org name, GST, address etc.
const POP_CASHIER  = { path: "cashier", select: "name email role" };
const POP_BRANCH   = {
  path: "branch",
  select: "branchName city organization",
  populate: {
    path: "organization",
    select: "name gstNumber address phone email",
  },
};
const POP_PRODUCTS = { path: "items.product", select: "name barcode stock" };

// POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    const requestingUserId = req.user._id || req.user.id;
    const isCustomer = req.user.role === "CUSTOMER";

    const {
      customerName, customerPhone, customerEmail: bodyCustomerEmail, items, discountAmount = 0,
      discountPercent = 0, taxAmount = 0, paymentMode = "CASH",
      amountPaid, notes, status = "PAID",
    } = req.body;

    if (!items?.length) return res.status(400).json({ message: "At least one item required" });

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.product);
      const unitPrice = item.unitPrice ?? (product?.price || 0);
      const total     = unitPrice * item.qty * (1 - (item.discount || 0) / 100);
      subtotal += total;

      // Deduct stock
      if (product && status === "PAID") {
        if (product.stock < item.qty)
          return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
        await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
      }

      processedItems.push({
        product:     item.product,
        productName: item.productName || product?.name || "—",
        barcode:     product?.barcode,
        qty:         item.qty,
        unitPrice,
        costPrice:   product?.costPrice || 0,
        discount:    item.discount || 0,
        taxRate:     item.taxRate || 0,
        total,
      });
    }

    const grandTotal = subtotal - discountAmount + taxAmount;
    const paid = amountPaid ?? grandTotal;

    // If discount > 20%, mark as needing approval
    const needsApproval = discountPercent > 20 || discountAmount > (subtotal * 0.20);

    const invoice = await Invoice.create({
      branch:          branchId,
      cashier:         requestingUserId,
      customerId:      isCustomer ? requestingUserId : (req.body.customerId || null),
      customerName:    isCustomer ? req.user.name : customerName,
      customerPhone:   isCustomer ? (req.user.phone || customerPhone) : customerPhone,
      items:           processedItems,
      subtotal,
      discountAmount,
      discountPercent,
      taxAmount,
      grandTotal,
      paymentMode,
      amountPaid:      paid,
      change:          Math.max(0, paid - grandTotal),
      notes,
      status:          needsApproval ? "PENDING" : status,
      discountApproved: !needsApproval,
    });

    // Populate branch (with nested org) + cashier on creation response
    await invoice.populate([POP_CASHIER, POP_BRANCH]);

    // ── Auto-send invoice email to customer ──────────────────────────────────
    try {
      let customerEmail = null;

      // 1. If customer is logged-in user, use their account email
      if (isCustomer) {
        customerEmail = req.user.email || null;
      }

      // 2. If customerId is linked, look up their email
      if (!customerEmail && invoice.customerId) {
        const customerUser = await UserModel.findById(invoice.customerId).select("email");
        if (customerUser?.email) customerEmail = customerUser.email;
      }

      // 3. If admin/staff provided a customerEmail in the request body, use it
      if (!customerEmail && bodyCustomerEmail) {
        customerEmail = bodyCustomerEmail;
      }

      if (customerEmail) {
        console.log(`[Invoice Email] Sending invoice ${invoice.invoiceNo} to ${customerEmail}...`);
        await sendInvoiceEmail(customerEmail, invoice.toObject());
        console.log(`[Invoice Email] ✅ Sent successfully to ${customerEmail}`);
      } else {
        console.log(`[Invoice Email] No customer email found for invoice ${invoice.invoiceNo}, skipping.`);
      }
    } catch (emailErr) {
      // Never block invoice creation because of email failure — but log clearly
      console.error(`[Invoice Email] ❌ FAILED for invoice ${invoice.invoiceNo}:`);
      console.error(`  Message: ${emailErr.message}`);
      console.error(`  Code: ${emailErr.code || "N/A"}`);
      console.error(`  Response: ${emailErr.response || "N/A"}`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    let filter = {};
    if (req.branchFilter && req.branchFilter.branch) {
      filter.$or = [
        { branch: req.branchFilter.branch },
        { branch: null },
      ];
    }
    const { from, to, status, cashier } = req.query;

    // CUSTOMER role: only show their own invoices
    if (req.user.role === "CUSTOMER") {
      const userId = req.user._id || req.user.id;
      filter.$or = [
        { customerId: userId },
        { cashier: userId },
        ...(req.user.name  ? [{ customerName:  req.user.name  }] : []),
        ...(req.user.phone ? [{ customerPhone: req.user.phone }] : []),
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status) filter.status = status;
    if (cashier && req.user.role !== "CUSTOMER") filter.cashier = cashier;

    const invoices = await Invoice.find(filter)
      .populate(POP_CASHIER)
      .populate(POP_BRANCH)   // includes nested org
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    // Use same $or branch logic as getInvoices so invoices with branch: null
    // (created before branch assignment) are still accessible to admins.
    const filter = { _id: req.params.id };
    if (req.branchFilter?.branch) {
      filter.$or = [
        { branch: req.branchFilter.branch },
        { branch: null },
      ];
    }
    const invoice = await Invoice.findOne(filter)
      .populate(POP_CASHIER)
      .populate(POP_BRANCH)   // includes nested org
      .populate(POP_PRODUCTS);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // CUSTOMER role: ensure they can only see their own invoice
    if (req.user.role === "CUSTOMER") {
      const userId = String(req.user._id || req.user.id);
      const isOwner =
        String(invoice.customerId) === userId ||
        String(invoice.cashier?._id || invoice.cashier) === userId ||
        (req.user.name  && invoice.customerName  === req.user.name)  ||
        (req.user.phone && invoice.customerPhone === req.user.phone);
      if (!isOwner) return res.status(403).json({ message: "Access denied" });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/invoices/:id  (admin: approve discount, cancel etc.)
exports.updateInvoice = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(req.branchFilter || {}) };
    const invoice = await Invoice.findOne(filter);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (req.body.approveDiscount) {
      invoice.discountApproved    = true;
      invoice.discountApprovedBy  = req.user._id || req.user.id;
      invoice.status              = "PAID";
    }
    if (req.body.status) invoice.status = req.body.status;
    if (req.body.notes !== undefined) invoice.notes = req.body.notes;

    await invoice.save();
    await invoice.populate([POP_CASHIER, POP_BRANCH]);
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/invoices/:id  (cancel + restock)
exports.cancelInvoice = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(req.branchFilter || {}) };
    const invoice = await Invoice.findOne(filter);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "CANCELLED") return res.status(400).json({ message: "Already cancelled" });

    // Restock
    if (invoice.status === "PAID") {
      for (const item of invoice.items) {
        if (item.product) {
          await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
        }
      }
    }
    invoice.status = "CANCELLED";
    await invoice.save();
    res.json({ message: "Invoice cancelled", invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invoices/summary/today
exports.getTodaySummary = async (req, res) => {
  try {
    const branchFilter = req.branchFilter || {};
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const todayInvoices = await Invoice.find({
      ...branchFilter,
      createdAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "CANCELLED" },
    }).lean();

    const totalSales  = todayInvoices.reduce((s,i) => s + i.grandTotal, 0);
    const totalProfit = todayInvoices.reduce((s,i) => {
      const cost = i.items.reduce((c,item) => c + (item.costPrice||0)*item.qty, 0);
      return s + (i.grandTotal - cost);
    }, 0);

    res.json({
      count: todayInvoices.length,
      totalSales,
      totalProfit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invoices/:id/send-email  (manually resend invoice to customer)
exports.sendInvoiceEmailManual = async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    if (req.branchFilter?.branch) {
      filter.$or = [
        { branch: req.branchFilter.branch },
        { branch: null },
      ];
    }

    const invoice = await Invoice.findOne(filter)
      .populate(POP_CASHIER)
      .populate(POP_BRANCH)
      .populate(POP_PRODUCTS);

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Determine recipient email
    let customerEmail = req.body.email || null;

    if (!customerEmail && invoice.customerId) {
      const customerUser = await UserModel.findById(invoice.customerId).select("email");
      if (customerUser?.email) customerEmail = customerUser.email;
    }

    // CUSTOMER role: send to themselves
    if (!customerEmail && req.user.role === "CUSTOMER") {
      customerEmail = req.user.email;
    }

    if (!customerEmail) {
      return res.status(400).json({ message: "No customer email found. Please provide an email address." });
    }

    await sendInvoiceEmail(customerEmail, invoice.toObject());
    res.json({ message: `Invoice sent to ${customerEmail}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invoices/smtp-test  (admin: verify SMTP config is working)
exports.smtpTest = async (req, res) => {
  const result = await verifySmtp();
  if (result.ok) {
    res.json({ ok: true, message: `SMTP connected as ${result.user}` });
  } else {
    res.status(500).json({ ok: false, message: result.error, code: result.code });
  }
};
