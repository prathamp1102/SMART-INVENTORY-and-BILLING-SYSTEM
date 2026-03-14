const express = require("express");
const router  = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const {
  getUnassignedSummary,
  assignBranchToUnassigned,
  assignBranchToRecord,
} = require("../controllers/migrationcontroller");

// SUPER_ADMIN only — data migration / branch assignment endpoints
router.get("/unassigned-summary",    protect, authorize("SUPER_ADMIN"), getUnassignedSummary);
router.post("/assign-branch",        protect, authorize("SUPER_ADMIN"), assignBranchToUnassigned);
router.post("/assign-branch-to-record", protect, authorize("SUPER_ADMIN"), assignBranchToRecord);

module.exports = router;
