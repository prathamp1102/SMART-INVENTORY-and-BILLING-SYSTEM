const express = require("express");
const router  = express.Router();
const {
  login,
  loginSendOtp,
  loginVerifyOtp,
  addUser,
  getUsers,
  getUserById,
  updateUser,
  getMe,
  deleteUser,
  updateMe,
  changePassword,
  changePasswordSendOtp,
  forgotPasswordSendOtp,
  forgotPasswordReset,
} = require("../controllers/authcontroller");
const protect = require("../middlewares/authmiddleware");

// Login — OTP-based (send-otp BEFORE verify-otp)
router.post("/login/send-otp",    loginSendOtp);
router.post("/login/verify-otp",  loginVerifyOtp);
router.post("/login",             login); // legacy fallback

// Session
router.get("/me",      protect, getMe);
router.put("/profile", protect, updateMe);

// Change Password — send-otp MUST be before /change-password
router.post("/change-password/send-otp", protect, changePasswordSendOtp);
router.post("/change-password",          protect, changePassword);

// Forgot Password
router.post("/forgot-password",       forgotPasswordSendOtp);
router.post("/forgot-password/reset", forgotPasswordReset);

// User management
router.post("/add",          protect, addUser);
router.get("/users",         protect, getUsers);
router.get("/users/:id",     protect, getUserById);
router.put("/users/:id",     protect, updateUser);
router.delete("/users/:id",  protect, deleteUser);

module.exports = router;
