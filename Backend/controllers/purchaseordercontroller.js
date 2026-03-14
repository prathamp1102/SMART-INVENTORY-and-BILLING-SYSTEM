const PurchaseOrder = require("../models/PurchaseOrderModel");
const ProductModel = require("../models/Productmodel");

const SUPPLIER_POP = { path: "supplier", select: "supplierName companyName phoneNumber" };
const BRANCH_POP = { path: "branch", select: "branchName city" };
const ITEM_POP = { path: "items.product", select: "name barcode costPrice stock" };

exports.createPO = async (req, res) => {
  try {
    const { supplier, items, expectedDate, notes } = req.body;
    if (!supplier) return res.status(400).json({ message: "Supplier is required" });
    if (!items || !items.length) return res.status(400).json({ message: "At least one item required" });

    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId)
      return res.status(403).json({ message: "Admin has no branch assigned" });

    // Coerce types to avoid Mongoose cast/validation errors
    const mappedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product) return res.status(400).json({ message: "Item " + (i + 1) + ": product is required" });
      const qty  = Number(item.quantity);
      const cost = Number(item.unitCost);
      if (!qty || qty < 1)        return res.status(400).json({ message: "Item " + (i + 1) + ": quantity must be >= 1" });
      if (isNaN(cost) || cost < 0) return res.status(400).json({ message: "Item " + (i + 1) + ": unitCost must be a valid number" });
      mappedItems.push({
        product:     item.product,
        productName: item.productName || "",
        quantity:    qty,
        unitCost:    cost,
      });
    }

    const po = await PurchaseOrder.create({
      supplier,
      branch: branchId,
      items: mappedItems,
      expectedDate: expectedDate || undefined,
      notes: notes || undefined,
      createdBy: req.user._id || req.user.id,
      status: req.body.status || "ORDERED",
    });

    await po.populate([SUPPLIER_POP, BRANCH_POP, ITEM_POP]);
    res.status(201).json(po);
  } catch (err) {
    console.error("createPO error:", err.message, err.stack);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(err.errors).map(function(e){ return e.message; }).join(", ") });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.getPOs = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const pos = await PurchaseOrder.find(filter)
      .populate(SUPPLIER_POP).populate(BRANCH_POP)
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSinglePO = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const po = await PurchaseOrder.findOne(filter)
      .populate(SUPPLIER_POP).populate(BRANCH_POP).populate(ITEM_POP);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    res.json(po);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updatePO = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const po = await PurchaseOrder.findOne(filter);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    if (po.status === "CANCELLED") return res.status(400).json({ message: "Cannot update a cancelled PO" });

    Object.assign(po, {
      status: req.body.status || po.status,
      notes: req.body.notes !== undefined ? req.body.notes : po.notes,
      expectedDate: req.body.expectedDate !== undefined ? req.body.expectedDate : po.expectedDate,
      paidAmount: req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : po.paidAmount,
    });

    // If marking as RECEIVED, update stock
    if (req.body.status === "RECEIVED" && po.status !== "RECEIVED") {
      for (const item of po.items) {
        await ProductModel.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
      po.receivedDate = new Date();
    }

    await po.save();
    await po.populate([SUPPLIER_POP, BRANCH_POP, ITEM_POP]);
    res.json(po);
  } catch (err) {
    console.error("updatePO error:", err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.deletePO = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const po = await PurchaseOrder.findOneAndDelete(filter);
    if (!po) return res.status(404).json({ message: "Purchase order not found" });
    res.json({ message: "Purchase order deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
