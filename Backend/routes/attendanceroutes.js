const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authmiddleware");
const {
  checkIn,
  checkOut,
  getToday,
  getMyAttendance,
  getAllAttendance,
  getSummary,
  updateAttendance,
} = require("../controllers/attendancecontroller");

// All routes require authentication
router.post("/checkin",   protect, checkIn);
router.post("/checkout",  protect, checkOut);
router.get("/today",      protect, getToday);
router.get("/my",         protect, getMyAttendance);
router.get("/all",        protect, getAllAttendance);
router.get("/summary",    protect, getSummary);
router.put("/:id",        protect, updateAttendance);

module.exports = router;
