const Brand = require("../models/BrandModel");

const BRANCH_POPULATE = {
  path: "branch",
  select: "branchName city status organization",
  populate: { path: "organization", select: "name" },
};

exports.addBrand = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Brand name is required" });

    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId)
      return res.status(403).json({ message: "Admin has no branch assigned" });

    // Check duplicate
    const exists = await Brand.findOne({ name: name.trim(), branch: branchId });
    if (exists) return res.status(400).json({ message: "Brand already exists" });

    const brand = await Brand.create({
      name: name.trim(),
      description: description?.trim() || undefined,
      status: status || "ACTIVE",
      branch: branchId,
    });
    await brand.populate(BRANCH_POPULATE);
    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getBrands = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const brands = await Brand.find(filter).populate(BRANCH_POPULATE).sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSingleBrand = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const brand = await Brand.findOne(filter).populate(BRANCH_POPULATE);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const updateData = { ...req.body };
    if (req.user.role === "ADMIN") delete updateData.branch;
    const brand = await Brand.findOneAndUpdate(filter, updateData, { new: true, runValidators: true }).populate(BRANCH_POPULATE);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const brand = await Brand.findOneAndDelete(filter);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
