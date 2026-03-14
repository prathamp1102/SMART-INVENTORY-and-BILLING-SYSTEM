const mongoose = require("mongoose");

const SystemLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["USER", "INVENTORY", "SUPPLIER", "ATTENDANCE", "SYSTEM", "BILLING", "REPORT"],
      default: "SYSTEM",
    },
    severity: {
      type: String,
      enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
      default: "INFO",
    },
    action:    { type: String, required: true },
    detail:    { type: String, default: "" },
    user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    branch:    { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    meta:      { type: mongoose.Schema.Types.Mixed, default: {} },
    ip:        { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// TTL index — auto-delete logs older than 90 days
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
SystemLogSchema.index({ type: 1, severity: 1, timestamp: -1 });

module.exports = mongoose.model("SystemLog", SystemLogSchema);
