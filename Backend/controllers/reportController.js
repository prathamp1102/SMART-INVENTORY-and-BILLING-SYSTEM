/**
 * reportController.js
 * Real data reports for Admin / Super Admin
 * All data is scoped to branch via req.branchFilter (set by branchScope middleware)
 */

const InvoiceModel  = require("../models/InvoiceModel");
const ProductModel  = require("../models/Productmodel");
const ReturnModel   = require("../models/ReturnModel");
const CategoryModel = require("../models/Categorymodel");
const PurchaseOrder = require("../models/PurchaseOrderModel");
const SupplierPaymentModel = require("../models/SupplierPaymentModel");

/* ─── helpers ───────────────────────────────────────────────── */
function periodDates(period) {
  const now  = new Date();
  const from = new Date();
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    from.setDate(1); from.setHours(0, 0, 0, 0);
  } else if (period === "quarter") {
    from.setMonth(now.getMonth() - 2);
    from.setDate(1); from.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    from.setMonth(0); from.setDate(1); from.setHours(0, 0, 0, 0);
  } else {
    // default: last 30 days
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }
  return { from, to: new Date(now.setHours(23, 59, 59, 999)) };
}

function fmt(d) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/* ═══════════════════════════════════════════════════════════════
   GET /api/reports/sales?period=week|month|quarter|year|today
   ═══════════════════════════════════════════════════════════════ */
exports.getSalesReport = async (req, res) => {
  try {
    const { period = "month", from: customFrom, to: customTo } = req.query;
    let from, to;
    if (period === "custom" && customFrom && customTo) {
      from = new Date(customFrom); from.setHours(0,0,0,0);
      to   = new Date(customTo);   to.setHours(23,59,59,999);
    } else {
      ({ from, to } = periodDates(period));
    }
    const branchFilter = req.branchFilter || {};

    // For admin with a branch, also include invoices with branch:null (legacy)
    const invoiceMatch = branchFilter.branch
      ? { $or: [{ branch: branchFilter.branch }, { branch: null }] }
      : {};

    /* ─── base invoice query ───────────────────────────────── */
    const baseQ = {
      ...invoiceMatch,
      createdAt: { $gte: from, $lte: to },
      status: { $ne: "CANCELLED" },
    };

    const [invoices, returns] = await Promise.all([
      InvoiceModel.find(baseQ).populate("cashier", "name").lean(),
      ReturnModel.find({ ...invoiceMatch, createdAt: { $gte: from, $lte: to }, status: "APPROVED" }).lean(),
    ]);

    /* ─── KPIs ─────────────────────────────────────────────── */
    const totalRevenue  = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const totalReturns  = returns.reduce((s, r) => s + (r.returnAmount || 0), 0);
    const netRevenue    = totalRevenue - totalReturns;
    const totalInvoices = invoices.length;
    const avgInvoice    = totalInvoices > 0 ? Math.round(netRevenue / totalInvoices) : 0;

    /* ─── Daily breakdown ──────────────────────────────────── */
    const dayMap = {};
    invoices.forEach(inv => {
      const d = new Date(inv.createdAt).toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { date: d, sales: 0, invoices: 0, returns: 0 };
      dayMap[d].sales    += inv.grandTotal || 0;
      dayMap[d].invoices += 1;
    });
    returns.forEach(ret => {
      const d = new Date(ret.createdAt).toISOString().slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { date: d, sales: 0, invoices: 0, returns: 0 };
      dayMap[d].returns += ret.returnAmount || 0;
    });
    const daily = Object.values(dayMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, dateLabel: fmt(new Date(d.date)), net: d.sales - d.returns }));

    /* ─── Top products by revenue ──────────────────────────── */
    const prodMap = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const key = item.productName || String(item.product);
        if (!prodMap[key]) prodMap[key] = { name: key, qty: 0, revenue: 0, cost: 0 };
        prodMap[key].qty     += item.qty;
        prodMap[key].revenue += item.total;
        prodMap[key].cost    += (item.costPrice || 0) * item.qty;
      });
    });
    const topProducts = Object.values(prodMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        ...p,
        margin: p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
      }));

    /* ─── Payment method breakdown ──────────────────────────── */
    const payMap = {};
    invoices.forEach(inv => {
      const m = inv.paymentMode || "CASH";
      if (!payMap[m]) payMap[m] = { method: m, count: 0, amount: 0 };
      payMap[m].count  += 1;
      payMap[m].amount += inv.grandTotal || 0;
    });
    const payMethods = Object.values(payMap).map(p => ({
      ...p,
      pct: totalRevenue > 0 ? Math.round((p.amount / totalRevenue) * 100) : 0,
    }));

    /* ─── Staff billing ─────────────────────────────────────── */
    const staffMap = {};
    invoices.forEach(inv => {
      const name = inv.cashier?.name || "Unknown";
      if (!staffMap[name]) staffMap[name] = { name, count: 0, sales: 0 };
      staffMap[name].count += 1;
      staffMap[name].sales += inv.grandTotal || 0;
    });
    const staffBilling = Object.values(staffMap).sort((a, b) => b.sales - a.sales);

    res.json({
      kpis: { totalRevenue, totalReturns, netRevenue, totalInvoices, avgInvoice },
      daily,
      topProducts,
      payMethods,
      staffBilling,
      period,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/reports/profit-loss?period=month|quarter|year
   ═══════════════════════════════════════════════════════════════ */
exports.getProfitLossReport = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const branchFilter = req.branchFilter || {};

    // For admin with a branch, also include invoices with branch:null (legacy)
    const invoiceMatch = branchFilter.branch
      ? { $or: [{ branch: branchFilter.branch }, { branch: null }] }
      : {};

    // Build last 6 months of monthly data
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year:  d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        from:  new Date(d.getFullYear(), d.getMonth(), 1),
        to:    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      });
    }

    const monthlyData = await Promise.all(months.map(async m => {
      const invoices = await InvoiceModel.find({
        ...invoiceMatch,
        createdAt: { $gte: m.from, $lte: m.to },
        status: { $ne: "CANCELLED" },
      }).lean();

      const revenue = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
      const cost    = invoices.reduce((s, i) =>
        s + (i.items || []).reduce((ic, item) => ic + (item.costPrice || 0) * item.qty, 0), 0);
      const gross   = revenue - cost;

      return {
        month:    m.label,
        revenue,
        cost,
        gross,
        expenses: 0,   // no expense model yet
        net:      gross,
      };
    }));

    /* ─── current period KPIs ───────────────────────────────── */
    const { from, to } = periodDates(period);
    const periodInvoices = await InvoiceModel.find({
      ...invoiceMatch,
      createdAt: { $gte: from, $lte: to },
      status: { $ne: "CANCELLED" },
    }).populate({ path: "items.product", select: "category", populate: { path: "category", select: "name" } }).lean();

    const revenue = periodInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const cost    = periodInvoices.reduce((s, i) =>
      s + (i.items || []).reduce((ic, item) => ic + (item.costPrice || 0) * item.qty, 0), 0);
    const gross   = revenue - cost;
    const grossMargin = revenue > 0 ? ((gross / revenue) * 100).toFixed(1) : 0;
    const netMargin   = revenue > 0 ? ((gross / revenue) * 100).toFixed(1) : 0;

    /* ─── Category breakdown ────────────────────────────────── */
    const catMap = {};
    periodInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const cat = item.product?.category?.name || "Uncategorized";
        if (!catMap[cat]) catMap[cat] = { name: cat, revenue: 0, cost: 0 };
        catMap[cat].revenue += item.total || 0;
        catMap[cat].cost    += (item.costPrice || 0) * item.qty;
      });
    });
    const categories = Object.values(catMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map(c => ({
        ...c,
        margin: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue * 100).toFixed(1) : 0,
      }));

    res.json({
      kpis: { revenue, cost, gross, grossMargin, netMargin },
      monthlyData,
      categories,
      period,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/reports/purchase?period=month|quarter|year
   ═══════════════════════════════════════════════════════════════ */
exports.getPurchaseReport = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const { from, to } = periodDates(period);
    const branchFilter = req.branchFilter || {};
    const scopeMatch = branchFilter.branch
      ? { $or: [{ branch: branchFilter.branch }, { branch: null }] }
      : {};

    const [pos, payments] = await Promise.all([
      PurchaseOrder.find({ ...scopeMatch, createdAt: { $gte: from, $lte: to } })
        .populate("supplier", "supplierName").lean(),
      SupplierPaymentModel.find({ ...scopeMatch, createdAt: { $gte: from, $lte: to } }).lean(),
    ]);

    const totalOrders   = pos.length;
    const totalValue    = pos.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const totalPaid     = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending  = pos
      .filter(p => p.status !== "CANCELLED")
      .reduce((s, p) => s + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0);

    res.json({
      kpis: { totalOrders, totalValue, totalPaid, totalPending },
      orders: pos.slice(0, 50),
      period,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/reports/stock-movements
   ═══════════════════════════════════════════════════════════════ */
exports.getStockMovementReport = async (req, res) => {
  try {
    const branchFilter = req.branchFilter || {};
    const scopeMatch = branchFilter.branch
      ? { $or: [{ branch: branchFilter.branch }, { branch: null }] }
      : {};

    const [grns, invoices, returns] = await Promise.all([
      require("../models/GrnModel").find(scopeMatch).populate("items.product", "name").populate("createdBy", "name").lean(),
      require("../models/InvoiceModel").find(scopeMatch).populate("items.product", "name").populate("cashier", "name").lean(),
      require("../models/ReturnModel").find(scopeMatch).populate("items.product", "name").populate("processedBy", "name").lean()
    ]);

    let movements = [];

    grns.forEach(grn => {
      (grn.items || []).forEach(item => {
        if (!item.product && !item.productName) return;
        movements.push({
          type: "GRN",
          product: item.product?.name || item.productName,
          qty: item.qty || 0,
          date: grn.createdAt,
          by: grn.createdBy?.name || "Admin",
          note: grn.grnNumber || "GRN Entry"
        });
      });
    });

    invoices.forEach(inv => {
      if (inv.status === "CANCELLED") return;
      (inv.items || []).forEach(item => {
        if (!item.product && !item.productName) return;
        movements.push({
          type: "SALE",
          product: item.productName || item.product?.name,
          qty: -(item.qty || 0),
          date: inv.createdAt,
          by: inv.cashier?.name || "Staff",
          note: inv.invoiceNo || "Sale"
        });
      });
    });

    returns.forEach(ret => {
      if (ret.status !== "APPROVED") return;
      (ret.items || []).forEach(item => {
        if (!item.product && !item.productName) return;
        movements.push({
          type: "RETURN",
          product: item.productName || item.product?.name,
          qty: item.qty || 0,
          date: ret.createdAt,
          by: ret.processedBy?.name || "Staff",
          note: ret.returnNo || "Return"
        });
      });
    });

    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    const formattedMovements = movements.slice(0, 500).map(m => ({
      ...m,
      date: new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    }));

    res.json(formattedMovements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
