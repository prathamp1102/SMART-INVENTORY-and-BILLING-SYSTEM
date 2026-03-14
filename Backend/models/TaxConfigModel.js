const mongoose = require("mongoose");

/* ── Individual tax rate entry (embedded) ────────────────────── */
const taxRateSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    rate:     { type: Number, required: true, min: 0, max: 100 },
    type:     { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

/*
 * Tax configuration — scoped to org / branch / global
 *
 * Scope priority resolved at invoice time:
 *   1. branch-level  (organization set + branch set)
 *   2. org-level     (organization set + branch null)
 *   3. global        (organization null + branch null)
 */
const taxConfigSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,                   // null = global Super Admin default
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,                   // null = org-level; set = branch override
    },
    taxEnabled:          { type: Boolean, default: true },
    taxInclusivePricing: { type: Boolean, default: false },
    taxRegNo:            { type: String,  default: "" },
    hsnCode:             { type: String,  default: "" },
    showTaxBreakdown:    { type: Boolean, default: true },
    taxRates:            { type: [taxRateSchema], default: [] },
  },
  { timestamps: true }
);

// One config doc per (org, branch) pair
taxConfigSchema.index({ organization: 1, branch: 1 }, { unique: true, sparse: true });

const TaxConfigModel =
  mongoose.models.TaxConfig || mongoose.model("TaxConfig", taxConfigSchema);

module.exports = TaxConfigModel;
