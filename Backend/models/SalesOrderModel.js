const mongoose = require("mongoose");

const salesOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productName: { type: String, required: true },
    barcode: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }, // percent
    total: { type: Number, required: true },
  },
  { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Sale date (from Excel row or upload date)
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    customerName: { type: String, default: "WALK-IN" },
    customerPhone: { type: String, default: "" },

    items: [salesOrderItemSchema],

    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    paymentMode: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CREDIT", "OTHER"],
      default: "CASH",
    },

    notes: { type: String, default: "" },

    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "PENDING"],
      default: "CONFIRMED",
    },

    source: {
      type: String,
      enum: ["EXCEL_IMPORT", "MANUAL"],
      default: "EXCEL_IMPORT",
    },
  },
  { timestamps: true }
);

// Index for fast date + branch queries
salesOrderSchema.index({ branch: 1, date: -1 });
salesOrderSchema.index({ uploadedBy: 1, date: -1 });

const SalesOrderModel =
  mongoose.models.SalesOrder || mongoose.model("SalesOrder", salesOrderSchema);

module.exports = SalesOrderModel;
