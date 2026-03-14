const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      unique: true,
    },
    upi: {
      enabled:   { type: Boolean, default: false },
      upiId:     { type: String,  default: "" },   // e.g. business@paytm
      upiName:   { type: String,  default: "" },   // display name on QR
      upiNote:   { type: String,  default: "" },   // optional note
    },
    bank: {
      enabled:       { type: Boolean, default: false },
      bankName:      { type: String,  default: "" },
      accountName:   { type: String,  default: "" },
      accountNumber: { type: String,  default: "" },
      ifscCode:      { type: String,  default: "" },
      branch:        { type: String,  default: "" },
      accountType:   { type: String,  default: "Current", enum: ["Savings","Current","OD"] },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentSettings ||
  mongoose.model("PaymentSettings", paymentSettingsSchema);
