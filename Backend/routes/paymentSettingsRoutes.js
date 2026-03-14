const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl       = require("../controllers/paymentSettingsController");

const guard = [protect, authorize("ADMIN", "SUPER_ADMIN")];

router.get("/",        ...guard, ctrl.getPaymentSettings);
router.put("/",        ...guard, ctrl.savePaymentSettings);
router.get("/public",  ctrl.getPublicPaymentSettings);   // no auth — used by POS

module.exports = router;
