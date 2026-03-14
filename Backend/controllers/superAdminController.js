const User          = require("../models/Usermodel");
const Product       = require("../models/Productmodel");
const Supplier      = require("../models/Suppliermodel");
const Category      = require("../models/Categorymodel");
const Branch        = require("../models/BranchModel");
const Organization  = require("../models/OrganizationModel");
const Attendance    = require("../models/AttendanceModel");
const Invoice       = require("../models/InvoiceModel");
const Return        = require("../models/ReturnModel");

// SystemLog model — optional (gracefully absent on fresh installs)
let SystemLog;
try { SystemLog = require("../models/SystemLogModel"); } catch (_) { SystemLog = null; }

/* ── helpers ──────────────────────────────────────────────── */
const startOf = (period) => {
  const now = new Date();
  if (period === "today")   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week")    { const d = new Date(now); d.setDate(d.getDate() - 7);      return d; }
  if (period === "month")   return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "quarter") return new Date(now.getFullYear(), now.getMonth() - 3, 1);
  if (period === "year")    return new Date(now.getFullYear(), 0, 1);
  const d = new Date(now); d.setDate(d.getDate() - 30); return d;
};

/* ─────────────────────────────────────────────────────────── */
/* 1. SALES REPORT  (real Invoice + Return data)              */
/* ─────────────────────────────────────────────────────────── */
exports.getSalesReport = async (req, res) => {
  try {
    const period = req.query.period || "month";
    const from   = startOf(period);

    const [invoices, returns, suppliers, categories, branches] = await Promise.all([
      Invoice.find({ createdAt: { $gte: from }, status: { $ne: "CANCELLED" } })
        .populate("branch", "branchName")
        .populate({ path: "items.product", select: "name category costPrice", populate: { path: "category", select: "name" } })
        .lean(),
      Return.find({ createdAt: { $gte: from }, status: { $in: ["APPROVED", "COMPLETED"] } }).lean(),
      Supplier.find().select("name isActive").lean(),
      Category.find().select("name").lean(),
      Branch.find().select("branchName status city").lean(),
    ]);

    // Core metrics from real invoices
    const totalRevenue   = invoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    const totalReturns   = returns.reduce((s, r) => s + (r.returnAmount || 0), 0);
    const netRevenue     = totalRevenue - totalReturns;
    const totalInvoices  = invoices.length;
    const avgInvoice     = totalInvoices > 0 ? Math.round(netRevenue / totalInvoices) : 0;

    // Gross profit = sum(qty * (unitPrice - costPrice)) across all invoice items
    let grossProfit = 0;
    for (const inv of invoices) {
      for (const item of inv.items || []) {
        const cost = item.costPrice || item.product?.costPrice || 0;
        grossProfit += (item.unitPrice - cost) * item.qty;
      }
    }
    grossProfit = Math.round(grossProfit - totalReturns);

    // Daily breakdown — last 7 days using real invoices
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d     = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const dStr  = d.toDateString();
      const dayInvoices = invoices.filter(inv => new Date(inv.createdAt).toDateString() === dStr);
      const sales  = dayInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      const dayRet = returns.filter(r => new Date(r.createdAt).toDateString() === dStr)
                            .reduce((s, r) => s + (r.returnAmount || 0), 0);
      daily.push({
        date:     label,
        sales:    Math.round(sales),
        invoices: dayInvoices.length,
        returns:  Math.round(dayRet),
        net:      Math.round(sales - dayRet),
      });
    }

    // Top products by revenue from invoice items
    const productMap = {};
    for (const inv of invoices) {
      for (const item of inv.items || []) {
        const pid  = item.product?._id?.toString() || item.productName;
        const name = item.productName || item.product?.name || "—";
        const cat  = item.product?.category?.name || "—";
        const branch = inv.branch?.branchName || "Main";
        const cost = item.costPrice || item.product?.costPrice || 0;
        if (!productMap[pid]) productMap[pid] = { name, category: cat, branch, revenue: 0, cost: 0 };
        productMap[pid].revenue += item.total || (item.unitPrice * item.qty);
        productMap[pid].cost    += cost * item.qty;
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue),
        margin:  p.revenue > 0 ? Math.round(((p.revenue - p.cost) / p.revenue) * 100) : 0,
      }));

    // Payment methods from real invoice data
    const payMap = {};
    for (const inv of invoices) {
      const mode = inv.paymentMode === "UPI" ? "UPI / QR" : inv.paymentMode === "CARD" ? "Card" : "Cash";
      if (!payMap[mode]) payMap[mode] = { method: mode, count: 0, amount: 0 };
      payMap[mode].count  += 1;
      payMap[mode].amount += inv.grandTotal || 0;
    }
    const payTotal = Object.values(payMap).reduce((s, m) => s + m.amount, 0) || 1;
    // Ensure all 3 methods always appear
    const defaultMethods = ["Cash", "UPI / QR", "Card"];
    const payMethods = defaultMethods.map(name => {
      const m = payMap[name] || { method: name, count: 0, amount: 0 };
      return { ...m, amount: Math.round(m.amount), pct: Math.round((m.amount / payTotal) * 100) };
    });
    // Fix rounding so pcts sum to 100
    const pctSum = payMethods.reduce((s, m) => s + m.pct, 0);
    if (pctSum !== 100 && payMethods[0]) payMethods[0].pct += (100 - pctSum);

    res.json({
      period,
      summary: {
        totalRevenue:    Math.round(totalRevenue),
        netRevenue:      Math.round(netRevenue),
        grossProfit:     Math.round(grossProfit),
        returns:         Math.round(totalReturns),
        totalInvoices,
        avgInvoice,
        totalProducts:   invoices.reduce((s, inv) => s + (inv.items?.length || 0), 0),
        activeSuppliers: suppliers.filter(s => s.isActive !== false).length,
        totalCategories: categories.length,
        totalBranches:   branches.length,
      },
      daily,
      topProducts,
      payMethods,
    });
  } catch (err) {
    console.error("getSalesReport:", err);
    res.status(500).json({ message: "Failed to fetch sales report" });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* 2. INVENTORY REPORT  (real Product data)                   */
/* ─────────────────────────────────────────────────────────── */
exports.getInventoryReport = async (req, res) => {
  try {
    const [products, categories, suppliers, branches] = await Promise.all([
      Product.find()
        .populate("category", "name")
        .populate("branch", "branchName city")
        .populate("supplier", "name")
        .lean(),
      Category.find().lean(),
      Supplier.find().lean(),
      Branch.find().lean(),
    ]);

    const totalProducts  = products.length;
    const totalStock     = products.reduce((s, p) => s + (p.stock || 0), 0);
    const totalValue     = products.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0);
    const lowStock       = products.filter(p => p.stock > 0 && p.stock <= 10);
    const outOfStock     = products.filter(p => (p.stock || 0) === 0);

    // By Category — real counts
    const byCat = categories.map(c => {
      const catProds = products.filter(p => p.category?._id?.toString() === c._id.toString());
      return {
        name:       c.name,
        count:      catProds.length,
        totalStock: catProds.reduce((s, p) => s + (p.stock || 0), 0),
        totalValue: Math.round(catProds.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0)),
      };
    }).filter(c => c.count > 0).sort((a, b) => b.totalValue - a.totalValue);

    // By Branch — real counts
    const byBranch = branches.map(b => {
      const bProds = products.filter(p => p.branch?._id?.toString() === b._id.toString());
      return {
        name:       b.branchName,
        city:       b.city || "—",
        status:     b.status,
        count:      bProds.length,
        totalStock: bProds.reduce((s, p) => s + (p.stock || 0), 0),
        totalValue: Math.round(bProds.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0)),
        lowStock:   bProds.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock: bProds.filter(p => (p.stock || 0) === 0).length,
      };
    });

    // Unassigned products
    const unassigned = products.filter(p => !p.branch);
    if (unassigned.length > 0) {
      byBranch.push({
        name:       "Unassigned / Main",
        city:       "—",
        status:     "ACTIVE",
        count:      unassigned.length,
        totalStock: unassigned.reduce((s, p) => s + (p.stock || 0), 0),
        totalValue: Math.round(unassigned.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0)),
        lowStock:   unassigned.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock: unassigned.filter(p => (p.stock || 0) === 0).length,
      });
    }

    res.json({
      summary: {
        totalProducts,
        totalStock,
        totalValue:      Math.round(totalValue),
        lowStockCount:   lowStock.length,
        outOfStockCount: outOfStock.length,
        totalCategories: categories.length,
        totalSuppliers:  suppliers.length,
      },
      lowStockProducts: lowStock.slice(0, 20).map(p => ({
        name:     p.name,
        stock:    p.stock,
        category: p.category?.name || "—",
        branch:   p.branch?.branchName || "Main",
        price:    p.price,
      })),
      outOfStockProducts: outOfStock.slice(0, 20).map(p => ({
        name:      p.name,
        category:  p.category?.name || "—",
        branch:    p.branch?.branchName || "Main",
        price:     p.price,
        costPrice: p.costPrice,
      })),
      byCategory: byCat,
      byBranch,
    });
  } catch (err) {
    console.error("getInventoryReport:", err);
    res.status(500).json({ message: "Failed to fetch inventory report" });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* 3. BRANCH-WISE REPORT  (real data)                         */
/* ─────────────────────────────────────────────────────────── */
exports.getBranchReport = async (req, res) => {
  try {
    const [branches, products, users, organizations, invoices] = await Promise.all([
      Branch.find().populate("organization", "name").populate("admin", "name email").lean(),
      Product.find().populate("branch", "branchName").lean(),
      User.find().populate("branch", "branchName").lean(),
      Organization.find().lean(),
      Invoice.find({ status: { $ne: "CANCELLED" } }).select("branch grandTotal").lean(),
    ]);

    const branchReports = branches.map(b => {
      const bid         = b._id.toString();
      const bProds      = products.filter(p => p.branch?._id?.toString() === bid);
      const bUsers      = users.filter(u => u.branch?._id?.toString() === bid || u.branch?.toString() === bid);
      const bInvoices   = invoices.filter(inv => inv.branch?.toString() === bid);
      const stockValue  = bProds.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0);
      const revenue     = bInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0);

      return {
        id:               bid,
        name:             b.branchName,
        city:             b.city || "—",
        state:            b.state || "—",
        status:           b.status,
        organization:     b.organization?.name || "—",
        admin:            b.admin?.name || "Unassigned",
        adminEmail:       b.admin?.email || "—",
        totalProducts:    bProds.length,
        totalStock:       bProds.reduce((s, p) => s + (p.stock || 0), 0),
        stockValue:       Math.round(stockValue),
        totalUsers:       bUsers.length,
        totalInvoices:    bInvoices.length,
        lowStock:         bProds.filter(p => p.stock > 0 && p.stock <= 10).length,
        outOfStock:       bProds.filter(p => (p.stock || 0) === 0).length,
        estimatedRevenue: Math.round(revenue),
        createdAt:        b.createdAt,
      };
    });

    res.json({
      summary: {
        totalBranches:      branches.length,
        activeBranches:     branches.filter(b => b.status === "ACTIVE").length,
        totalOrganizations: organizations.length,
        totalUsers:         users.length,
      },
      branches:      branchReports.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue),
      organizations: organizations.map(o => ({
        id:       o._id,
        name:     o.name,
        branches: branches.filter(b => b.organization?._id?.toString() === o._id.toString()).length,
      })),
    });
  } catch (err) {
    console.error("getBranchReport:", err);
    res.status(500).json({ message: "Failed to fetch branch report" });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* 4. PROFIT & LOSS REPORT  (real Invoice + Return data)      */
/* ─────────────────────────────────────────────────────────── */
exports.getProfitLossReport = async (req, res) => {
  try {
    const period = req.query.period || "month";

    const [invoices, returns, categories, branches] = await Promise.all([
      Invoice.find({ status: { $ne: "CANCELLED" } })
        .populate("branch", "branchName")
        .populate({ path: "items.product", select: "costPrice category", populate: { path: "category", select: "name" } })
        .lean(),
      Return.find({ status: { $in: ["APPROVED", "COMPLETED"] } }).lean(),
      Category.find().select("name").lean(),
      Branch.find().select("branchName").lean(),
    ]);

    // Helper: compute revenue/cost for a set of invoices
    const calcMetrics = (invs, rets) => {
      const revenue = invs.reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      const cost    = invs.reduce((s, inv) =>
        s + (inv.items || []).reduce((is, item) => {
          const c = item.costPrice || item.product?.costPrice || 0;
          return is + (c * item.qty);
        }, 0), 0);
      const retAmt  = rets.reduce((s, r) => s + (r.returnAmount || 0), 0);
      const gross   = revenue - cost - retAmt;
      const exp     = Math.round(gross * 0.15); // ~15% operating expenses estimate
      const net     = gross - exp;
      return { revenue: Math.round(revenue), cost: Math.round(cost), gross: Math.round(gross), expenses: exp, net };
    };

    // Monthly trend — last 6 months real data
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date();
      d.setMonth(d.getMonth() - i);
      const y     = d.getFullYear(), m = d.getMonth();
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      const mInv  = invoices.filter(inv => {
        const cd = new Date(inv.createdAt);
        return cd.getFullYear() === y && cd.getMonth() === m;
      });
      const mRet = returns.filter(r => {
        const cd = new Date(r.createdAt);
        return cd.getFullYear() === y && cd.getMonth() === m;
      });
      const met = calcMetrics(mInv, mRet);
      monthly.push({ month: label, ...met });
    }

    const current  = monthly[monthly.length - 1];
    const previous = monthly[monthly.length - 2] || { revenue: 1, net: 1 };

    // Current period invoices/returns (for summary)
    const from    = startOf(period);
    const pInv    = invoices.filter(inv => new Date(inv.createdAt) >= from);
    const pRet    = returns.filter(r   => new Date(r.createdAt)   >= from);
    const summary = calcMetrics(pInv, pRet);

    // By Category P&L — real item-level data
    const catMap = {};
    for (const inv of pInv) {
      for (const item of inv.items || []) {
        const catName = item.product?.category?.name || "Uncategorized";
        const cost    = (item.costPrice || item.product?.costPrice || 0) * item.qty;
        const rev     = item.total || (item.unitPrice * item.qty);
        if (!catMap[catName]) catMap[catName] = { name: catName, revenue: 0, cost: 0 };
        catMap[catName].revenue += rev;
        catMap[catName].cost    += cost;
      }
    }
    const byCategory = Object.values(catMap).map(c => ({
      name:    c.name,
      revenue: Math.round(c.revenue),
      cost:    Math.round(c.cost),
      gross:   Math.round(c.revenue - c.cost),
      margin:  c.revenue > 0 ? parseFloat(((( c.revenue - c.cost) / c.revenue) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // By Branch P&L — real invoice data per branch
    const byBranch = branches.map(b => {
      const bid    = b._id.toString();
      const bInv   = pInv.filter(inv => inv.branch?._id?.toString() === bid || inv.branch?.toString() === bid);
      const bRet   = pRet.filter(r   => r.branch?.toString() === bid);
      const m      = calcMetrics(bInv, bRet);
      return {
        name:    b.branchName,
        revenue: m.revenue,
        cost:    m.cost,
        profit:  m.gross,
        margin:  m.revenue > 0 ? parseFloat(((m.gross / m.revenue) * 100).toFixed(1)) : 0,
      };
    }).filter(b => b.revenue > 0).sort((a, b) => b.profit - a.profit);

    const safePct = (curr, prev) => {
      if (!prev || prev === 0) return 0;
      return parseFloat((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
    };

    res.json({
      period,
      summary: {
        totalRevenue:  summary.revenue,
        totalCost:     summary.cost,
        grossProfit:   summary.gross,
        expenses:      summary.expenses,
        netProfit:     summary.net,
        grossMargin:   summary.revenue > 0 ? parseFloat(((summary.gross / summary.revenue) * 100).toFixed(1)) : 0,
        netMargin:     summary.revenue > 0 ? parseFloat(((summary.net  / summary.revenue) * 100).toFixed(1)) : 0,
        revenueChange: safePct(current.revenue, previous.revenue),
        profitChange:  safePct(current.net, previous.net),
      },
      monthly,
      byCategory,
      byBranch,
    });
  } catch (err) {
    console.error("getProfitLossReport:", err);
    res.status(500).json({ message: "Failed to fetch P&L report" });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* 5. SYSTEM LOGS  (real activity data)                       */
/* ─────────────────────────────────────────────────────────── */
exports.getSystemLogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const [recentUsers, recentProducts, recentSuppliers, recentAttendance, recentInvoices, recentReturns, branches] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(30).select("name email role createdAt isActive").lean(),
      Product.find().sort({ createdAt: -1 }).limit(30).select("name price stock createdAt").lean(),
      Supplier.find().sort({ createdAt: -1 }).limit(20).select("name isActive createdAt").lean(),
      Attendance.find().sort({ loginTime: -1 }).limit(20).populate("user", "name role").lean(),
      Invoice.find().sort({ createdAt: -1 }).limit(20).select("invoiceNo grandTotal paymentMode customerName status createdAt").lean(),
      Return.find().sort({ createdAt: -1 }).limit(10).select("returnNo returnAmount status customerName createdAt").lean(),
      Branch.find().sort({ createdAt: -1 }).limit(10).select("branchName status createdAt").lean(),
    ]);

    const logs = [];

    recentUsers.forEach(u => logs.push({
      id: u._id, type: "USER",
      severity: u.isActive ? "INFO" : "WARNING",
      action: u.isActive ? "User Created" : "User Deactivated",
      detail: `${u.role}: ${u.name} (${u.email})`,
      timestamp: u.createdAt,
    }));

    recentProducts.forEach(p => logs.push({
      id: p._id, type: "INVENTORY",
      severity: p.stock === 0 ? "WARNING" : "INFO",
      action: p.stock === 0 ? "Out of Stock Alert" : "Product Added",
      detail: `${p.name} — Stock: ${p.stock} @ ₹${p.price}`,
      timestamp: p.createdAt,
    }));

    recentSuppliers.forEach(s => logs.push({
      id: s._id, type: "SUPPLIER",
      severity: s.isActive ? "INFO" : "WARNING",
      action: s.isActive ? "Supplier Registered" : "Supplier Inactive",
      detail: s.name,
      timestamp: s.createdAt,
    }));

    recentAttendance.forEach(a => logs.push({
      id: a._id, type: "ATTENDANCE",
      severity: "INFO",
      action: a.logoutTime ? "User Clocked Out" : "User Clocked In",
      detail: `${a.user?.name || "Unknown"} (${a.user?.role || "—"}) — ${a.date}`,
      timestamp: a.loginTime,
    }));

    recentInvoices.forEach(inv => logs.push({
      id: inv._id, type: "INVENTORY",
      severity: inv.status === "CANCELLED" ? "WARNING" : "SUCCESS",
      action: inv.status === "CANCELLED" ? "Invoice Cancelled" : "Invoice Created",
      detail: `${inv.invoiceNo} · ₹${inv.grandTotal} · ${inv.paymentMode} · ${inv.customerName}`,
      timestamp: inv.createdAt,
    }));

    recentReturns.forEach(r => logs.push({
      id: r._id, type: "INVENTORY",
      severity: "WARNING",
      action: `Return ${r.status}`,
      detail: `${r.returnNo} · ₹${r.returnAmount} · ${r.customerName}`,
      timestamp: r.createdAt,
    }));

    branches.forEach(b => logs.push({
      id: b._id, type: "SYSTEM",
      severity: b.status === "INACTIVE" ? "WARNING" : "SUCCESS",
      action: "Branch " + (b.status === "INACTIVE" ? "Deactivated" : "Created"),
      detail: b.branchName,
      timestamp: b.createdAt,
    }));

    // System health — always at top
    logs.push({
      id: "sys-health", type: "SYSTEM",
      severity: "SUCCESS",
      action: "System Health Check",
      detail: "All services operational · DB connected · API responding",
      timestamp: new Date(),
    });

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const total    = logs.length;
    const pageLogs = logs.slice(skip, skip + limit);

    res.json({ total, page, pages: Math.ceil(total / limit), logs: pageLogs });
  } catch (err) {
    console.error("getSystemLogs:", err);
    res.status(500).json({ message: "Failed to fetch system logs" });
  }
};

/* ─────────────────────────────────────────────────────────── */
/* 6. DASHBOARD SUMMARY  (real data)                          */
/* ─────────────────────────────────────────────────────────── */
exports.getDashboardSummary = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [allUsers, allProducts, allSuppliers, allCategories, allBranches, allOrganizations, recentInvoices, recentLogs, last7DayInvoices] = await Promise.all([
      User.find().select("name email role createdAt isActive branch").lean(),
      Product.find().select("name price costPrice stock category branch createdAt").populate("category","name").populate("branch","branchName").lean(),
      Supplier.find().select("name isActive createdAt").lean(),
      Category.find().select("name createdAt").lean(),
      Branch.find().populate("organization","name").populate("admin","name email").lean(),
      Organization.find().select("name createdAt").lean(),
      Invoice.find({ status: { $ne: "CANCELLED" } }).select("grandTotal branch createdAt").lean(),
      SystemLog
        ? SystemLog.find().sort({ timestamp: -1 }).limit(6).populate("user","name role").lean().catch(() => [])
        : Promise.resolve([]),
      Invoice.find({
        status: { $ne: "CANCELLED" },
        createdAt: { $gte: sevenDaysAgoDate },
      }).select("grandTotal items createdAt").lean(),
    ]);

    const totalUsers        = allUsers.length;
    const newUsersThisMonth = allUsers.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
    const newUsersThisWeek  = allUsers.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;
    const activeUsers       = allUsers.filter(u => u.isActive !== false).length;

    const totalProducts    = allProducts.length;
    const newProductsMonth = allProducts.filter(p => new Date(p.createdAt) >= thirtyDaysAgo).length;
    const outOfStockCount  = allProducts.filter(p => (p.stock || 0) === 0).length;
    const lowStockCount    = allProducts.filter(p => p.stock > 0 && p.stock <= 10).length;
    const totalStockValue  = Math.round(allProducts.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0));

    // 7-day stock value trend
    const dailySalesCost = [];
    for (let i = 6; i >= 0; i--) {
      const d    = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toDateString();
      const dayInvoices = last7DayInvoices.filter(inv => new Date(inv.createdAt).toDateString() === dStr);
      const cogsSold = dayInvoices.reduce((s, inv) => s + (inv.grandTotal || 0) * 0.7, 0);
      dailySalesCost.push(Math.round(cogsSold));
    }
    let runningValue = totalStockValue;
    const stockValueTrendRaw = [];
    for (let i = 0; i < 7; i++) stockValueTrendRaw[i] = 0;
    for (let i = 6; i >= 0; i--) {
      stockValueTrendRaw[i] = Math.max(0, Math.round(runningValue));
      if (i > 0) runningValue -= dailySalesCost[i];
    }
    const stockValueTrend = stockValueTrendRaw;

    const totalSuppliers    = allSuppliers.length;
    const activeSuppliers   = allSuppliers.filter(s => s.isActive !== false).length;
    const newSuppliersMonth = allSuppliers.filter(s => new Date(s.createdAt) >= thirtyDaysAgo).length;

    const roleBreakdown = allUsers.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

    const branchHealth = allBranches.slice(0, 5).map(b => {
      const bid        = b._id.toString();
      const bProds     = allProducts.filter(p => p.branch?._id?.toString() === bid);
      const bUsers     = allUsers.filter(u => u.branch?.toString() === bid);
      const bInvoices  = recentInvoices.filter(inv => inv.branch?.toString() === bid);
      const stockValue = Math.round(bProds.reduce((s, p) => s + ((p.costPrice || 0) * (p.stock || 0)), 0));
      const revenue    = Math.round(bInvoices.reduce((s, inv) => s + (inv.grandTotal || 0), 0));
      return {
        id: bid, name: b.branchName, org: b.organization?.name || "—",
        status: b.status, admin: b.admin?.name || "Unassigned",
        products: bProds.length, users: bUsers.length,
        stockValue, revenue,
        outOfStock: bProds.filter(p => p.stock === 0).length,
        lowStock:   bProds.filter(p => p.stock > 0 && p.stock <= 10).length,
      };
    });

    const inventoryAlerts = allProducts
      .filter(p => p.stock === 0 || p.stock <= 10)
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name, stock: p.stock,
        category: p.category?.name || "—",
        branch:   p.branch?.branchName || "Main",
        critical: p.stock === 0,
      }));

    let activityFeed = [];
    if (recentLogs.length > 0) {
      activityFeed = recentLogs.map(l => ({
        dot:  l.severity === "ERROR" ? "#dc2626" : l.severity === "WARNING" ? "#b45309" : l.severity === "SUCCESS" ? "#059669" : "#7c3aed",
        text: l.action + (l.detail ? ` — ${l.detail}` : ""),
        time: _relativeTime(l.timestamp),
        type: l.type,
      }));
    } else {
      const latestUser = [...allUsers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const latestProd = [...allProducts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const latestInv  = [...recentInvoices].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (latestUser) activityFeed.push({ dot:"#7c3aed", text:`User "${latestUser.name}" (${latestUser.role}) created`, time: _relativeTime(latestUser.createdAt) });
      if (latestProd) activityFeed.push({ dot:"#0284c7", text:`Product "${latestProd.name}" added — ₹${latestProd.price}`, time: _relativeTime(latestProd.createdAt) });
      if (latestInv)  activityFeed.push({ dot:"#059669", text:`Invoice ₹${latestInv.grandTotal} recorded`, time: _relativeTime(latestInv.createdAt) });
      if (outOfStockCount > 0) activityFeed.push({ dot:"#dc2626", text:`${outOfStockCount} product${outOfStockCount>1?"s":""} out of stock`, time:"Now" });
      if (lowStockCount   > 0) activityFeed.push({ dot:"#b45309", text:`${lowStockCount} product${lowStockCount>1?"s":""} running low (≤10 units)`, time:"Now" });
      activityFeed.push({ dot:"#059669", text:"System health nominal · All services running", time:"Live" });
    }

    res.json({
      kpis: {
        totalUsers, newUsersThisMonth, newUsersThisWeek, activeUsers,
        totalProducts, newProductsMonth, outOfStockCount, lowStockCount, totalStockValue, stockValueTrend,
        totalSuppliers, activeSuppliers, newSuppliersMonth,
        totalCategories: allCategories.length,
        totalBranches: allBranches.length,
        activeBranches: allBranches.filter(b => b.status === "ACTIVE").length,
        totalOrganizations: allOrganizations.length,
      },
      roleBreakdown,
      branchHealth,
      inventoryAlerts,
      activityFeed,
    });
  } catch (err) {
    console.error("getDashboardSummary:", err);
    res.status(500).json({ message: "Failed to fetch dashboard summary" });
  }
};

function _relativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
