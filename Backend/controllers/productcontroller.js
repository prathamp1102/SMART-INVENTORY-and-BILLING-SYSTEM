const ProductModel = require("../models/Productmodel");

const BRANCH_POPULATE = {
  path: "branch",
  select: "branchName city status organization",
  populate: { path: "organization", select: "name city status" },
};

// ➕ Add Product
exports.addProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.user.role === "ADMIN") {
      if (!req.userBranch) return res.status(403).json({ message: "Admin has no branch assigned" });
      productData.branch = req.userBranch;
    }
    const product = await ProductModel.create(productData);
    await product.populate(["category", "supplier", "brand", BRANCH_POPULATE]);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📋 Get All Products
exports.getProducts = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    const products = await ProductModel
      .find(filter)
      .populate("category")
      .populate("supplier")
      .populate("brand")
      .populate(BRANCH_POPULATE)
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Single Product
exports.getSingleProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const product = await ProductModel
      .findOne(filter)
      .populate("category")
      .populate("supplier")
      .populate("brand")
      .populate(BRANCH_POPULATE);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update Product
exports.updateProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const updateData = { ...req.body };
    if (req.user.role === "ADMIN") delete updateData.branch;
    const product = await ProductModel.findOneAndUpdate(filter, updateData, { new: true, runValidators: true })
      .populate("category").populate("supplier").populate("brand").populate(BRANCH_POPULATE);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ❌ Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const product = await ProductModel.findOneAndDelete(filter);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
