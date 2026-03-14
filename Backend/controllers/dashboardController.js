const ProductModel    = require("../models/Productmodel");
const SupplierModel   = require("../models/Suppliermodel");
const UserModel       = require("../models/Usermodel");
const AttendanceModel = require("../models/AttendanceModel");
const ReturnModel     = require("../models/ReturnModel");

// Safe require for Invoice (may not exist on first run)
let InvoiceModel;
try { InvoiceModel = require("../models/InvoiceModel"); } catch(e) { InvoiceModel = null; }

function todayStr() { return new Date().toISOString().slice(0, 10); }

/* ════════════════════════════════════════════════════════════════
   GET /api/dashboard/admin
   Returns all KPIs + widgets for the Admin dashboard in one call.
   Branch auto-scoped via req.user.branch
════════════════════════════════════════════════════════════════ */
exports.getAdminDashboard = async (req, res) => {
  try {
    const branchId = req.user.branch;
    const branchFilter = branchId ? { branch: branchId } : {};
    const today = todayStr();

    /* ── Products ───────────────────────────────────────────── */
    const allProducts = await ProductModel.find({ ...branchFilter, isActive: true })
      .populate("category", "name")
      .populate("supplier", "supplierName")
      .lean();

    const totalProducts = allProducts.length;

    // Low stock: stock <= reorderLevel, or stock <= 5 if no reorderLevel
    const lowStockItems = allProducts
      .filter(p => p.stock <= (p.reorderLevel ?? 5))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map(p => ({
        _id:      p._id,
        name:     p.name,
        stock:    p.stock,
        reorder:  p.reorderLevel ?? 5,
        category: p.category?.name || "—",
      }));

    /* ── Suppliers ──────────────────────────────────────────── */
    const activeSuppliers = await SupplierModel.countDocuments({ ...branchFilter, status: "ACTIVE" });

    /* ── Staff & Attendance Today ───────────────────────────── */
    const staffUsers = await UserModel.find({ ...branchFilter, role: "STAFF", isActive: true })
      .select("_id name email")
      .lean();

    const staffIds = staffUsers.map(u => u._id);

    const todayAttendance = await AttendanceModel.find({
      user: { $in: staffIds },
      date: today,
    }).populate("user", "name email").lean();

    const presentIds  = new Set(todayAttendance.map(a => String(a.user._id)));
    const absentStaff = staffUsers.filter(u => !presentIds.has(String(u._id)));

    // Late = checked in after 10:00 AM
    const LATE_HOUR = 10;
    const lateStaff = todayAttendance.filter(a => {
      const loginHour = new Date(a.loginTime).getHours();
      return loginHour >= LATE_HOUR;
    });

    const staffToday = {
      total:   staffUsers.length,
      present: todayAttendance.length,
      absent:  absentStaff.length,
      late:    lateStaff.length,
      records: todayAttendance.map(a => ({
        userId:    a.user._id,
        name:      a.user.name,
        loginTime: a.loginTime,
        logoutTime:a.logoutTime,
        status:    a.status,
        duration:  a.duration,
      })),
      absentList: absentStaff.map(u => ({ userId: u._id, name: u.name, email: u.email })),
    };

    /* ── Recent Activity (last 20 product updates + new suppliers) ── */
    const recentProducts  = await ProductModel.find(branchFilter)
      .sort({ updatedAt: -1 }).limit(8)
      .select("name stock updatedAt").lean();

    const recentSuppliers = await SupplierModel.find(branchFilter)
      .sort({ createdAt: -1 }).limit(4)
      .select("supplierName createdAt").lean();

    const activity = [
      ...recentProducts.map(p => ({
        type:  "product",
        text:  `Product "${p.name}" updated — stock: ${p.stock}`,
        time:  p.updatedAt,
        color: "#0284c7",
      })),
      ...recentSuppliers.map(s => ({
        type:  "supplier",
        text:  `Supplier "${s.supplierName}" added`,
        time:  s.createdAt,
        color: "#059669",
      })),
      ...lowStockItems.slice(0, 4).map(p => ({
        type:  "alert",
        text:  `Low stock alert: ${p.name} (${p.stock} left)`,
        time:  new Date(),
        color: "#dc2626",
      })),
    ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 12);

    /* ── Billing KPIs ───────────────────────────────────────── */
    let todaySales    = 0;
    let invoicesToday = 0;
    let pendingReturns = 0;
    let todayProfit   = 0;

    try {
      if (InvoiceModel) {
        const todayStart = new Date(today + "T00:00:00.000Z");
        const todayEnd   = new Date(today + "T23:59:59.999Z");
        const todayInvoices = await InvoiceModel.find({
          ...branchFilter,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: "CANCELLED" },
        }).lean();
        todaySales    = todayInvoices.reduce((s,i) => s + (i.grandTotal||0), 0);
        invoicesToday = todayInvoices.length;
        todayProfit   = todayInvoices.reduce((s,i) => {
          const cost = (i.items||[]).reduce((c,item) => c + ((item.costPrice||0)*item.qty), 0);
          return s + ((i.grandTotal||0) - cost);
        }, 0);
      }
    } catch(e) { /* billing module not ready */ }

    try {
      if (ReturnModel) {
        pendingReturns = await ReturnModel.countDocuments({ ...branchFilter, status: "PENDING" });
      }
    } catch(e) {}

    /* ── Staff Billing Activity ─────────────────────────────── */
    let staffBillingActivity = [];
    try {
      if (InvoiceModel) {
        const staffBilling = await InvoiceModel.aggregate([
          { $match: { ...branchFilter, status: { $ne: "CANCELLED" } } },
          { $group: { _id: "$cashier", totalSales: { $sum: "$grandTotal" }, count: { $sum: 1 } } },
          { $sort: { totalSales: -1 } }, { $limit: 5 },
        ]);
        const cashierIds = staffBilling.map(s => s._id).filter(Boolean);
        const cashierDocs = cashierIds.length
          ? await UserModel.find({ _id: { $in: cashierIds } }).select("name email").lean()
          : [];
        const cashierMap = Object.fromEntries(cashierDocs.map(u => [String(u._id), u]));
        staffBillingActivity = staffBilling.map(s => ({
          name:       cashierMap[String(s._id)]?.name || "—",
          email:      cashierMap[String(s._id)]?.email || "—",
          totalSales: s.totalSales,
          count:      s.count,
        }));
      }
    } catch(e) {}

    /* ── Assemble response ──────────────────────────────────── */
    res.json({
      kpis: {
        totalProducts,
        activeSuppliers,
        lowStockCount:   lowStockItems.length,
        staffPresent:    staffToday.present,
        staffTotal:      staffToday.total,
        todaySales,
        invoicesToday,
        pendingReturns,
        todayProfit,
      },
      lowStockItems,
      staffToday,
      staffBillingActivity,
      activity,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
