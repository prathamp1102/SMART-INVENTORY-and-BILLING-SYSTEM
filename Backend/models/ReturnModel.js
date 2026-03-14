const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  returnNo:      { type: String, unique: true },
  invoice:       { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null },
  invoiceNo:     { type: String },
  branch:        { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
  processedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  customerName:  { type: String, default: "Walk-in Customer" },
  customerPhone: { type: String },
  customerEmail: { type: String, default: null },
  items: [{
    product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, required: true },
    qty:         { type: Number, required: true, min: 1 },
    unitPrice:   { type: Number, required: true },
    total:       { type: Number, required: true },
    reason:      { type: String },
  }],
  returnAmount:   { type: Number, required: true },
  refundMethod:   { type: String, enum: ["CASH","CARD","UPI","STORE_CREDIT","OTHER"], default: "CASH" },
  reason:         { type: String },
  notes:          { type: String },
  status:         { type: String, enum: ["PENDING","APPROVED","COMPLETED","REJECTED"], default: "PENDING" },
  restockItems:   { type: Boolean, default: true },
}, { timestamps: true });

returnSchema.pre("save", async function() {
  if (!this.returnNo) {
    const count = await mongoose.model("Return").countDocuments();
    this.returnNo = `RET-${String(count + 1).padStart(4, "0")}`;
  }
});

module.exports = mongoose.models.Return || mongoose.model("Return", returnSchema);