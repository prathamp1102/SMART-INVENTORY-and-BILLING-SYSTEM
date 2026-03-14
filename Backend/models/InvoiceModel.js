const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  barcode:     { type: String },
  qty:         { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true },
  costPrice:   { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },       // per-item discount %
  taxRate:     { type: Number, default: 0 },
  total:       { type: Number, required: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNo:       { type: String, unique: true },
  branch:          { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
  cashier:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // linked customer account
  customerName:    { type: String, default: "Walk-in Customer" },
  customerPhone:   { type: String },
  items:           [invoiceItemSchema],
  subtotal:        { type: Number, required: true },
  discountAmount:  { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  taxAmount:       { type: Number, default: 0 },
  grandTotal:      { type: Number, required: true },
  paymentMode:     { type: String, enum: ["CASH","CARD","UPI","BANK","OTHER"], default: "CASH" },
  amountPaid:      { type: Number, default: 0 },
  change:          { type: Number, default: 0 },
  notes:           { type: String },
  status:          { type: String, enum: ["PAID","PENDING","CANCELLED","PARTIAL"], default: "PAID" },
  discountApproved:{ type: Boolean, default: false },
  discountApprovedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre("save", async function() {
  if (!this.invoiceNo) {
    const count = await mongoose.model("Invoice").countDocuments();
    const pad   = String(count + 1).padStart(5, "0");
    this.invoiceNo = `INV-${pad}`;
  }
});

module.exports = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);