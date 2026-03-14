const express = require("express");
const router = express.Router();
const { createPO, getPOs, getSinglePO, updatePO, deletePO } = require("../controllers/purchaseordercontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/",      protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, createPO);
router.get("/",       protect, branchScope, getPOs);
router.get("/:id",    protect, branchScope, getSinglePO);
router.put("/:id",    protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, updatePO);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deletePO);

module.exports = router;
