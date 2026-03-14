const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");

const {
  importSalesOrders,
  getSalesOrders,
  getSalesOrder,
  cancelSalesOrder,
  getSalesSummary,
} = require("../controllers/salesOrderController");

// All routes require authentication + branch scoping
router.use(protect);
router.use(branchScope);

// ADMIN, STAFF, and CUSTOMER can import/place orders; only ADMIN can cancel
router.post(
  "/import",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"),
  importSalesOrders
);

router.get(
  "/",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"),
  getSalesOrders
);

router.get(
  "/summary",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF"),
  getSalesSummary
);

router.get(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"),
  getSalesOrder
);

router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "ADMIN"),
  cancelSalesOrder
);

module.exports = router;
