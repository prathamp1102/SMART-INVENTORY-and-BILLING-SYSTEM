const ProductModel = require("../models/Productmodel");
const Branch = require("../models/BranchModel");
const SalesOrder = require("../models/SalesOrderModel");
const Invoice = require("../models/InvoiceModel");

/* ─────────────────────────────────────────────
   IMPORT DAILY SALES ORDERS FROM EXCEL (parsed)
   POST /api/sales-orders/import
   Body: { rows: [ { productName, barcode, qty, unitPrice, discount, customerName, customerPhone, paymentMode, notes, date } ] }
───────────────────────────────────────────── */
exports.importSalesOrders = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    if (!rows.length) return res.status(400).json({ message: "No rows provided" });

    const branchId = req.userBranch || req.body.branchId || null;
    const uploadedBy = req.user._id || req.user.id;

    const created = [];
    const errors = [];
    const stockIssues = [];
    // stockLedger: one entry per unique product showing before/sold/after
    const stockLedgerMap = new Map(); // productId -> { name, barcode, stockBefore, soldQty, stockAfter }

    // Group rows by date+customer into order batches
    // Each unique (date, customerName/phone) combo = one order
    const orderMap = new Map();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.productName?.trim() && !r.barcode?.trim()) {
          throw new Error("productName or barcode is required");
        }
        const qty = parseInt(r.qty);
        if (isNaN(qty) || qty <= 0) throw new Error("qty must be a positive number");

        const dateStr = r.date ? new Date(r.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const key = `${dateStr}__${(r.customerName || "WALK-IN").trim()}__${(r.customerPhone || "").trim()}`;

        if (!orderMap.has(key)) {
          orderMap.set(key, {
            date: dateStr,
            customerName: (r.customerName || "WALK-IN").trim(),
            customerPhone: (r.customerPhone || "").trim(),
            paymentMode: (r.paymentMode || "CASH").toUpperCase(),
            notes: r.notes || "",
            items: [],
            rowStart: i + 2,
          });
        }

        orderMap.get(key).items.push({
          rawProductName: r.productName?.trim() || "",
          rawBarcode: r.barcode?.trim() || "",
          qty,
          unitPrice: parseFloat(r.unitPrice) || null,
          discount: parseFloat(r.discount) || 0,
          rowIndex: i + 2,
        });
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    // Process each grouped order
    for (const [, order] of orderMap) {
      try {
        const processedItems = [];
        let subtotal = 0;

        for (const item of order.items) {
          // Find product by name or barcode, scoped to branch
          const query = branchId ? { branch: branchId } : {};
          if (item.rawBarcode) query.barcode = item.rawBarcode;
          else query.name = { $regex: new RegExp(`^${item.rawProductName}$`, "i") };

          const product = await ProductModel.findOne(query);
          if (!product) {
            throw new Error(
              `Row ${item.rowIndex}: Product "${item.rawProductName || item.rawBarcode}" not found${branchId ? " in this branch" : ""}`
            );
          }

          // Stock check
          if (product.stock < item.qty) {
            stockIssues.push(
              `Row ${item.rowIndex}: "${product.name}" has only ${product.stock} in stock, requested ${item.qty}`
            );
            throw new Error(`Insufficient stock for "${product.name}" (available: ${product.stock})`);
          }

          const unitPrice = item.unitPrice ?? product.price;
          const lineTotal = unitPrice * item.qty * (1 - item.discount / 100);
          subtotal += lineTotal;

          // Track stock before deduction (use current stock first time we see this product)
          const pid = String(product._id);
          if (!stockLedgerMap.has(pid)) {
            stockLedgerMap.set(pid, {
              productName: product.name,
              barcode: product.barcode || "",
              stockBefore: product.stock,
              soldQty: 0,
            });
          }
          stockLedgerMap.get(pid).soldQty += item.qty;

          processedItems.push({
            product: product._id,
            productName: product.name,
            barcode: product.barcode || "",
            qty: item.qty,
            unitPrice,
            costPrice: product.costPrice || 0,
            discount: item.discount,
            total: lineTotal,
          });
        }

        const grandTotal = subtotal;

        // Deduct stock for all items in this order
        for (const item of processedItems) {
          await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
        }

        const savedOrder = await SalesOrder.create({
          branch: branchId,
          uploadedBy,
          date: new Date(order.date),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          paymentMode: order.paymentMode,
          notes: order.notes,
          items: processedItems,
          subtotal,
          grandTotal,
          status: "CONFIRMED",
          source: "EXCEL_IMPORT",
        });

        // If placed by a CUSTOMER account, also create an Invoice
        // so it appears in Order History and Invoice List
        if (req.user.role === "CUSTOMER") {
          const invoiceItems = processedItems.map(item => ({
            product:     item.product,
            productName: item.productName,
            barcode:     item.barcode,
            qty:         item.qty,
            unitPrice:   item.unitPrice,
            costPrice:   item.costPrice || 0,
            discount:    item.discount || 0,
            taxRate:     0,
            total:       item.total,
          }));

          // Cash on Delivery = payment not yet received, mark as PENDING
          const isCOD = !order.paymentMode || order.paymentMode === "CASH";

          // Map SalesOrder paymentMode → Invoice paymentMode enum
          const invoicePaymentMode = {
            CASH: "CASH", CARD: "CARD", UPI: "UPI",
            BANK_TRANSFER: "BANK", CREDIT: "OTHER", OTHER: "OTHER",
          }[order.paymentMode] || "CASH";

          await Invoice.create({
            branch:          branchId,
            cashier:         uploadedBy,
            customerId:      uploadedBy,
            customerName:    order.customerName,
            customerPhone:   order.customerPhone,
            items:           invoiceItems,
            subtotal,
            discountAmount:  0,
            discountPercent: 0,
            taxAmount:       0,
            grandTotal,
            paymentMode:     invoicePaymentMode,
            amountPaid:      isCOD ? 0 : grandTotal,
            change:          0,
            notes:           order.notes,
            status:          isCOD ? "PENDING" : "PAID",
            discountApproved: true,
          });
        }

        created.push(savedOrder._id);
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Build final stock ledger with stockAfter values
    const stockAdjustments = Array.from(stockLedgerMap.values()).map((entry) => ({
      productName: entry.productName,
      barcode: entry.barcode,
      stockBefore: entry.stockBefore,
      soldQty: entry.soldQty,
      stockAfter: entry.stockBefore - entry.soldQty,
    }));

    res.json({
      success: true,
      ordersCreated: created.length,
      errors,
      stockWarnings: stockIssues,
      stockAdjustments,  // <-- full before/after ledger
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET ALL SALES ORDERS
   GET /api/sales-orders
───────────────────────────────────────────── */
exports.getSalesOrders = async (req, res) => {
  try {
    const filter = { ...(req.branchFilter || {}) };
    const { from, to, status, date } = req.query;

    // CUSTOMER role: only show their own placed orders
    if (req.user.role === "CUSTOMER") {
      filter.uploadedBy = req.user._id || req.user.id;
    }

    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status) filter.status = status;

    const orders = await SalesOrder.find(filter)
      .populate({ path: "branch", select: "branchName city" })
      .populate({ path: "uploadedBy", select: "name email role" })
      .sort({ date: -1, createdAt: -1 })
      .limit(500);

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   GET SINGLE SALES ORDER
   GET /api/sales-orders/:id
───────────────────────────────────────────── */
exports.getSalesOrder = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(req.branchFilter || {}) };

    // CUSTOMER can only view their own order
    if (req.user.role === "CUSTOMER") {
      filter.uploadedBy = req.user._id || req.user.id;
    }

    const order = await SalesOrder.findOne(filter)
      .populate({ path: "branch", select: "branchName city" })
      .populate({ path: "uploadedBy", select: "name email role" })
      .populate({ path: "items.product", select: "name barcode stock" });
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   DELETE / CANCEL SALES ORDER (restock)
   DELETE /api/sales-orders/:id
───────────────────────────────────────────── */
exports.cancelSalesOrder = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(req.branchFilter || {}) };
    const order = await SalesOrder.findOne(filter);
    if (!order) return res.status(404).json({ message: "Sales order not found" });
    if (order.status === "CANCELLED") return res.status(400).json({ message: "Already cancelled" });

    // Restock
    for (const item of order.items) {
      if (item.product) {
        await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
      }
    }
    order.status = "CANCELLED";
    await order.save();
    res.json({ message: "Sales order cancelled and stock restored", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ─────────────────────────────────────────────
   SUMMARY: sales orders grouped by date
   GET /api/sales-orders/summary
───────────────────────────────────────────── */
exports.getSalesSummary = async (req, res) => {
  try {
    const branchFilter = req.branchFilter || {};
    const { from, to } = req.query;
    const matchFilter = { ...branchFilter, status: { $ne: "CANCELLED" } };

    if (from || to) {
      matchFilter.date = {};
      if (from) matchFilter.date.$gte = new Date(from);
      if (to) matchFilter.date.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    const summary = await SalesOrder.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalItems: { $sum: { $sum: "$items.qty" } },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 60 },
    ]);

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};