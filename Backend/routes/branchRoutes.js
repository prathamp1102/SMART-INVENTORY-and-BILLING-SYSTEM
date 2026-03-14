const express = require("express");
const router = express.Router();
const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  assignAdmin,
  getAdminUsers,
  getBranchStaff,
  getUnassignedStaff,
  assignStaff,
  bulkAssignStaff,
} = require("../controllers/branchcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");

// ⚠️ Static routes MUST come before /:id to avoid "admins" being treated as an id
router.get("/admins", protect, authorize("SUPER_ADMIN"), getAdminUsers);
router.post("/assign-admin", protect, authorize("SUPER_ADMIN"), assignAdmin);

router.post("/", protect, authorize("SUPER_ADMIN"), createBranch);
router.get("/", protect, authorize("SUPER_ADMIN", "ADMIN"), getBranches);
router.get("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), getBranchById);
router.put("/:id", protect, authorize("SUPER_ADMIN"), updateBranch);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deleteBranch);

router.get("/staff/unassigned",    protect, authorize("SUPER_ADMIN"), getUnassignedStaff);
router.post("/assign-staff",        protect, authorize("SUPER_ADMIN"), assignStaff);
router.post("/assign-staff/bulk",   protect, authorize("SUPER_ADMIN"), bulkAssignStaff);
router.get("/:id/staff",            protect, authorize("SUPER_ADMIN", "ADMIN"), getBranchStaff);

module.exports = router;