const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const ctrl       = require("../controllers/dashboardController");

// Admin & Super Admin both can call this
router.get("/admin", protect, authorize("ADMIN", "SUPER_ADMIN"), branchScope, ctrl.getAdminDashboard);

module.exports = router;
