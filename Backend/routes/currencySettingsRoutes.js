const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl    = require("../controllers/currencySettingsController");

const SA = "SUPER_ADMIN";

router.use(protect, authorize(SA));

router.get("/", ctrl.getCurrencyConfig);   // GET /api/settings/currency
router.put("/", ctrl.saveCurrencyConfig);  // PUT /api/settings/currency

module.exports = router;
