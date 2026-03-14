const mongoose = require("mongoose");

/* ── Auto-backup schedule configuration (singleton) ─────────── */
const backupConfigSchema = new mongoose.Schema(
  {
    autoEnabled:     { type: Boolean, default: true },
    frequency:       {
      type: String,
      enum: ["hourly", "daily", "weekly", "monthly"],
      default: "daily",
    },
    backupTime:      { type: String, default: "02:00" }, // "HH:mm"
    retentionDays:   { type: Number, default: 30 },
    storageLocation: {
      type: String,
      enum: ["local", "s3", "gcs", "azure"],
      default: "local",
    },
  },
  { timestamps: true }
);

/* ── Individual backup run log ───────────────────────────────── */
const backupHistorySchema = new mongoose.Schema(
  {
    filename:   { type: String, required: true },
    sizeBytes:  { type: Number, default: 0 },
    type:       { type: String, enum: ["auto", "manual"], default: "manual" },
    status:     { type: String, enum: ["success", "failed"],  default: "success" },
    errorMsg:   { type: String, default: "" },
  },
  { timestamps: true }
);

const BackupConfigModel =
  mongoose.models.BackupConfig ||
  mongoose.model("BackupConfig", backupConfigSchema);

const BackupHistoryModel =
  mongoose.models.BackupHistory ||
  mongoose.model("BackupHistory", backupHistorySchema);

module.exports = { BackupConfigModel, BackupHistoryModel };
