const PaymentSettings = require("../models/PaymentSettingsModel");

function resolveOrgId(req) {
  if (req.user.role === "SUPER_ADMIN") {
    return req.query.org || req.body.organization || null;
  }
  return req.user.organization || null;
}

async function getOrCreate(orgId) {
  let cfg = await PaymentSettings.findOne({ organization: orgId });
  if (!cfg) cfg = await PaymentSettings.create({ organization: orgId });
  return cfg;
}

/* GET /api/settings/payment */
exports.getPaymentSettings = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const cfg   = await getOrCreate(orgId);
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* PUT /api/settings/payment */
exports.savePaymentSettings = async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const cfg   = await getOrCreate(orgId);

    const { upi, bank } = req.body;
    if (upi  !== undefined) cfg.upi  = { ...cfg.upi.toObject(),  ...upi  };
    if (bank !== undefined) cfg.bank = { ...cfg.bank.toObject(), ...bank };

    await cfg.save();
    res.json({ message: "Payment settings saved", cfg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET /api/settings/payment/public  — no auth, used by POS to show QR */
exports.getPublicPaymentSettings = async (req, res) => {
  try {
    const { org } = req.query;
    const cfg = await PaymentSettings.findOne({ organization: org || null });
    if (!cfg) return res.json({ upi: { enabled: false }, bank: { enabled: false } });
    res.json({ upi: cfg.upi, bank: cfg.bank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
