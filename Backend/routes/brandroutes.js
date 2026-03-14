const express = require("express");
const router = express.Router();
const { addBrand, getBrands, getSingleBrand, updateBrand, deleteBrand } = require("../controllers/brandcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/add",   protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, addBrand);
router.get("/",       protect, branchScope, getBrands);
router.get("/:id",    protect, branchScope, getSingleBrand);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updateBrand);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deleteBrand);

module.exports = router;
