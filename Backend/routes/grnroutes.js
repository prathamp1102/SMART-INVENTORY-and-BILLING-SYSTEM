const express = require("express");
const router  = express.Router();
const { createGRN, getGRNs, getSingleGRN } = require("../controllers/grncontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, createGRN);
router.get("/",     protect, branchScope, getGRNs);
router.get("/:id",  protect, branchScope, getSingleGRN);

module.exports = router;
