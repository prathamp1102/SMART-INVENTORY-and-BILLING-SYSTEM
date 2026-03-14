const SupplierPayment = require("../models/SupplierPaymentModel");
const PurchaseOrder = require("../models/PurchaseOrderModel");

const SUPPLIER_POP = { path: "supplier", select: "supplierName companyName" };
const BRANCH_POP = { path: "branch", select: "branchName city" };
const PO_POP = { path: "purchaseOrder", select: "poNumber totalAmount paidAmount" };

exports.createPayment = async (req, res) => {
  try {
    const { supplier, purchaseOrder, amount, paymentMode, referenceNo, notes, paidOn } = req.body;
    if (!supplier) return res.status(400).json({ message: "Supplier is required" });
    if (!amount || amount <= 0) return res.status(400).json({ message: "Valid amount is required" });

    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId)
      return res.status(403).json({ message: "Admin has no branch assigned" });

    const payment = await SupplierPayment.create({
      supplier,
      purchaseOrder: purchaseOrder || null,
      branch: branchId,
      amount,
      paymentMode: paymentMode || "CASH",
      referenceNo: referenceNo || undefined,
      notes: notes || undefined,
      paidOn: paidOn ? new Date(paidOn) : new Date(),
      createdBy: req.user._id || req.user.id,
    });

    // Update paid amount on PO if linked
    if (purchaseOrder) {
      const po = await PurchaseOrder.findById(purchaseOrder);
      if (po) {
        po.paidAmount = (po.paidAmount || 0) + amount;
        po.dueAmount = po.totalAmount - po.paidAmount;
        await po.save();
      }
    }

    await payment.populate([SUPPLIER_POP, BRANCH_POP, PO_POP]);
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    if (req.query.supplier) filter.supplier = req.query.supplier;
    const payments = await SupplierPayment.find(filter)
      .populate(SUPPLIER_POP).populate(BRANCH_POP).populate(PO_POP)
      .sort({ paidOn: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const payment = await SupplierPayment.findOneAndDelete(filter);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
