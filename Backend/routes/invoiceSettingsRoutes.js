const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl    = require("../controllers/invoiceSettingsController");

const SA = "SUPER_ADMIN";
const AD = "ADMIN";

router.use(protect);

// SA only: all org invoice configs
router.get("/all", authorize(SA),     ctrl.getAllInvoiceConfigs); // GET /api/settings/invoice/all

// SA + Admin: get/save (auto-scoped for Admin)
router.get("/",    authorize(SA, AD), ctrl.getInvoiceConfig);    // GET /api/settings/invoice?org=
router.put("/",    authorize(SA, AD), ctrl.saveInvoiceConfig);   // PUT /api/settings/invoice

module.exports = router;
