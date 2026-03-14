const Organization = require("../models/OrganizationModel");

// ➕ Create Organization (SUPER_ADMIN only)
exports.createOrganization = async (req, res) => {
  try {
    const organization = await Organization.create(req.body);
    res.status(201).json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📋 Get All Organizations
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔍 Get Single Organization
exports.getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization)
      return res.status(404).json({ message: "Organization not found" });
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Update Organization
exports.updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!organization)
      return res.status(404).json({ message: "Organization not found" });
    res.json(organization);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ❌ Delete Organization
exports.deleteOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndDelete(req.params.id);
    if (!organization)
      return res.status(404).json({ message: "Organization not found" });
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};