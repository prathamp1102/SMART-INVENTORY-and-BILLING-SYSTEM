const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  purpose:   { type: String, enum: ["LOGIN", "FORGOT_PASSWORD", "CHANGE_PASSWORD"], required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
});

// Auto-delete expired OTP documents from MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
