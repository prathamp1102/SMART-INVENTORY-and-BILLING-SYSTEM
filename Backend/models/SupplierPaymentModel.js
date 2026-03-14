const mongoose = require("mongoose");

const supplierPaymentSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", default: null },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMode: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"],
      default: "CASH",
    },
    referenceNo: { type: String },
    notes: { type: String },
    paidOn: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const SupplierPayment =
  mongoose.models.SupplierPayment ||
  mongoose.model("SupplierPayment", supplierPaymentSchema);

module.exports = SupplierPayment;
