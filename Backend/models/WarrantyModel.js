const mongoose = require("mongoose");

const warrantySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productName:   { type: String, required: true },
    serialNumber:  { type: String, required: true, trim: true },
    purchaseDate:  { type: Date,   required: true },
    warrantyYears: { type: Number, default: 1 },
    expiryDate:    { type: Date },
    invoiceNo:     { type: String, default: "" },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "VOID"],
      default: "ACTIVE",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

warrantySchema.index({ customer: 1, createdAt: -1 });
warrantySchema.index({ serialNumber: 1 });

module.exports =
  mongoose.models.Warranty || mongoose.model("Warranty", warrantySchema);
