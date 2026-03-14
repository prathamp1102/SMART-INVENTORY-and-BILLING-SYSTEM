const TaxConfigModel  = require("../models/TaxConfigModel");
const BranchModel     = require("../models/BranchModel");

/* ═══════════════════════════════════════════════════════════════
   SCOPE RESOLUTION HELPERS
═══════════════════════════════════════════════════════════════ */

/**
 * resolveScope — determine {organization, branch} from request.
 *
 * Super Admin:
 *   ?org=<orgId>              → org-level config for that org
 *   ?org=<orgId>&branch=<id>  → branch override for that org/branch
 *   (neither)                 → global default
 *
 * Admin:
 *   Automatically scoped to their own org + branch (from JWT).
 *   They can only read/write their branch override or their org config.
 */
async function resolveScope(req) {
  const { role, organization: userOrg, branch: userBranch } = req.user;

  if (role === "SUPER_ADMIN") {
    const orgId    = req.query.org    || req.body.organization || null;
    const branchId = req.query.branch || req.body.branch       || null;
    return { organization: orgId, branch: branchId };
  }

  // ADMIN — scope locked to their own org & branch
  return { organization: userOrg || null, branch: userBranch || null };
}

/**
 * getOrCreateForScope — fetch the tax config matching the scope,
 * creating a default doc if none exists yet.
 */
async function getOrCreateForScope(scope) {
  let config = await TaxConfigModel.findOne(scope);
  if (!config) {
    config = await TaxConfigModel.create({
      ...scope,
      taxRates: [
        { name: "GST",  rate: 18, type: "percentage" },
        { name: "CGST", rate: 9,  type: "percentage" },
        { name: "SGST", rate: 9,  type: "percentage" },
      ],
    });
  }
  return config;
}

/**
 * getEffectiveTaxConfig — priority resolution for billing use.
 * Called by invoice/billing controllers (not an API endpoint).
 *   1. Branch-level override
 *   2. Org-level config
 *   3. Global default
 */
exports.getEffectiveTaxConfig = async (branchId, orgId) => {
  return (
    (branchId && await TaxConfigModel.findOne({ branch: branchId })) ||
    (orgId    && await TaxConfigModel.findOne({ organization: orgId, branch: null })) ||
    await TaxConfigModel.findOne({ organization: null, branch: null }) ||
    // If absolutely nothing exists, return a safe default object
    { taxEnabled: false, taxRates: [], taxInclusivePricing: false, showTaxBreakdown: false }
  );
};

/* ═══════════════════════════════════════════════════════════════
   API HANDLERS
═══════════════════════════════════════════════════════════════ */

/* ── GET /api/settings/tax ──────────────────────────────────── */
exports.getTaxConfig = async (req, res) => {
  try {
    const scope  = await resolveScope(req);
    const config = await getOrCreateForScope(scope);

    // Populate org/branch names for UI display
    await config.populate([
      { path: "organization", select: "name" },
      { path: "branch",       select: "branchName city" },
    ]);

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET /api/settings/tax/all  (SA only — all org configs) ─── */
exports.getAllTaxConfigs = async (req, res) => {
  try {
    const configs = await TaxConfigModel.find()
      .populate("organization", "name")
      .populate("branch", "branchName city")
      .sort({ organization: 1 });
    res.json(configs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/settings/tax ──────────────────────────────────── */
exports.saveTaxConfig = async (req, res) => {
  try {
    const scope  = await resolveScope(req);

    // Admins can only write to their own branch scope
    if (req.user.role === "ADMIN") {
      const { organization: userOrg, branch: userBranch } = req.user;
      if (
        String(scope.organization) !== String(userOrg) ||
        String(scope.branch)       !== String(userBranch)
      ) {
        return res.status(403).json({ message: "Access denied: cannot edit other branch settings" });
      }
    }

    const config = await getOrCreateForScope(scope);
    const { taxEnabled, taxInclusivePricing, taxRegNo, hsnCode, showTaxBreakdown, taxRates } = req.body;

    if (taxEnabled          !== undefined) config.taxEnabled          = taxEnabled;
    if (taxInclusivePricing !== undefined) config.taxInclusivePricing = taxInclusivePricing;
    if (taxRegNo            !== undefined) config.taxRegNo            = taxRegNo;
    if (hsnCode             !== undefined) config.hsnCode             = hsnCode;
    if (showTaxBreakdown    !== undefined) config.showTaxBreakdown    = showTaxBreakdown;
    if (Array.isArray(taxRates))           config.taxRates            = taxRates;

    await config.save();
    res.json({ message: "Tax configuration saved successfully", config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/settings/tax/rates ───────────────────────────── */
exports.addTaxRate = async (req, res) => {
  try {
    const scope  = await resolveScope(req);
    const { name, rate, type } = req.body;
    if (!name || rate === undefined)
      return res.status(400).json({ message: "Name and rate are required" });

    const config = await getOrCreateForScope(scope);
    config.taxRates.push({ name, rate, type: type || "percentage" });
    await config.save();
    res.status(201).json({ message: "Tax rate added", taxRates: config.taxRates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PUT /api/settings/tax/rates/:rateId ────────────────────── */
exports.updateTaxRate = async (req, res) => {
  try {
    const scope  = await resolveScope(req);
    const config = await getOrCreateForScope(scope);
    const rate   = config.taxRates.id(req.params.rateId);
    if (!rate) return res.status(404).json({ message: "Tax rate not found" });

    const { name, rate: rateVal, type, isActive } = req.body;
    if (name     !== undefined) rate.name     = name;
    if (rateVal  !== undefined) rate.rate     = rateVal;
    if (type     !== undefined) rate.type     = type;
    if (isActive !== undefined) rate.isActive = isActive;

    await config.save();
    res.json({ message: "Tax rate updated", taxRates: config.taxRates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /api/settings/tax/rates/:rateId ─────────────────── */
exports.deleteTaxRate = async (req, res) => {
  try {
    const scope  = await resolveScope(req);
    const config = await getOrCreateForScope(scope);
    const rate   = config.taxRates.id(req.params.rateId);
    if (!rate) return res.status(404).json({ message: "Tax rate not found" });

    rate.deleteOne();
    await config.save();
    res.json({ message: "Tax rate deleted", taxRates: config.taxRates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
