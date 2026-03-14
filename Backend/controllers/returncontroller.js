const Return = require("../models/ReturnModel");
const ProductModel = require("../models/Productmodel");
const Invoice = require("../models/InvoiceModel");
const UserModel = require("../models/Usermodel");
const { sendReturnReceiptEmail, sendReturnStatusEmail, sendRefundPaymentEmail } = require("../utils/emailService");

const POP_STAFF    = { path: "processedBy", select: "name email" };
const POP_BRANCH   = { path: "branch", select: "branchName city" };
const POP_APPROVER = { path: "approvedBy", select: "name email" };

// POST /api/returns
exports.createReturn = async (req, res) => {
  try {
    const {
      invoiceNo, invoice: invoiceId,
      customerName, customerPhone, customerEmail,
      items, refundMethod = "CASH", reason, notes, restockItems = true,
    } = req.body;

    if (!items?.length) return res.status(400).json({ message: "At least one item required" });

    // Resolve branch — start with what branchScope provided
    let branchId = req.userBranch || req.body.branch || null;

    // For CUSTOMER role: resolve email/name/phone from their DB account,
    // and resolve branch from their user record or the referenced invoice
    let resolvedEmail = customerEmail || null;
    let resolvedName  = customerName  || "Walk-in Customer";
    let resolvedPhone = customerPhone || null;

    if (req.user.role === "CUSTOMER") {
      try {
        const userId = req.user._id || req.user.id;
        const dbUser = await UserModel.findById(userId).select("name email phone branch").lean();
        if (dbUser) {
          resolvedEmail = dbUser.email || resolvedEmail;
          resolvedName  = dbUser.name  || resolvedName;
          resolvedPhone = dbUser.phone || resolvedPhone;
          // Use customer's own branch if set
          if (!branchId && dbUser.branch) branchId = dbUser.branch;
        }
      } catch (e) {
        console.error("[ReturnCreate] Could not fetch user details:", e.message);
      }

      // Fallback: pull branch from the referenced invoice
      if (!branchId && invoiceNo) {
        try {
          const inv = await Invoice.findOne({ invoiceNo }).select("branch").lean();
          if (inv?.branch) branchId = inv.branch;
        } catch (_) {}
      }
    }

    const processedItems = items.map(item => ({
      product:     item.product || null,
      productName: item.productName,
      qty:         item.qty,
      unitPrice:   item.unitPrice,
      total:       item.qty * item.unitPrice,
      reason:      item.reason || reason,
    }));

    const returnAmount = processedItems.reduce((s, i) => s + i.total, 0);

    const ret = await Return.create({
      branch:        branchId,
      processedBy:   req.user._id || req.user.id,
      submittedBy:   req.user._id || req.user.id,
      invoice:       invoiceId || null,
      invoiceNo:     invoiceNo || null,
      customerName:  resolvedName,
      customerPhone: resolvedPhone,
      customerEmail: resolvedEmail,
      items:         processedItems,
      returnAmount,
      refundMethod,
      reason,
      notes,
      restockItems,
      status: (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") ? "APPROVED" : "PENDING",
    });

    // If approved right away and restock, update stock
    if (ret.status === "APPROVED" && restockItems) {
      for (const item of processedItems) {
        if (item.product) {
          await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
        }
      }
    }

    await ret.populate([POP_STAFF, POP_BRANCH]);

    // Always send receipt email to customer (non-blocking)
    if (resolvedEmail) {
      sendReturnReceiptEmail(resolvedEmail, ret).catch(err =>
        console.error("[ReturnEmail] Failed to send receipt email:", err.message)
      );
    }

    res.status(201).json(ret);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/returns
exports.getReturns = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = {};

    if (role === "CUSTOMER") {
      // Customers only see their own returns
      filter.submittedBy = req.user._id || req.user.id;

    } else if (role === "SUPER_ADMIN") {
      // Super Admin sees everything — no filter
      if (req.query.status) filter.status = req.query.status;

    } else {
      // ADMIN / STAFF — see returns from their branch OR returns with no branch
      // (customer-submitted returns may have null branch if customer has no branch set)
      const branchFilter = req.branchFilter || {};
      if (branchFilter.branch) {
        filter.$or = [
          { branch: branchFilter.branch },
          { branch: null },
        ];
      }
      // else no branch restriction (STAFF with no branch sees everything)
    }

    if (req.query.status) filter.status = req.query.status;

    const returns = await Return.find(filter)
      .populate(POP_STAFF)
      .populate(POP_BRANCH)
      .populate(POP_APPROVER)
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/returns/:id
exports.getReturn = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = { _id: req.params.id };

    if (role === "CUSTOMER") {
      // Customers can only fetch their own return
      filter.submittedBy = req.user._id || req.user.id;
    } else if (role !== "SUPER_ADMIN") {
      // ADMIN / STAFF — can access returns from their branch OR branch-less returns
      const branchFilter = req.branchFilter || {};
      if (branchFilter.branch) {
        filter.$or = [
          { branch: branchFilter.branch },
          { branch: null },
        ];
      }
    }

    const ret = await Return.findOne(filter)
      .populate(POP_STAFF).populate(POP_BRANCH).populate(POP_APPROVER);
    if (!ret) return res.status(404).json({ message: "Return not found" });
    res.json(ret);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/returns/:id  — Admin/Staff approves/rejects/completes
exports.updateReturn = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = { _id: req.params.id };

    if (role !== "SUPER_ADMIN") {
      const branchFilter = req.branchFilter || {};
      if (branchFilter.branch) {
        filter.$or = [
          { branch: branchFilter.branch },
          { branch: null },
        ];
      }
    }

    const ret = await Return.findOne(filter);
    if (!ret) return res.status(404).json({ message: "Return not found" });

    const prevStatus = ret.status;

    if (req.body.status) {
      const newStatus = req.body.status;

      const staffAllowedTransitions = ["APPROVED", "REJECTED", "COMPLETED"];
      if (role === "STAFF" && !staffAllowedTransitions.includes(newStatus)) {
        return res.status(403).json({ message: "Staff can only approve or reject returns." });
      }

      ret.status     = newStatus;
      ret.approvedBy = req.user._id || req.user.id;

      // If just approved, restock items
      if (newStatus === "APPROVED" && prevStatus !== "APPROVED" && ret.restockItems) {
        for (const item of ret.items) {
          if (item.product) {
            await ProductModel.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
          }
        }
      }
    }
    if (req.body.notes        !== undefined) ret.notes        = req.body.notes;
    if (req.body.refundMethod !== undefined) ret.refundMethod = req.body.refundMethod;

    await ret.save();
    await ret.populate([POP_STAFF, POP_BRANCH, POP_APPROVER]);

    // Fire emails based on status change (non-blocking)
    const emailTo = ret.customerEmail;
    if (emailTo && req.body.status && req.body.status !== prevStatus) {
      const newStatus = req.body.status;

      if (newStatus === "APPROVED" || newStatus === "REJECTED") {
        sendReturnStatusEmail(emailTo, ret).catch(err =>
          console.error("[ReturnEmail] Status email failed:", err.message)
        );
      }
      if (newStatus === "COMPLETED") {
        sendRefundPaymentEmail(emailTo, ret).catch(err =>
          console.error("[ReturnEmail] Refund payment email failed:", err.message)
        );
      }
    }

    res.json(ret);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/returns/:id
exports.deleteReturn = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = { _id: req.params.id };

    if (role !== "SUPER_ADMIN") {
      const branchFilter = req.branchFilter || {};
      if (branchFilter.branch) {
        filter.$or = [
          { branch: branchFilter.branch },
          { branch: null },
        ];
      }
    }

    const ret = await Return.findOneAndDelete(filter);
    if (!ret) return res.status(404).json({ message: "Return not found" });
    res.json({ message: "Return deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
