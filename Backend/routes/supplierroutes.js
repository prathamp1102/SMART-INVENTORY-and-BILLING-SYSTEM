const express = require("express");
const router = express.Router();
const {
  addSupplier,
  getSuppliers,
  getSingleSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/suppliercontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/add",   protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, addSupplier);
router.get("/",       protect, branchScope, getSuppliers);
router.get("/:id",    protect, branchScope, getSingleSupplier);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updateSupplier);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deleteSupplier);

module.exports = router;
