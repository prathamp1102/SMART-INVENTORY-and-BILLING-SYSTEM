const mongoose = require("mongoose");

const serviceStatusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, required: true },
    note:      { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    // Auto-generated ticket number e.g. SRQ-00001
    ticketNo: { type: String, unique: true },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Optional link to a warranty
    warranty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warranty",
      default: null,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    productName:  { type: String, required: true },
    serialNumber: { type: String, default: "" },
    issueType: {
      type: String,
      enum: [
        "NOT_STARTING",
        "BATTERY_ISSUE",
        "CHARGING_PROBLEM",
        "DISPLAY_ERROR",
        "NOISE_VIBRATION",
        "REMOTE_ISSUE",
        "INSTALLATION",
        "OTHER",
      ],
      default: "OTHER",
    },
    issueDescription: { type: String, required: true },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    // Contact details (auto-filled from user, editable)
    contactName:  { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactAddress: { type: String, default: "" },

    preferredDate: { type: Date, default: null },

    status: {
      type: String,
      enum: [
        "SUBMITTED",
        "ACKNOWLEDGED",
        "TECHNICIAN_ASSIGNED",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
        "CANCELLED",
      ],
      default: "SUBMITTED",
    },

    assignedTo:    { type: String, default: "" }, // technician name
    resolutionNote:{ type: String, default: "" },

    // Full status timeline
    statusHistory: [serviceStatusHistorySchema],
  },
  { timestamps: true }
);

serviceRequestSchema.index({ customer: 1, createdAt: -1 });
serviceRequestSchema.index({ ticketNo: 1 });

module.exports =
  mongoose.models.ServiceRequest ||
  mongoose.model("ServiceRequest", serviceRequestSchema);
