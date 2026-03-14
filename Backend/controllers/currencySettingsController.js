const CurrencyConfigModel = require("../models/CurrencyConfigModel");

/* ── Helper: get-or-create singleton ────────────────────────── */
async function getOrCreate() {
  let config = await CurrencyConfigModel.findOne();
  if (!config) config = await CurrencyConfigModel.create({});
  return config;
}

/* ── GET /api/settings/currency ─────────────────────────────── */
exports.getCurrencyConfig = async (req, res) => {
  try {
    const config = await getOrCreate();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/settings/currency ─────────────────────────────── */
exports.saveCurrencyConfig = async (req, res) => {
  try {
    const fields = [
      "currencyCode", "symbol", "symbolPosition",
      "decimalPlaces", "thousandsSeparator",
      "decimalSeparator", "showCurrencyCode", "roundingMethod",
    ];
    const config = await getOrCreate();
    fields.forEach((f) => {
      if (req.body[f] !== undefined) config[f] = req.body[f];
    });
    await config.save();
    res.json({ message: "Currency configuration saved successfully", config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── Utility: format a number using saved currency settings ──── */
/* Used by report/billing controllers to format money values      */
exports.formatAmount = async (amount) => {
  const config = await getOrCreate();
  const { decimalPlaces, roundingMethod, symbol, symbolPosition, showCurrencyCode, currencyCode } = config;

  // Apply rounding
  let value = Number(amount);
  const factor = Math.pow(10, decimalPlaces);
  if (roundingMethod === "floor") value = Math.floor(value * factor) / factor;
  else if (roundingMethod === "ceil") value = Math.ceil(value * factor) / factor;
  else value = Math.round(value * factor) / factor;

  const formatted = value.toFixed(decimalPlaces);
  const display   = symbolPosition === "before"
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`;

  return showCurrencyCode ? `${display} ${currencyCode}` : display;
};
