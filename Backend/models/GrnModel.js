const mongoose = require("mongoose");

const grnItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String },
  qty:         { type: Number, required: true, min: 1 },
  costPrice:   { type: Number, default: 0, min: 0 },
  totalCost:   { type: Number },
});

const grnSchema = new mongoose.Schema(
  {
    grnNumber:     { type: String, unique: true },
    supplier:      { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    branch:        { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", default: null },
    invoiceNo:     { type: String, default: "" },
    receivedDate:  { type: Date, default: Date.now },
    items:         [grnItemSchema],
    totalValue:    { type: Number, default: 0 },
    notes:         { type: String, default: "" },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Auto-generate GRN number and calculate totals before save
// NOTE: async pre hooks must NOT use next() — return a promise instead
grnSchema.pre("save", async function () {
  if (!this.grnNumber) {
    const count = await mongoose.model("GRN").countDocuments();
    this.grnNumber = `GRN-${String(count + 1).padStart(5, "0")}`;
  }
  this.totalValue = this.items.reduce((sum, item) => {
    item.totalCost = item.qty * item.costPrice;
    return sum + item.totalCost;
  }, 0);
});

const GRN = mongoose.models.GRN || mongoose.model("GRN", grnSchema);
module.exports = GRN;