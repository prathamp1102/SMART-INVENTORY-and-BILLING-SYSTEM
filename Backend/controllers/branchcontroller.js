const mongoose = require("mongoose");
const Branch = require("../models/BranchModel");
const User = require("../models/Usermodel");

exports.createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    const populated = await Branch.findById(branch._id)
      .populate("organization")
      .populate("admin", "name email role");
    res.status(201).json(populated);
  } catch (error) {
    console.error("createBranch error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected. State: " + mongoose.connection.readyState });
    }
    const branches = await Branch.find()
      .populate("organization")
      .populate("admin", "name email role")
      .sort({ createdAt: -1 });
    res.json(branches);
  } catch (error) {
    console.error("getBranches error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate("organization")
      .populate("admin", "name email role");
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (error) {
    console.error("getBranchById error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("organization")
      .populate("admin", "name email role");
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (error) {
    console.error("updateBranch error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("deleteBranch error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✏️ Assign Admin to Branch — also sets organization on the user
exports.assignAdmin = async (req, res) => {
  try {
    const { branchId, adminId } = req.body;
    const branch = await Branch.findById(branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    branch.admin = adminId || null;
    await branch.save();

    if (adminId) {
      // Set BOTH branch AND organization on the admin user
      await User.findByIdAndUpdate(adminId, {
        branch: branchId,
        organization: branch.organization, // automatically pull org from the branch
      });
    }

    const populated = await Branch.findById(branchId)
      .populate("organization")
      .populate("admin", "name email role");

    res.json({ message: "Admin assigned successfully", branch: populated });
  } catch (error) {
    console.error("assignAdmin error:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// 📋 Get all ADMIN users (for dropdown)
exports.getAdminUsers = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected. State: " + mongoose.connection.readyState });
    }
    const admins = await User.find({ role: "ADMIN", isActive: true }).select("name email role");
    res.json(admins);
  } catch (error) {
    console.error("getAdminUsers error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
// ── GET /branches/:id/staff — get all staff assigned to a branch
exports.getBranchStaff = async (req, res) => {
  try {
    const staff = await User.find({ branch: req.params.id, role: { $in: ["STAFF", "ADMIN"] } })
      .select("name email role isActive")
      .sort({ name: 1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /branches/staff/unassigned — get staff with no branch
exports.getUnassignedStaff = async (req, res) => {
  try {
    const { organizationId } = req.query;
    let filter = { role: "STAFF", isActive: true, $or: [{ branch: null }, { branch: { $exists: false } }] };
    if (organizationId) filter.organization = organizationId;
    const staff = await User.find(filter).select("name email role organization").populate("organization", "name");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /branches/assign-staff — assign a staff member to a branch
exports.assignStaff = async (req, res) => {
  try {
    const { staffId, branchId } = req.body;
    if (!staffId) return res.status(400).json({ message: "staffId is required" });

    const branch = branchId ? await require("../models/BranchModel").findById(branchId) : null;
    if (branchId && !branch) return res.status(404).json({ message: "Branch not found" });

    const updateData = {
      branch: branchId || null,
      organization: branch ? branch.organization : null,
    };

    const updated = await User.findByIdAndUpdate(staffId, updateData, { new: true })
      .select("name email role branch organization");

    if (!updated) return res.status(404).json({ message: "Staff not found" });

    res.json({ message: "Staff assigned successfully", user: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /branches/assign-staff/bulk — assign multiple staff to a branch at once
exports.bulkAssignStaff = async (req, res) => {
  try {
    const { staffIds, branchId } = req.body;
    if (!Array.isArray(staffIds) || staffIds.length === 0)
      return res.status(400).json({ message: "staffIds array is required" });

    const branch = branchId ? await require("../models/BranchModel").findById(branchId) : null;
    if (branchId && !branch) return res.status(404).json({ message: "Branch not found" });

    const updateData = {
      branch: branchId || null,
      organization: branch ? branch.organization : null,
    };

    await User.updateMany({ _id: { $in: staffIds } }, updateData);
    res.json({ message: `${staffIds.length} staff assigned successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
