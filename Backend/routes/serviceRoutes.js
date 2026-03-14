const express    = require("express");
const router     = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const branchScope = require("../middlewares/branchScope");
const ctrl       = require("../controllers/serviceController");

const ADMIN_ROLES  = ["SUPER_ADMIN", "ADMIN", "STAFF"];
const ALL_ROLES    = ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"];

router.use(protect);
router.use(branchScope);

/* ── Warranty ───────────────────────────────────── */

router.post(  "/warranty",            authorize(...ALL_ROLES),   ctrl.registerWarranty);
router.get(   "/warranty",            authorize(...ALL_ROLES),   ctrl.getMyWarranties);
// /all MUST come before /:id
router.get(   "/warranty/all",        authorize(...ADMIN_ROLES), ctrl.getAllWarranties);
router.patch( "/warranty/update/:id", authorize(...ADMIN_ROLES), ctrl.updateWarrantyStatus);
router.get(   "/warranty/:id",        authorize(...ALL_ROLES),   ctrl.getWarranty);

/* ── Service Requests ───────────────────────────── */

router.post(  "/requests",              authorize(...ALL_ROLES),   ctrl.raiseServiceRequest);
router.get(   "/requests",              authorize(...ALL_ROLES),   ctrl.getMyServiceRequests);
// /all MUST come before /:id
router.get(   "/requests/all",          authorize(...ADMIN_ROLES), ctrl.getAllServiceRequests);
router.patch( "/requests/update/:id",   authorize(...ADMIN_ROLES), ctrl.updateServiceRequest);
router.get(   "/requests/:id",          authorize(...ALL_ROLES),   ctrl.getServiceRequest);
router.patch( "/requests/:id/cancel",   authorize(...ALL_ROLES),   ctrl.cancelServiceRequest);

module.exports = router;
