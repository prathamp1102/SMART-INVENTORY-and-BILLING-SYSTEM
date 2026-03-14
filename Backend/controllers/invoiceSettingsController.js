const InvoiceConfigModel = require("../models/InvoiceConfigModel");

/* ═══════════════════════════════════════════════════════════════
   SCOPE HELPERS
═══════════════════════════════════════════════════════════════ */

/**
 * resolveOrgId — invoices are org-scoped only (not branch).
 * Super Admin: pass ?org=<orgId> or body.organization
 * Admin: auto-scoped to their own org
 */
function resolveOrgId(req) {
  if (req.user.role === "SUPER_ADMIN") {
    return req.query.org || req.body.organization || null;
  }
  return req.user.organization || null;
}

async function getOrCreateForOrg(orgId) {
  let config = await InvoiceConfigModel.findOne({ organization: orgId });
  if (!config) {
    // Clone global defaults if they exist, otherwise fresh
    const global = await InvoiceConfigModel.findOne({ organization: null });
    config = await InvoiceConfigModel.create({
      organization: orgId,
      prefix:        global?.prefix        || "INV",
      suffix:        global?.suffix        || "",
      startNumber:   global?.startNumber   || 1001,
      currentNumber: global?.startNumber   || 1001,
      padding:       global?.padding       || 4,
      template:      global?.template      || "modern",
      paperSize:     global?.paperSize     || "A4",
      dueDays:       global?.dueDays       || 30,
      terms:         global?.terms         || "",
      footerNote:    global?.footerNote    || "Thank you for your business!",
      showLogo:      global?.showLogo      ?? true,
      showSignature: global?.showSignature ?? false,
      showQR:        global?.showQR        ?? true,
    });
  }
  return config;
}

/* ═══════════════════════════════════════════════════════════════
   API HANDLERS
═══════════════════════════════════════════════════════════════ */

/* ── GET /api/settings/invoice ──────────────────────────────── */
exports.getInvoiceConfig = async (req, res) => {
  try {
    const orgId  = resolveOrgId(req);
    const config = await getOrCreateForOrg(orgId);
    await config.populate("organization", "name gstNumber");
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/settings/invoice/all  (SA — all org configs) ──── */
exports.getAllInvoiceConfigs = async (req, res) => {
  try {
    const configs = await InvoiceConfigModel.find()
      .populate("organization", "name")
      .sort({ organization: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/settings/invoice ──────────────────────────────── */
exports.saveInvoiceConfig = async (req, res) => {
  try {
    const orgId  = resolveOrgId(req);
    const config = await getOrCreateForOrg(orgId);

    const fields = [
      "prefix", "suffix", "startNumber", "padding",
      "template", "paperSize", "dueDays",
      "terms", "footerNote",
      "showLogo", "showSignature", "showQR",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) config[f] = req.body[f];
    });
    // Reset counter only if startNumber jumped ahead
    if (req.body.startNumber !== undefined && req.body.startNumber > config.currentNumber) {
      config.currentNumber = req.body.startNumber;
    }
    await config.save();
    res.json({ message: "Invoice configuration saved successfully", config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   UTILITY — used by billing controller to mint invoice numbers
═══════════════════════════════════════════════════════════════ */

/**
 * generateNextInvoiceNumber(orgId)
 * Returns next sequential invoice number for the given org,
 * e.g.  "RETA-0024"
 * Uses findOneAndUpdate with $inc for atomic increment (race-safe).
 */
exports.generateNextInvoiceNumber = async (orgId = null) => {
  // Ensure config exists first
  await getOrCreateForOrg(orgId);

  const config = await InvoiceConfigModel.findOneAndUpdate(
    { organization: orgId },
    { $inc: { currentNumber: 1 } },
    { new: false }   // return doc BEFORE increment (so we get the number to use)
  );

  const num       = config.currentNumber;
  const padded    = String(num).padStart(config.padding, "0");
  return `${config.prefix}${padded}${config.suffix}`;
};
