const express = require("express");
const router = express.Router();
const {
  importOrganizations,
  importBranches,
  importUsers,
  importCategories,
  importSuppliers,
  importProducts,
  importInventory,
  importAttendance,
} = require("../controllers/importcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");

// All import routes require authentication
// Super Admin can import everything; Admin can import branch-level data
const SA = ["SUPER_ADMIN"];
const SA_ADMIN = ["SUPER_ADMIN", "ADMIN"];

router.post("/organizations", protect, authorize(...SA), importOrganizations);
router.post("/branches",      protect, authorize(...SA), importBranches);
router.post("/users",         protect, authorize(...SA), importUsers);
router.post("/categories",    protect, authorize(...SA_ADMIN), importCategories);
router.post("/suppliers",     protect, authorize(...SA_ADMIN), importSuppliers);
router.post("/products",      protect, authorize(...SA_ADMIN), importProducts);
router.post("/inventory",     protect, authorize(...SA_ADMIN), importInventory);
router.post("/attendance",    protect, authorize(...SA_ADMIN), importAttendance);

module.exports = router;
