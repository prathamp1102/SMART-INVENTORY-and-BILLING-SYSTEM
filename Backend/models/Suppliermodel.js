const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: { type: String, trim: true },
    gstNumber:   { type: String, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    email:       { type: String, trim: true, lowercase: true },
    address:     { type: String, trim: true },
    city:        { type: String, trim: true },
    state:       { type: String, trim: true },
    bankDetails: {
      bankName:      String,
      accountNumber: String,
      ifscCode:      String,
      branchName:    String,
    },
    openingBalance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    // Branch this supplier belongs to
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
  },
  { timestamps: true }
);

const Supplier =
  mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);

module.exports = Supplier;
