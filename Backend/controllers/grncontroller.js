const GRN          = require("../models/GrnModel");
const ProductModel = require("../models/Productmodel");

const SUPPLIER_POP = { path: "supplier", select: "supplierName companyName phoneNumber" };
const BRANCH_POP   = { path: "branch",   select: "branchName city" };
const USER_POP     = { path: "createdBy", select: "name email" };
const ITEM_POP     = { path: "items.product", select: "name barcode costPrice stock" };

// POST /api/grn
exports.createGRN = async (req, res) => {
  try {
    const { supplier, invoiceNo, receivedDate, notes, items, purchaseOrder } = req.body;

    // Debug — shows exactly what arrives from frontend
    console.log("GRN POST body:", JSON.stringify({ supplier, items }, null, 2));

    if (!supplier) return res.status(400).json({ message: "Supplier is required" });
    if (!items || !items.length) return res.status(400).json({ message: "At least one item is required" });

    // Coerce qty to number before comparing — form inputs send strings
    const badItem = items.find(i => !i.product || Number(i.qty) < 1);
    if (badItem) return res.status(400).json({ message: "Each item needs a product and valid quantity" });

    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId)
      return res.status(403).json({ message: "Admin has no branch assigned" });

    // Enrich items with product names
    const enrichedItems = await Promise.all(
      items.map(async (i) => {
        const prod = await ProductModel.findById(i.product).select("name costPrice");
        return {
          product:     i.product,
          productName: prod ? prod.name : (i.productName || ""),
          qty:         Number(i.qty),
          costPrice:   Number(i.costPrice) || (prod ? prod.costPrice : 0) || 0,
        };
      })
    );

    const grn = await GRN.create({
      supplier,
      branch:        branchId,
      purchaseOrder: purchaseOrder || undefined,
      invoiceNo:     invoiceNo || "",
      receivedDate:  receivedDate || new Date(),
      notes:         notes || "",
      items:         enrichedItems,
      createdBy:     req.user._id || req.user.id,
    });

    // Increment stock for each product
    for (const item of enrichedItems) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    }

    await grn.populate([SUPPLIER_POP, BRANCH_POP, USER_POP]);
    res.status(201).json(grn);
  } catch (err) {
    console.error("GRN createGRN error:", err.message, err.errors);
    res.status(400).json({ message: err.message });
  }
};

// GET /api/grn
exports.getGRNs = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const grns = await GRN.find(filter)
      .populate(SUPPLIER_POP)
      .populate(BRANCH_POP)
      .populate(USER_POP)
      .sort({ createdAt: -1 });
    res.json(grns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/grn/:id
exports.getSingleGRN = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(req.branchFilter || {}) };
    const grn = await GRN.findOne(filter)
      .populate(SUPPLIER_POP)
      .populate(BRANCH_POP)
      .populate(USER_POP)
      .populate(ITEM_POP);
    if (!grn) return res.status(404).json({ message: "GRN not found" });
    res.json(grn);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};