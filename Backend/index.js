const express = require("express");
const cors = require("cors");
const https = require("https");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://evara-inventory.vercel.app",
  "https://smart-inventory-and-billing-system.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB, then boot scheduler
connectDB().then(async () => {
  const { initBackupScheduler } = require("./utils/backupScheduler");
  await initBackupScheduler();
});

// Routes
app.get("/", (req, res) => {
  res.send("Smart Inventory & Billing System API Running...");
});

app.use("/api/auth",              require("./routes/authroutes"));
app.use("/api/categories",        require("./routes/categoryroutes"));
app.use("/api/products",          require("./routes/productroutes"));
app.use("/api/suppliers",         require("./routes/supplierroutes"));
app.use("/api/brands",            require("./routes/brandroutes"));
app.use("/api/purchase-orders",   require("./routes/purchaseorderroutes"));
app.use("/api/supplier-payments", require("./routes/supplierpaymentroutes"));
app.use("/api/shifts",            require("./routes/shiftroutes"));
app.use("/api/organizations",     require("./routes/organizationroutes"));
app.use("/api/branches",          require("./routes/branchRoutes"));
app.use("/api/migration",         require("./routes/migrationroutes"));
app.use("/api/import",            require("./routes/importroutes"));
app.use("/api/attendance",        require("./routes/attendanceroutes"));
app.use("/api/dashboard",         require("./routes/dashboardRoutes"));
app.use("/api/invoices",          require("./routes/invoiceroutes"));
app.use("/api/returns",           require("./routes/returnroutes"));
app.use("/api/sales-orders",      require("./routes/salesOrderRoutes"));
app.use("/api/service",           require("./routes/serviceRoutes"));

// ── System Settings routes (Super Admin only) ──────────────────
app.use("/api/settings/tax",     require("./routes/taxSettingsRoutes"));
app.use("/api/settings/invoice", require("./routes/invoiceSettingsRoutes"));
app.use("/api/settings/currency",require("./routes/currencySettingsRoutes"));
app.use("/api/settings/backup",  require("./routes/backupRoutes"));
app.use("/api/grn", require("./routes/grnroutes"));

// ── Reports ─────────────────────────────────────────────────────
app.use("/api/reports",          require("./routes/reportRoutes"));

// ── Admin — Full CRUD for all entities ─────────────────────────
app.use("/api/admin",            require("./routes/adminRoutes"));

// ── Super Admin — Full System Monitoring ───────────────────────
app.use("/api/superadmin",       require("./routes/superAdminRoutes"));

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Keep-alive ping every 14 minutes to prevent Render free tier hibernation
  setInterval(() => {
    https.get("https://smart-inventory-and-billing-system-qugm.onrender.com", (res) => {
      console.log(`Keep-alive ping: ${res.statusCode}`);
    }).on("error", (err) => {
      console.error("Keep-alive ping failed:", err.message);
    });
  }, 14 * 60 * 1000); // 14 minutes
});