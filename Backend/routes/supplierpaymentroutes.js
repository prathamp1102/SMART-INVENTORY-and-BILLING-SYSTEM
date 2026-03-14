const express = require("express");
const router = express.Router();
const { createPayment, getPayments, deletePayment } = require("../controllers/supplierpaymentcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

router.post("/",      protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, createPayment);
router.get("/",       protect, branchScope, getPayments);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, deletePayment);

module.exports = router;
