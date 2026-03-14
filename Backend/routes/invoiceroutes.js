const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const ctrl = require("../controllers/invoicecontroller");

router.post("/",                protect, branchScope, ctrl.createInvoice);
router.get("/",                 protect, branchScope, ctrl.getInvoices);
router.get("/summary/today",    protect, branchScope, ctrl.getTodaySummary);
router.get("/smtp-test",        protect, authorize("ADMIN","SUPER_ADMIN"), ctrl.smtpTest);
router.get("/:id",              protect, branchScope, ctrl.getInvoice);
router.put("/:id",              protect, authorize("ADMIN","SUPER_ADMIN"), branchScope, ctrl.updateInvoice);
router.delete("/:id",           protect, authorize("ADMIN","SUPER_ADMIN"), branchScope, ctrl.cancelInvoice);
router.post("/:id/send-email",  protect, branchScope, ctrl.sendInvoiceEmailManual);

module.exports = router;
