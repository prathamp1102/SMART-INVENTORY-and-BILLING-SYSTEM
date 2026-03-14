const Supplier = require("../models/Suppliermodel");

const BRANCH_POPULATE = {
  path: "branch",
  select: "branchName city status organization",
  populate: { path: "organization", select: "name city status" },
};

exports.addSupplier = async (req, res) => {
  try {
    const { supplierName, companyName, gstNumber, phoneNumber, email, address, city, state, bankDetails, openingBalance, status } = req.body;
    if (!supplierName?.trim()) return res.status(400).json({ message: "Supplier name is required" });
    if (!phoneNumber?.trim()) return res.status(400).json({ message: "Phone number is required" });
    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId) return res.status(403).json({ message: "Admin has no branch assigned" });
    const supplier = await Supplier.create({
      supplierName: supplierName.trim(),
      companyName:  companyName?.trim()  || undefined,
      gstNumber:    gstNumber?.trim()    || undefined,
      phoneNumber:  phoneNumber.trim(),
      email:        email?.trim()        || undefined,
      address:      address?.trim()      || undefined,
      city:         city?.trim()         || undefined,
      state:        state                || undefined,
      openingBalance: openingBalance ?? 0,
      status:       status || "ACTIVE",
      bankDetails:  bankDetails || {},
      branch:       branchId,
    });
    await supplier.populate(BRANCH_POPULATE);
    res.status(201).json(supplier);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(", ") });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const suppliers = await Supplier.find(filter).populate(BRANCH_POPULATE).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSingleSupplier = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const supplier = await Supplier.findOne(filter).populate(BRANCH_POPULATE);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const updateData = { ...req.body };
    if (req.user.role === "ADMIN") delete updateData.branch;
    const supplier = await Supplier.findOneAndUpdate(filter, updateData, { new: true, runValidators: true }).populate(BRANCH_POPULATE);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(", ") });
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const supplier = await Supplier.findOneAndDelete(filter);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
