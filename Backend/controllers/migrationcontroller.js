const ProductModel  = require("../models/Productmodel");
const CategoryModel = require("../models/Categorymodel");
const Supplier      = require("../models/Suppliermodel");
const BranchModel   = require("../models/BranchModel");

const BRANCH_POPULATE = {
  path: "branch",
  select: "branchName city status organization",
  populate: { path: "organization", select: "name city status" },
};

/**
 * GET /api/migration/unassigned-summary
 * Returns counts of unassigned records per type
 */
exports.getUnassignedSummary = async (req, res) => {
  try {
    const [products, categories, suppliers, branches] = await Promise.all([
      ProductModel.countDocuments({ branch: null }),
      CategoryModel.countDocuments({ branch: null }),
      Supplier.countDocuments({ branch: null }),
      BranchModel.find().populate("organization", "name").sort({ createdAt: -1 }),
    ]);
    res.json({ products, categories, suppliers, branches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/migration/assign-branch
 * Body: { branchId, types: ["products","categories","suppliers"] }
 * Bulk-assigns a branch to all null-branch records of specified types
 */
exports.assignBranchToUnassigned = async (req, res) => {
  try {
    const { branchId, types = ["products", "categories", "suppliers"] } = req.body;
    if (!branchId) return res.status(400).json({ message: "branchId is required" });

    const branch = await BranchModel.findById(branchId).populate("organization", "name");
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    const results = {};
    if (types.includes("products")) {
      const r = await ProductModel.updateMany({ branch: null }, { branch: branchId });
      results.products = r.modifiedCount;
    }
    if (types.includes("categories")) {
      const r = await CategoryModel.updateMany({ branch: null }, { branch: branchId });
      results.categories = r.modifiedCount;
    }
    if (types.includes("suppliers")) {
      const r = await Supplier.updateMany({ branch: null }, { branch: branchId });
      results.suppliers = r.modifiedCount;
    }

    res.json({
      message: "Branch assigned successfully",
      branch: { _id: branch._id, branchName: branch.branchName, organization: branch.organization },
      updated: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/migration/assign-branch-to-record
 * Body: { type: "product"|"category"|"supplier", id, branchId }
 * Assigns branch to a single specific record
 */
exports.assignBranchToRecord = async (req, res) => {
  try {
    const { type, id, branchId } = req.body;
    if (!type || !id || !branchId) return res.status(400).json({ message: "type, id and branchId are required" });

    const ModelMap = { product: ProductModel, category: CategoryModel, supplier: Supplier };
    const Model = ModelMap[type];
    if (!Model) return res.status(400).json({ message: "Invalid type. Use: product, category, supplier" });

    const record = await Model.findByIdAndUpdate(id, { branch: branchId }, { new: true }).populate(BRANCH_POPULATE);
    if (!record) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Branch assigned", record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
