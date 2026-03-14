const mongoose = require("mongoose");

/* ── Currency / regional format (singleton) ─────────────────── */
const currencyConfigSchema = new mongoose.Schema(
  {
    currencyCode:       { type: String,  default: "INR" },
    symbol:             { type: String,  default: "₹" },
    symbolPosition:     { type: String,  enum: ["before", "after"], default: "before" },
    decimalPlaces:      { type: Number,  default: 2, min: 0, max: 4 },
    thousandsSeparator: { type: String,  default: "," },
    decimalSeparator:   { type: String,  default: "." },
    showCurrencyCode:   { type: Boolean, default: false },
    roundingMethod:     { type: String,  enum: ["round", "floor", "ceil"], default: "round" },
  },
  { timestamps: true }
);

const CurrencyConfigModel =
  mongoose.models.CurrencyConfig ||
  mongoose.model("CurrencyConfig", currencyConfigSchema);

module.exports = CurrencyConfigModel;
