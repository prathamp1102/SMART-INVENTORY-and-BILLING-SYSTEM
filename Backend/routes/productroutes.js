const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const {
  addProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productcontroller");

router.get("/",       protect, branchScope, getProducts);
router.get("/:id",    protect, branchScope, getSingleProduct);
router.post("/add",   protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, addProduct);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updateProduct);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deleteProduct);

module.exports = router;
