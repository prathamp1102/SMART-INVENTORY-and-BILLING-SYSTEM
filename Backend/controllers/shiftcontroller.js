const Shift = require("../models/ShiftModel");
const UserModel = require("../models/Usermodel");

const STAFF_POP = { path: "staff", select: "name email role" };
const BRANCH_POP = { path: "branch", select: "branchName city" };

exports.createShift = async (req, res) => {
  try {
    const { staff, date, shiftType, startTime, endTime, notes } = req.body;
    if (!staff) return res.status(400).json({ message: "Staff member is required" });
    if (!date) return res.status(400).json({ message: "Date is required" });
    if (!startTime || !endTime) return res.status(400).json({ message: "Start and end time are required" });

    const branchId = req.user.role === "ADMIN" ? req.userBranch : (req.body.branch || null);
    if (req.user.role === "ADMIN" && !branchId)
      return res.status(403).json({ message: "Admin has no branch assigned" });

    // Check duplicate shift for same staff+date
    const existing = await Shift.findOne({ staff, date, branch: branchId, status: { $ne: "CANCELLED" } });
    if (existing) return res.status(400).json({ message: "Shift already assigned for this staff on this date" });

    const shift = await Shift.create({
      staff,
      date,
      shiftType: shiftType || "MORNING",
      startTime,
      endTime,
      notes: notes || undefined,
      branch: branchId,
      assignedBy: req.user._id || req.user.id,
    });
    await shift.populate([STAFF_POP, BRANCH_POP]);
    res.status(201).json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const filter = req.branchFilter || {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.staff) filter.staff = req.query.staff;
    if (req.query.week) {
      // Get all shifts in a date range
      const start = req.query.week;
      const end = req.query.weekEnd || start;
      filter.date = { $gte: start, $lte: end };
    }
    const shifts = await Shift.find(filter)
      .populate(STAFF_POP).populate(BRANCH_POP)
      .sort({ date: 1, startTime: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const shift = await Shift.findOneAndUpdate(filter, req.body, { new: true, runValidators: true })
      .populate(STAFF_POP).populate(BRANCH_POP);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    res.json(shift);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...req.branchFilter };
    const shift = await Shift.findOneAndDelete(filter);
    if (!shift) return res.status(404).json({ message: "Shift not found" });
    res.json({ message: "Shift deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
