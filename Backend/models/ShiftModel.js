const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    date: { type: String, required: true }, // YYYY-MM-DD
    shiftType: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "EVENING", "NIGHT", "FULL_DAY"],
      default: "MORNING",
    },
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true },
    notes: { type: String },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
    },
  },
  { timestamps: true }
);

const Shift = mongoose.models.Shift || mongoose.model("Shift", shiftSchema);
module.exports = Shift;
