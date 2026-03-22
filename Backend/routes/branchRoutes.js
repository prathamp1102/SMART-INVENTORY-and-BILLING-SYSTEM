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

// ⚠️ ALL static routes MUST come before /:id to avoid being matched as an id param

router.get("/admins",              protect, authorize("SUPER_ADMIN"),           getAdminUsers);
router.get("/staff/unassigned",    protect, authorize("SUPER_ADMIN"),           getUnassignedStaff);

router.post("/assign-admin",       protect, authorize("SUPER_ADMIN"),           assignAdmin);
router.post("/assign-staff",       protect, authorize("SUPER_ADMIN"),           assignStaff);
router.post("/assign-staff/bulk",  protect, authorize("SUPER_ADMIN"),           bulkAssignStaff);

router.post("/",                   protect, authorize("SUPER_ADMIN"),           createBranch);
router.get("/",                    protect, authorize("SUPER_ADMIN", "ADMIN"),  getBranches);

// Dynamic :id routes come last
router.get("/:id/staff",           protect, authorize("SUPER_ADMIN", "ADMIN"), getBranchStaff);
router.get("/:id",                 protect, authorize("SUPER_ADMIN", "ADMIN"), getBranchById);
router.put("/:id",                 protect, authorize("SUPER_ADMIN"),           updateBranch);
router.delete("/:id",              protect, authorize("SUPER_ADMIN"),           deleteBranch);

module.exports = router;