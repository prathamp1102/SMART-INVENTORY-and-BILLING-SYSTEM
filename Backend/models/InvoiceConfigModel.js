const mongoose = require("mongoose");

/*
 * Invoice format — scoped per organization.
 * Every org gets its own prefix, counter, template, and terms.
 * Branch inherits from its org. No branch-level override needed for invoices.
 */
const invoiceConfigSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,            // null = global default
    },
    prefix:        { type: String,  default: "INV" },
    suffix:        { type: String,  default: "" },
    startNumber:   { type: Number,  default: 1001 },
    currentNumber: { type: Number,  default: 1001 }, // auto-increments per invoice
    padding:       { type: Number,  default: 4 },
    template:      {
      type: String,
      enum: ["modern", "classic", "minimal", "detailed"],
      default: "modern",
    },
    paperSize:     { type: String, enum: ["A4", "Letter", "A5", "Legal"], default: "A4" },
    dueDays:       { type: Number, default: 30 },
    terms:         { type: String, default: "" },
    footerNote:    { type: String, default: "Thank you for your business!" },
    showLogo:      { type: Boolean, default: true },
    showSignature: { type: Boolean, default: false },
    showQR:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One invoice config per organization
invoiceConfigSchema.index({ organization: 1 }, { unique: true, sparse: true });

const InvoiceConfigModel =
  mongoose.models.InvoiceConfig ||
  mongoose.model("InvoiceConfig", invoiceConfigSchema);

module.exports = InvoiceConfigModel;
