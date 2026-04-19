const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const {
  getSalesReport,
  getProfitLossReport,
  getPurchaseReport,
  getStockMovementReport,
} = require("../controllers/reportController");

const guard = [protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope];

router.get("/sales",        ...guard, getSalesReport);
router.get("/profit-loss",  ...guard, getProfitLossReport);
router.get("/purchase",     ...guard, getPurchaseReport);
router.get("/stock-movements", protect, branchScope, getStockMovementReport);

module.exports = router;
