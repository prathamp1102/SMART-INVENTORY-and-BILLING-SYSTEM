const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl    = require("../controllers/taxSettingsController");

const SA = "SUPER_ADMIN";
const AD = "ADMIN";

router.use(protect);

// Super Admin: view all org configs in one call
router.get("/all",              authorize(SA),      ctrl.getAllTaxConfigs);  // GET /api/settings/tax/all

// Both SA and Admin can read (Admin auto-scoped to their org/branch)
router.get("/",                 authorize(SA, AD),  ctrl.getTaxConfig);     // GET /api/settings/tax?org=&branch=
router.put("/",                 authorize(SA, AD),  ctrl.saveTaxConfig);    // PUT /api/settings/tax

// Tax rate CRUD — SA can edit any, Admin can edit their own branch
router.post("/rates",           authorize(SA, AD),  ctrl.addTaxRate);
router.put("/rates/:rateId",    authorize(SA, AD),  ctrl.updateTaxRate);
router.delete("/rates/:rateId", authorize(SA, AD),  ctrl.deleteTaxRate);

module.exports = router;
