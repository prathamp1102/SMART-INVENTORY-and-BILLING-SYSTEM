const AttendanceModel = require("../models/AttendanceModel");
const UserModel = require("../models/Usermodel");

// Helper: today's date string
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── POST /attendance/checkin
// Called automatically on login — records login time
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();

    // Find user for org/branch — deeply populate branch to get its organization
    const user = await UserModel.findById(userId)
      .select("organization branch")
      .populate({ path: "branch", select: "organization" });

    // Resolve organization: direct org OR via branch
    const resolvedOrg = user?.organization || user?.branch?.organization || null;

    // Check if already checked-in today
    const existing = await AttendanceModel.findOne({ user: userId, date });
    if (existing) {
      // If the user logged out earlier today and is logging back in,
      // clear the logoutTime so checkout works correctly on next logout.
      if (existing.logoutTime) {
        existing.logoutTime = null;
        existing.duration = null;
        if (existing.status !== "PRESENT") existing.status = "PRESENT";
        await existing.save();
        return res.status(200).json({ message: "Re-checked in today", attendance: existing });
      }
      return res.status(200).json({ message: "Already checked in today", attendance: existing });
    }

    const attendance = await AttendanceModel.create({
      user: userId,
      organization: resolvedOrg,
      branch: user?.branch?._id || user?.branch || null,
      date,
      loginTime: new Date(),
      status: "PRESENT",
    });

    res.status(201).json({ message: "Check-in recorded", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /attendance/checkout
// Called manually or on logout
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();

    const attendance = await AttendanceModel.findOne({ user: userId, date });
    if (!attendance) {
      return res.status(404).json({ message: "No check-in found for today" });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({ message: "Already checked out today", attendance });
    }

    const logoutTime = new Date();
    const duration = Math.round((logoutTime - attendance.loginTime) / 60000); // minutes

    attendance.logoutTime = logoutTime;
    attendance.duration = duration;
    if (duration < 240) attendance.status = "HALF_DAY"; // < 4 hours = half day

    await attendance.save();

    res.json({ message: "Check-out recorded", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /attendance/today
// Current user's today attendance status
exports.getToday = async (req, res) => {
  try {
    const userId = req.user.id;
    const date = todayStr();
    const attendance = await AttendanceModel.findOne({ user: userId, date });
    res.json(attendance || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /attendance/my
// Current user's full attendance history
exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    let filter = { user: userId };

    if (month && year) {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      filter.date = { $gte: start, $lte: end };
    }

    const records = await AttendanceModel.find(filter).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /attendance/all  (ADMIN / SUPER_ADMIN)
// View all attendance records, optionally filtered
exports.getAllAttendance = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { month, year, userId, date, organizationId, branchId } = req.query;
    const BranchModel = require("../models/BranchModel");

    // Build list of user IDs to filter attendance by
    let userIds = null;

    if (req.user.role === "ADMIN") {
      // ADMIN: only their own branch's users
      const branchUsers = await UserModel.find({ branch: req.user.branch }).select("_id");
      userIds = branchUsers.map((u) => u._id);
    } else if (userId) {
      userIds = [userId];
    } else if (branchId) {
      // Filter by specific branch — find users in that branch
      const branchUsers = await UserModel.find({ branch: branchId }).select("_id");
      userIds = branchUsers.map((u) => u._id);
    } else if (organizationId) {
      // Filter by org — find all branches of that org, then users in those branches
      const orgBranches = await BranchModel.find({ organization: organizationId }).select("_id");
      const orgBranchIds = orgBranches.map((b) => b._id);
      // Users whose branch belongs to this org (most common case) OR direct org field
      const orgUsers = await UserModel.find({
        $or: [
          { branch: { $in: orgBranchIds } },
          { organization: organizationId },
        ],
      }).select("_id");
      userIds = orgUsers.map((u) => u._id);
    }

    let filter = {};
    if (userIds) filter.user = { $in: userIds };

    if (date) filter.date = date;
    else if (month && year) {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const end = `${year}-${String(month).padStart(2, "0")}-31`;
      filter.date = { $gte: start, $lte: end };
    }

    const records = await AttendanceModel.find(filter)
      .populate("user", "name email role")
      .populate({
        path: "branch",
        select: "branchName city organization",
        populate: { path: "organization", select: "name" },
      })
      .populate("organization", "name")
      .sort({ date: -1, loginTime: -1 });

    // Ensure organization is always resolved — fall back to branch.organization
    const enriched = records.map((r) => {
      const obj = r.toObject();
      if (!obj.organization && obj.branch?.organization) {
        obj.organization = obj.branch.organization;
      }
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /attendance/summary  (ADMIN / SUPER_ADMIN)
// Summary per user for a given month
exports.getSummary = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { month, year, organizationId, branchId } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = `${year}-${String(month).padStart(2, "0")}-31`;

    const BranchModel = require("../models/BranchModel");
    let userFilter = {};

    if (req.user.role === "ADMIN") {
      userFilter = { branch: req.user.branch };
    } else if (branchId) {
      userFilter = { branch: branchId };
    } else if (organizationId) {
      // Find all branches belonging to this org, then match users by branch
      const orgBranches = await BranchModel.find({ organization: organizationId }).select("_id");
      const orgBranchIds = orgBranches.map((b) => b._id);
      userFilter = {
        $or: [
          { branch: { $in: orgBranchIds } },
          { organization: organizationId },
        ],
      };
    }

    const users = await UserModel.find(userFilter)
      .select("name email role branch organization")
      .populate({
        path: "branch",
        select: "branchName city organization",
        populate: { path: "organization", select: "name" },
      })
      .populate("organization", "name");

    const records = await AttendanceModel.find({
      user: { $in: users.map((u) => u._id) },
      date: { $gte: start, $lte: end },
    });

    const summary = users.map((u) => {
      const userRecords = records.filter(
        (r) => String(r.user) === String(u._id)
      );
      const present = userRecords.filter((r) => r.status === "PRESENT").length;
      const halfDay = userRecords.filter((r) => r.status === "HALF_DAY").length;
      const totalMinutes = userRecords.reduce((acc, r) => acc + (r.duration || 0), 0);

      // Resolve org from branch if not set directly
      const resolvedOrg = u.organization || u.branch?.organization || null;
      return {
        user: {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          branch: u.branch,
          organization: resolvedOrg,
        },
        present,
        halfDay,
        totalDays: userRecords.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /attendance/:id  (ADMIN / SUPER_ADMIN)
// Manually correct an attendance record
exports.updateAttendance = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { loginTime, logoutTime, status, note } = req.body;
    const record = await AttendanceModel.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "Record not found" });

    if (loginTime) record.loginTime = new Date(loginTime);
    if (logoutTime) {
      record.logoutTime = new Date(logoutTime);
      record.duration = Math.round((record.logoutTime - record.loginTime) / 60000);
    }
    if (status) record.status = status;
    if (note !== undefined) record.note = note;

    await record.save();
    res.json({ message: "Attendance updated", attendance: record });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};