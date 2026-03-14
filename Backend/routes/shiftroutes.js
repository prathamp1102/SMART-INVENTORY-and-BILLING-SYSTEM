const express = require("express");
const router = express.Router();
const { createShift, getShifts, updateShift, deleteShift } = require("../controllers/shiftcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/",      protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, createShift);
router.get("/",       protect, branchScope, getShifts);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updateShift);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deleteShift);

module.exports = router;
