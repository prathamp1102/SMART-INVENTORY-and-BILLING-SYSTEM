const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl       = require("../controllers/superAdminController");

// All routes: must be logged in + SUPER_ADMIN only
router.use(protect, authorize("SUPER_ADMIN"));

router.get("/dashboard",            ctrl.getDashboardSummary);
router.get("/reports/sales",        ctrl.getSalesReport);
router.get("/reports/inventory",    ctrl.getInventoryReport);
router.get("/reports/branches",     ctrl.getBranchReport);
router.get("/reports/profit-loss",  ctrl.getProfitLossReport);
router.get("/logs",                 ctrl.getSystemLogs);

module.exports = router;