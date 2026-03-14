const CategoryModel = require("../models/Categorymodel");

const BRANCH_POPULATE = {
  path: "branch",
  select: "branchName city status organization",
  populate: { path: "organization", select: "name city status" },
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description, branch: bodyBranch } = req.body;
    let branchId;
    if (req.user.role === "ADMIN") {
      branchId = req.userBranch;
      if (!branchId) return res.status(403).json({ message: "Admin has no branch assigned" });
    } else {
      // SUPER_ADMIN: branch is optional, can be set explicitly
      branchId = bodyBranch || null;
    }
    const existing = await CategoryModel.findOne({ name, branch: branchId });
    if (existing) return res.status(400).json({ message: "Category already exists in this branch" });
    const category = await CategoryModel.create({ name, description, createdBy: req.user.id, branch: branchId });
    await category.populate(BRANCH_POPULATE);
    res.status(201).json({ message: "Category added successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const categories = await CategoryModel.find(filter).populate(BRANCH_POPULATE).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const category = await CategoryModel.findOne(filter).populate(BRANCH_POPULATE);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive, branch: bodyBranch } = req.body;
    const filter = { _id: req.params.id, ...req.branchFilter };
    const category = await CategoryModel.findOne(filter);
    if (!category) return res.status(404).json({ message: "Category not found" });
    category.name        = name        !== undefined ? name        : category.name;
    category.description = description !== undefined ? description : category.description;
    category.isActive    = isActive    !== undefined ? isActive    : category.isActive;
    // SUPER_ADMIN can reassign to a different branch
    if (req.user.role === "SUPER_ADMIN" && bodyBranch !== undefined) {
      category.branch = bodyBranch || null;
    }
    await category.save();
    await category.populate(BRANCH_POPULATE);
    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const category = await CategoryModel.findOne(filter);
    if (!category) return res.status(404).json({ message: "Category not found" });
    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
