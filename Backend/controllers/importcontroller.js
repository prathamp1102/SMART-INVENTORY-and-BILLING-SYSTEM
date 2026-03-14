const Organization = require("../models/OrganizationModel");
const Branch = require("../models/BranchModel");
const User = require("../models/Usermodel");
const Product = require("../models/Productmodel");
const Category = require("../models/Categorymodel");
const Supplier = require("../models/Suppliermodel");
const Attendance = require("../models/AttendanceModel");
const bcrypt = require("bcryptjs");

/* ── helpers ──────────────────────────────────────────────────── */
const toBool = (v, def = true) => {
  if (v === undefined || v === "") return def;
  if (typeof v === "boolean") return v;
  return String(v).toLowerCase() === "true" || v === "1" || v === 1;
};
const toNum = (v, def = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
};

/* ── ORGANIZATIONS ──────────────────────────────────────────── */
exports.importOrganizations = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name?.trim()) throw new Error("name is required");
        const existing = await Organization.findOne({ name: r.name.trim() });
        if (existing) {
          errors.push(`Row ${i + 2}: Organization "${r.name}" already exists — skipped`);
          continue;
        }
        const org = await Organization.create({
          name: r.name.trim(),
          gstNumber: r.gstNumber || "",
          email: r.email || "",
          phone: r.phone || "",
          address: r.address || "",
          city: r.city || "",
          state: r.state || "",
          status: ["ACTIVE", "INACTIVE"].includes(r.status?.toUpperCase()) ? r.status.toUpperCase() : "ACTIVE",
        });
        created.push(org._id);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── BRANCHES ───────────────────────────────────────────────── */
exports.importBranches = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.branchName?.trim()) throw new Error("branchName is required");
        if (!r.organizationName?.trim()) throw new Error("organizationName is required");

        const org = await Organization.findOne({ name: r.organizationName.trim() });
        if (!org) throw new Error(`Organization "${r.organizationName}" not found`);

        const existing = await Branch.findOne({ branchName: r.branchName.trim(), organization: org._id });
        if (existing) {
          errors.push(`Row ${i + 2}: Branch "${r.branchName}" already exists in "${r.organizationName}" — skipped`);
          continue;
        }
        const branch = await Branch.create({
          branchName: r.branchName.trim(),
          organization: org._id,
          address: r.address || "",
          city: r.city || "",
          state: r.state || "",
          status: ["ACTIVE", "INACTIVE"].includes(r.status?.toUpperCase()) ? r.status.toUpperCase() : "ACTIVE",
        });
        created.push(branch._id);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── USERS ──────────────────────────────────────────────────── */
exports.importUsers = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];
    const DEFAULT_PASS = "Welcome@123";
    const hashedDefault = await bcrypt.hash(DEFAULT_PASS, 10);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name?.trim()) throw new Error("name is required");
        if (!r.email?.trim()) throw new Error("email is required");

        const validRoles = ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"];
        const role = r.role?.toUpperCase();
        if (!validRoles.includes(role)) throw new Error(`Invalid role "${r.role}"`);

        const existing = await User.findOne({ email: r.email.trim().toLowerCase() });
        if (existing) {
          errors.push(`Row ${i + 2}: Email "${r.email}" already exists — skipped`);
          continue;
        }

        let branch = null;
        if (r.branchName?.trim()) {
          branch = await Branch.findOne({ branchName: r.branchName.trim() });
          if (!branch) throw new Error(`Branch "${r.branchName}" not found`);
        }

        await User.create({
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
          phone: r.phone || "",
          role,
          password: hashedDefault,
          branch: branch?._id || undefined,
          isActive: toBool(r.isActive),
        });
        created.push(r.email);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors, note: "Default password: Welcome@123" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── CATEGORIES ─────────────────────────────────────────────── */
exports.importCategories = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name?.trim()) throw new Error("name is required");
        const existing = await Category.findOne({ name: r.name.trim() });
        if (existing) {
          errors.push(`Row ${i + 2}: Category "${r.name}" already exists — skipped`);
          continue;
        }
        const cat = await Category.create({
          name: r.name.trim(),
          description: r.description || "",
          isActive: toBool(r.isActive),
        });
        created.push(cat._id);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── SUPPLIERS ──────────────────────────────────────────────── */
exports.importSuppliers = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.supplierName?.trim()) throw new Error("supplierName is required");
        if (!r.phoneNumber?.trim()) throw new Error("phoneNumber is required");

        const existing = await Supplier.findOne({ phoneNumber: r.phoneNumber.trim() });
        if (existing) {
          errors.push(`Row ${i + 2}: Supplier with phone "${r.phoneNumber}" already exists — skipped`);
          continue;
        }

        let branch = null;
        if (r.branchName?.trim()) {
          branch = await Branch.findOne({ branchName: r.branchName.trim() });
          if (!branch) throw new Error(`Branch "${r.branchName}" not found`);
        }

        await Supplier.create({
          supplierName: r.supplierName.trim(),
          companyName: r.companyName || "",
          phoneNumber: r.phoneNumber.trim(),
          email: r.email || "",
          address: r.address || "",
          city: r.city || "",
          state: r.state || "",
          gstNumber: r.gstNumber || "",
          openingBalance: toNum(r.openingBalance, 0),
          status: ["ACTIVE", "INACTIVE"].includes(r.status?.toUpperCase()) ? r.status.toUpperCase() : "ACTIVE",
          branch: branch?._id || undefined,
        });
        created.push(r.supplierName);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── PRODUCTS ───────────────────────────────────────────────── */
exports.importProducts = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name?.trim()) throw new Error("name is required");
        if (!r.price && r.price !== 0) throw new Error("price is required");

        let category = null;
        if (r.categoryName?.trim()) {
          category = await Category.findOne({ name: r.categoryName.trim() });
          if (!category) throw new Error(`Category "${r.categoryName}" not found`);
        }

        let supplier = null;
        if (r.supplierName?.trim()) {
          supplier = await Supplier.findOne({ supplierName: r.supplierName.trim() });
          if (!supplier) throw new Error(`Supplier "${r.supplierName}" not found`);
        }

        let branch = null;
        if (r.branchName?.trim()) {
          branch = await Branch.findOne({ branchName: r.branchName.trim() });
          if (!branch) throw new Error(`Branch "${r.branchName}" not found`);
        }

        const existing = await Product.findOne({ name: r.name.trim(), branch: branch?._id || null });
        if (existing) {
          errors.push(`Row ${i + 2}: Product "${r.name}" already exists — skipped`);
          continue;
        }

        await Product.create({
          name: r.name.trim(),
          barcode: r.barcode || "",
          description: r.description || "",
          category: category?._id || undefined,
          supplier: supplier?._id || undefined,
          price: toNum(r.price),
          costPrice: toNum(r.costPrice),
          stock: toNum(r.stock, 0),
          unit: r.unit || "pcs",
          isActive: toBool(r.isActive),
          branch: branch?._id || undefined,
        });
        created.push(r.name);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── INVENTORY / STOCK ADJUSTMENTS ─────────────────────────── */
exports.importInventory = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const updated = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.productName?.trim()) throw new Error("productName is required");
        const qty = parseInt(r.adjustmentQty);
        if (isNaN(qty)) throw new Error("adjustmentQty must be a number");

        let branch = null;
        if (r.branchName?.trim()) {
          branch = await Branch.findOne({ branchName: r.branchName.trim() });
        }

        const product = await Product.findOne({ name: r.productName.trim(), ...(branch ? { branch: branch._id } : {}) });
        if (!product) throw new Error(`Product "${r.productName}" not found`);

        const newStock = Math.max(0, product.stock + qty);
        await Product.findByIdAndUpdate(product._id, { stock: newStock });
        updated.push(r.productName);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, updated: updated.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── ATTENDANCE ─────────────────────────────────────────────── */
exports.importAttendance = async (req, res) => {
  try {
    const rows = req.body.rows || [];
    const created = [], errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.employeeEmail?.trim()) throw new Error("employeeEmail is required");
        if (!r.date?.trim()) throw new Error("date is required");
        const validStatuses = ["PRESENT", "ABSENT", "HALF_DAY"];
        const status = r.status?.toUpperCase();
        if (!validStatuses.includes(status)) throw new Error(`Invalid status "${r.status}"`);

        const user = await User.findOne({ email: r.employeeEmail.trim().toLowerCase() });
        if (!user) throw new Error(`User "${r.employeeEmail}" not found`);

        let branch = null;
        if (r.branchName?.trim()) {
          branch = await Branch.findOne({ branchName: r.branchName.trim() });
        }

        const dateObj = new Date(r.date);
        if (isNaN(dateObj.getTime())) throw new Error(`Invalid date "${r.date}"`);

        const existing = await Attendance.findOne({ user: user._id, date: dateObj });
        if (existing) {
          // Update instead of create
          await Attendance.findByIdAndUpdate(existing._id, {
            status,
            checkIn: r.checkIn || existing.checkIn,
            checkOut: r.checkOut || existing.checkOut,
          });
          created.push(`Updated: ${r.employeeEmail}`);
          continue;
        }

        await Attendance.create({
          user: user._id,
          branch: branch?._id || user.branch || undefined,
          date: dateObj,
          checkIn: r.checkIn || null,
          checkOut: r.checkOut || null,
          status,
        });
        created.push(r.employeeEmail);
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, created: created.length, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
