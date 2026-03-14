const mongoose = require("mongoose");

const poItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, default: "" },
  quantity:    { type: Number, required: true, min: 1 },
  unitCost:    { type: Number, min: 0, default: 0 },
  totalCost:   { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber:     { type: String, unique: true },
    supplier:     { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    branch:       { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    status: {
      type: String,
      enum: ["DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"],
      default: "DRAFT",
    },
    items:        [poItemSchema],
    totalAmount:  { type: Number, default: 0 },
    paidAmount:   { type: Number, default: 0 },
    dueAmount:    { type: Number, default: 0 },
    expectedDate: { type: Date },
    receivedDate: { type: Date },
    notes:        { type: String },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-generate PO number + recalculate totals
// NOTE: Do NOT use next() in async pre-save hooks — just return the promise
purchaseOrderSchema.pre("save", async function () {
  if (!this.poNumber) {
    const count = await mongoose.model("PurchaseOrder").countDocuments();
    this.poNumber = "PO-" + String(count + 1).padStart(5, "0");
  }
  let total = 0;
  for (const item of this.items) {
    item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
    total += item.totalCost;
  }
  this.totalAmount = total;
  this.dueAmount   = total - (this.paidAmount || 0);
});

const PurchaseOrder =
  mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", purchaseOrderSchema);

module.exports = PurchaseOrder;
