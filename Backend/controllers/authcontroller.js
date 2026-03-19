const OrganizationModel = require("../models/OrganizationModel");
const BranchModel = require("../models/BranchModel");
const UserModel = require("../models/Usermodel");
const OtpModel = require("../models/OtpModel");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { sendOtpEmail, sendWelcomeEmail } = require("../utils/emailService");

// Helper: generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role, organization, branch } = req.body;
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (req.user.role === "ADMIN" && role !== "STAFF") {
      return res.status(403).json({ message: "Admin can only create STAFF" });
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let assignedOrg = null, assignedBranch = null;
    if (req.user.role === "SUPER_ADMIN") {
      assignedOrg = organization || null;
      assignedBranch = branch || null;
    } else if (req.user.role === "ADMIN") {
      const adminUser = await UserModel.findById(req.user.id).select("organization branch");
      assignedOrg = adminUser?.organization || null;
      assignedBranch = adminUser?.branch || null;
    }
    const newUser = await UserModel.create({ name, email, password: hashedPassword, role, organization: assignedOrg, branch: assignedBranch });

    // Populate org and branch for welcome email
    const populated = await UserModel.findById(newUser._id)
      .populate("organization", "name")
      .populate("branch", "branchName city");

    // Send joining letter welcome email
    try {
      console.log("[EMAIL] Sending welcome email to:", email);
      await sendWelcomeEmail({
        to:         email,
        name:       name,
        password:   password,
        role:       role,
        orgName:    populated.organization?.name   || null,
        branchName: populated.branch?.branchName   || null,
        branchCity: populated.branch?.city         || null,
      });
      console.log("[EMAIL] ✅ Welcome email sent to:", email);
    } catch (mailErr) {
      console.error("[EMAIL] ❌ Failed:", mailErr.code, "-", mailErr.message);
    }

    res.status(201).json({ message: "User created successfully", user: { id: newUser._id, name: newUser.name, role: newUser.role, organization: newUser.organization, branch: newUser.branch } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — Step 1: Verify credentials, send OTP
// POST /auth/login/send-otp  { email, password }
// ─────────────────────────────────────────────────────────────────────────────
exports.loginSendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Credentials OK — send OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OtpModel.deleteMany({ email: user.email, purpose: "LOGIN" });
    await OtpModel.create({ email: user.email, otp, purpose: "LOGIN", expiresAt });
    await sendOtpEmail(user.email, otp, "LOGIN");

    res.json({ message: "OTP sent to your registered email address." });
  } catch (error) {
    console.error("loginSendOtp error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — Step 2: Verify OTP, return token
// POST /auth/login/verify-otp  { email, otp }
// ─────────────────────────────────────────────────────────────────────────────
exports.loginVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await OtpModel.findOne({
      email: email.toLowerCase().trim(),
      otp: otp.toString().trim(),
      purpose: "LOGIN",
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please try again." });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });

    record.used = true;
    await record.save();

    const token = generateToken(user);
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, role: user.role, branch: user.branch || null },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy direct login (kept for any internal use)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    const token = generateToken(user);
    res.json({ message: "Login successful", token, user: { id: user._id, name: user.name, role: user.role, branch: user.branch || null } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    let filter = {};
    if (req.user.role === "ADMIN") filter = { role: "STAFF", branch: req.user.branch };
    const users = await UserModel.find(filter).select("-password").populate("organization", "name city").populate({ path: "branch", select: "branchName city organization", populate: { path: "organization", select: "name city" } }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    const user = await UserModel.findById(req.params.id).select("-password").populate("organization", "name city").populate({ path: "branch", select: "branchName city organization", populate: { path: "organization", select: "name city" } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.user.role === "ADMIN" && String(user.branch?._id || user.branch) !== String(req.user.branch)) return res.status(403).json({ message: "Access denied" });
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Only Super Admin can delete users" });
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: "You cannot delete your own account" });
    const deleted = await UserModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    if (!["SUPER_ADMIN", "ADMIN"].includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    const { name, role, isActive, organization, branch, phone, address } = req.body;
    if (req.user.role === "ADMIN" && role && role !== "STAFF") return res.status(403).json({ message: "Admin can only assign STAFF role" });
    if (req.user.role === "ADMIN") {
      const targetUser = await UserModel.findById(req.params.id).select("branch");
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (String(targetUser.branch) !== String(req.user.branch)) return res.status(403).json({ message: "Access denied" });
    }
    const updateData = { name, role, isActive, phone: phone || "", address: address || "" };
    if (req.user.role === "SUPER_ADMIN") { updateData.organization = organization || null; updateData.branch = branch || null; }
    const updated = await UserModel.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select("-password").populate("organization", "name city").populate({ path: "branch", select: "branchName city organization", populate: { path: "organization", select: "name city" } });
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User updated successfully", user: updated });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password").populate("organization", "name city state email phone gstNumber status").populate({ path: "branch", select: "branchName city state address status organization", populate: { path: "organization", select: "name city state email phone gstNumber status" } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const result = user.toObject();
    if (!result.organization && result.branch?.organization) result.organization = result.branch.organization;
    res.json(result);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    const updated = await UserModel.findByIdAndUpdate(req.user.id, { name: name.trim(), phone: phone || "", address: address || "" }, { new: true, runValidators: true }).select("-password").populate("organization", "name city").populate({ path: "branch", select: "branchName city organization", populate: { path: "organization", select: "name city" } });
    if (!updated) return res.status(404).json({ message: "User not found" });
    const result = updated.toObject();
    if (!result.organization && result.branch?.organization) result.organization = result.branch.organization;
    res.json({ message: "Profile updated successfully", user: result });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD — Step 1: Send OTP
// POST /auth/change-password/send-otp  (authenticated)
// ─────────────────────────────────────────────────────────────────────────────
exports.changePasswordSendOtp = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpModel.deleteMany({ email: user.email, purpose: "CHANGE_PASSWORD" });
    await OtpModel.create({ email: user.email, otp, purpose: "CHANGE_PASSWORD", expiresAt });
    await sendOtpEmail(user.email, otp, "CHANGE_PASSWORD");
    res.json({ message: "OTP sent to your registered email address." });
  } catch (error) {
    console.error("changePasswordSendOtp error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD — Step 2: Verify OTP + set new password
// POST /auth/change-password  { currentPassword, otp, newPassword }
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, otp, newPassword } = req.body;
    if (!currentPassword || !otp || !newPassword) return res.status(400).json({ message: "Current password, OTP, and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    const record = await OtpModel.findOne({ email: user.email, otp: otp.toString().trim(), purpose: "CHANGE_PASSWORD", used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    record.used = true;
    await record.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 1: Send OTP
// POST /auth/forgot-password  { email }
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ message: "If that email exists, an OTP has been sent." });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await OtpModel.deleteMany({ email: user.email, purpose: "FORGOT_PASSWORD" });
    await OtpModel.create({ email: user.email, otp, purpose: "FORGOT_PASSWORD", expiresAt });
    await sendOtpEmail(user.email, otp, "FORGOT_PASSWORD");
    res.json({ message: "OTP sent to your email address." });
  } catch (error) {
    console.error("forgotPasswordSendOtp error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 2: Verify OTP + reset password
// POST /auth/forgot-password/reset  { email, otp, newPassword }
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "Email, OTP, and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
    const record = await OtpModel.findOne({ email: email.toLowerCase().trim(), otp: otp.toString().trim(), purpose: "FORGOT_PASSWORD", used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: "Invalid or expired OTP. Please try again." });
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    record.used = true;
    await record.save();
    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
