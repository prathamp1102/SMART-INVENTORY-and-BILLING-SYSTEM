const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const {
  addCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categorycontroller");

router.post("/add",   protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, addCategory);
router.get("/",       protect, branchScope, getCategories);
router.get("/:id",    protect, branchScope, getCategoryById);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updateCategory);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deleteCategory);

module.exports = router;
