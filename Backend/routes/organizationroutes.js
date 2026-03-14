const express = require("express");
const router = express.Router();
const {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} = require("../controllers/organizationcontroller");
const { protect, authorize } = require("../middlewares/rolemiddleware");

router.post("/", protect, authorize("SUPER_ADMIN"), createOrganization);
router.get("/", protect, authorize("SUPER_ADMIN", "ADMIN", "STAFF"), getOrganizations);
router.get("/:id", protect, authorize("SUPER_ADMIN", "ADMIN", "STAFF"), getOrganizationById);
router.put("/:id", protect, authorize("SUPER_ADMIN"), updateOrganization);
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deleteOrganization);

module.exports = router;