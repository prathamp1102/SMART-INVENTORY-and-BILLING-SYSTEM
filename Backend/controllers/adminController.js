/**
 * ============================================================
 *  ADMIN CONTROLLER — Complete CRUD for all entities
 *  Accessible by: SUPER_ADMIN (all), ADMIN (branch-scoped)
 * ============================================================
 */

const User         = require("../models/Usermodel");
const Product      = require("../models/Productmodel");
const Category     = require("../models/Categorymodel");
const Supplier     = require("../models/Suppliermodel");
const Branch       = require("../models/BranchModel");
const Organization = require("../models/OrganizationModel");
const Brand        = require("../models/BrandModel");
const bcrypt       = require("bcryptjs");
const { sendWelcomeEmail } = require("../utils/emailService");

/* ─────────────────────────────────────────────────────────── */
/*  HELPERS                                                    */
/* ─────────────────────────────────────────────────────────── */

const isSuperAdmin = (req) => req.user?.role === "SUPER_ADMIN";
const isAdmin      = (req) => req.user?.role === "ADMIN";

/** Build branch filter: SUPER_ADMIN sees all, ADMIN sees own branch */
const branchFilter = async (req) => {
  if (isSuperAdmin(req)) return {};
  const adminUser = await User.findById(req.user.id).select("branch");
  if (!adminUser?.branch) return {};
  return { branch: adminUser.branch };
};

const paginate = (req) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 50);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/* ═══════════════════════════════════════════════════════════ */
/*  OVERVIEW / ADMIN DASHBOARD                                 */
/* ═══════════════════════════════════════════════════════════ */

exports.getAdminOverview = async (req, res) => {
  try {
    const filter = await branchFilter(req);

    const [
      totalUsers, totalProducts, totalCategories,
      totalSuppliers, totalBranches, totalOrganizations, totalBrands,
      lowStockProducts, outOfStockProducts, recentProducts, recentUsers,
    ] = await Promise.all([
      User.countDocuments(filter),
      Product.countDocuments(filter),
      Category.countDocuments(filter),
      Supplier.countDocuments(filter),
      isSuperAdmin(req) ? Branch.countDocuments()      : Branch.countDocuments(filter),
      isSuperAdmin(req) ? Organization.countDocuments(): Promise.resolve(null),
      Brand.countDocuments(filter),
      Product.countDocuments({ ...filter, stock: { $gt: 0, $lte: 10 } }),
      Product.countDocuments({ ...filter, stock: 0 }),
      Product.find(filter).sort({ createdAt: -1 }).limit(5)
        .populate("category", "name").populate("branch", "branchName").lean(),
      User.find(filter).sort({ createdAt: -1 }).limit(5)
        .select("name email role isActive createdAt").lean(),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalBranches,
        totalOrganizations,
        totalBrands,
        lowStockProducts,
        outOfStockProducts,
      },
      recentProducts,
      recentUsers,
    });
  } catch (err) {
    console.error("getAdminOverview:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  USERS                                                      */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/users  — list users with pagination & search */
exports.getUsers = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    const { page, limit, skip } = paginate(req);

    if (req.query.role)   filter.role   = req.query.role;
    if (req.query.search) filter.name   = { $regex: req.query.search, $options: "i" };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .populate("organization", "name")
        .populate("branch", "branchName city")
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/staff — flat list for dropdowns, no pagination */
exports.getStaffList = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    filter.role = { $in: ["STAFF", "ADMIN"] };
    filter.isActive = true;
    const users = await User.find(filter)
      .select("name email role branch")
      .sort({ name: 1 })
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/users/:id */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("organization", "name")
      .populate("branch", "branchName city");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/users — create user */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, organization, branch } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "name, email, password, role are required" });

    // ADMIN can only create STAFF
    if (isAdmin(req) && role !== "STAFF")
      return res.status(403).json({ message: "Admin can only create STAFF users" });

    // ADMIN can't create SUPER_ADMIN
    if (!isSuperAdmin(req) && role === "SUPER_ADMIN")
      return res.status(403).json({ message: "Forbidden" });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);

    let assignedOrg = null, assignedBranch = null;
    if (isSuperAdmin(req)) {
      assignedOrg    = organization || null;
      assignedBranch = branch       || null;
    } else {
      const adminUser   = await User.findById(req.user.id).select("organization branch");
      assignedOrg       = adminUser?.organization || null;
      assignedBranch    = adminUser?.branch       || null;
    }

    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed,
      role, phone, address,
      organization: assignedOrg,
      branch:       assignedBranch,
    });

    const populated = await User.findById(user._id)
      .select("-password")
      .populate("organization", "name")
      .populate("branch", "branchName city");

    // ── Send joining-letter welcome email ──────────────────────
    try {
      console.log("[EMAIL] Sending welcome email to:", email.toLowerCase());
      console.log("[EMAIL] Org:", populated.organization?.name, "| Branch:", populated.branch?.branchName);
      console.log("[EMAIL] SMTP_USER:", process.env.SMTP_USER, "| SMTP_PORT:", process.env.SMTP_PORT);
      await sendWelcomeEmail({
        to:         email.toLowerCase(),
        name:       name,
        password:   password,
        role:       role,
        orgName:    populated.organization?.name  || null,
        branchName: populated.branch?.branchName  || null,
        branchCity: populated.branch?.city        || null,
      });
      console.log("[EMAIL] ✅ Welcome email sent successfully to:", email.toLowerCase());
    } catch (mailErr) {
      console.error("[EMAIL] ❌ Welcome email FAILED:");
      console.error("[EMAIL]    Code:", mailErr.code);
      console.error("[EMAIL]    Message:", mailErr.message);
      console.error("[EMAIL]    Response:", mailErr.response);
    }
    // ──────────────────────────────────────────────────────────

    res.status(201).json({ message: "User created successfully", data: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** PUT /admin/users/:id — update user */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, organization, branch, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ADMIN can only update users in their branch
    if (isAdmin(req)) {
      const adminUser = await User.findById(req.user.id).select("branch");
      if (user.branch?.toString() !== adminUser?.branch?.toString())
        return res.status(403).json({ message: "Access denied: different branch" });
    }

    if (name)     user.name     = name;
    if (email)    user.email    = email.toLowerCase();
    if (phone)    user.phone    = phone;
    if (address)  user.address  = address;
    if (isActive !== undefined) user.isActive = isActive;

    if (isSuperAdmin(req)) {
      if (role)         user.role         = role;
      if (organization) user.organization = organization;
      if (branch)       user.branch       = branch;
    }

    if (password) user.password = await bcrypt.hash(password, 10);

    await user.save();

    const updated = await User.findById(user._id)
      .select("-password")
      .populate("organization", "name")
      .populate("branch", "branchName city");

    res.json({ message: "User updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** DELETE /admin/users/:id — soft delete (deactivate) or hard delete for SUPER_ADMIN */
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: "Cannot delete your own account" });

    if (isSuperAdmin(req)) {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ message: "User permanently deleted" });
    }

    // ADMIN: soft delete
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "User deactivated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  PRODUCTS                                                   */
/* ═══════════════════════════════════════════════════════════ */

const PRODUCT_POPULATE = [
  { path: "category", select: "name" },
  { path: "supplier", select: "supplierName companyName" },
  { path: "brand",    select: "name" },
  { path: "branch",   select: "branchName city" },
];

/** GET /admin/products */
exports.getProducts = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    const { page, limit, skip } = paginate(req);

    if (req.query.category) filter.category = req.query.category;
    if (req.query.supplier) filter.supplier = req.query.supplier;
    if (req.query.brand)    filter.brand    = req.query.brand;
    if (req.query.search)   filter.name     = { $regex: req.query.search, $options: "i" };
    if (req.query.lowStock === "true")  filter.stock = { $gt: 0, $lte: 10 };
    if (req.query.outOfStock === "true") filter.stock = 0;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(PRODUCT_POPULATE)
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ data: products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/products/:id */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(PRODUCT_POPULATE);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/products */
exports.createProduct = async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.name || !data.category || data.price == null || data.costPrice == null)
      return res.status(400).json({ message: "name, category, price, costPrice are required" });

    if (isAdmin(req)) {
      const adminUser = await User.findById(req.user.id).select("branch");
      if (!adminUser?.branch)
        return res.status(403).json({ message: "Admin has no branch assigned" });
      data.branch = adminUser.branch;
    }

    const product = await Product.create(data);
    const populated = await Product.findById(product._id).populate(PRODUCT_POPULATE);
    res.status(201).json({ message: "Product created", data: populated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/products/:id */
exports.updateProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(await branchFilter(req)) };
    const product = await Product.findOneAndUpdate(filter, req.body, {
      new: true, runValidators: true,
    }).populate(PRODUCT_POPULATE);

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated", data: product });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/products/:id */
exports.deleteProduct = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(await branchFilter(req)) };
    const product = await Product.findOneAndDelete(filter);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** PATCH /admin/products/:id/stock — adjust stock only */
exports.adjustStock = async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    if (adjustment == null) return res.status(400).json({ message: "adjustment is required" });

    const filter  = { _id: req.params.id, ...(await branchFilter(req)) };
    const product = await Product.findOne(filter);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newStock = (product.stock || 0) + Number(adjustment);
    if (newStock < 0) return res.status(400).json({ message: "Stock cannot go below 0" });

    product.stock = newStock;
    await product.save();

    res.json({
      message: `Stock adjusted by ${adjustment}. New stock: ${newStock}`,
      stock:   newStock,
      product: product.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  CATEGORIES                                                 */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/categories */
exports.getCategories = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const categories = await Category.find(filter)
      .populate("branch", "branchName")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json({ data: categories, total: categories.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/categories/:id */
exports.getCategoryById = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id)
      .populate("branch", "branchName")
      .populate("createdBy", "name email");
    if (!cat) return res.status(404).json({ message: "Category not found" });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/categories */
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const data = { name, description, createdBy: req.user.id };

    if (isAdmin(req)) {
      const adminUser = await User.findById(req.user.id).select("branch");
      data.branch = adminUser?.branch || null;
    } else {
      data.branch = req.body.branch || null;
    }

    const category = await Category.create(data);
    res.status(201).json({ message: "Category created", data: category });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/categories/:id */
exports.updateCategory = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(await branchFilter(req)) };
    const category = await Category.findOneAndUpdate(filter, req.body, {
      new: true, runValidators: true,
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category updated", data: category });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/categories/:id */
exports.deleteCategory = async (req, res) => {
  try {
    // check if products are using this category
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0)
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) use this category`,
      });

    const filter   = { _id: req.params.id, ...(await branchFilter(req)) };
    const category = await Category.findOneAndDelete(filter);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  SUPPLIERS                                                  */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/suppliers */
exports.getSuppliers = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    const { page, limit, skip } = paginate(req);

    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.supplierName = { $regex: req.query.search, $options: "i" };

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .populate("branch", "branchName city")
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .lean(),
      Supplier.countDocuments(filter),
    ]);

    res.json({ data: suppliers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/suppliers/:id */
exports.getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate("branch", "branchName city");
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/suppliers */
exports.createSupplier = async (req, res) => {
  try {
    const {
      supplierName, companyName, gstNumber, phoneNumber, email,
      address, city, state, bankDetails, openingBalance, status,
    } = req.body;

    if (!supplierName || !phoneNumber)
      return res.status(400).json({ message: "supplierName and phoneNumber are required" });

    const data = {
      supplierName, companyName, gstNumber, phoneNumber, email,
      address, city, state, bankDetails, openingBalance, status,
    };

    if (isAdmin(req)) {
      const adminUser = await User.findById(req.user.id).select("branch");
      data.branch = adminUser?.branch || null;
    } else {
      data.branch = req.body.branch || null;
    }

    const supplier = await Supplier.create(data);
    res.status(201).json({ message: "Supplier created", data: supplier });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/suppliers/:id */
exports.updateSupplier = async (req, res) => {
  try {
    const filter   = { _id: req.params.id, ...(await branchFilter(req)) };
    const supplier = await Supplier.findOneAndUpdate(filter, req.body, {
      new: true, runValidators: true,
    }).populate("branch", "branchName city");

    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier updated", data: supplier });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/suppliers/:id */
exports.deleteSupplier = async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ supplier: req.params.id });
    if (productCount > 0)
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) linked to this supplier`,
      });

    const filter   = { _id: req.params.id, ...(await branchFilter(req)) };
    const supplier = await Supplier.findOneAndDelete(filter);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  BRANDS                                                     */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/brands */
exports.getBrands = async (req, res) => {
  try {
    const filter = await branchFilter(req);
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };

    const brands = await Brand.find(filter)
      .populate("branch", "branchName")
      .sort({ createdAt: -1 });
    res.json({ data: brands, total: brands.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/brands/:id */
exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate("branch", "branchName");
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/brands */
exports.createBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const data = { name, description };
    if (isAdmin(req)) {
      const adminUser = await User.findById(req.user.id).select("branch");
      data.branch = adminUser?.branch || null;
    } else {
      data.branch = req.body.branch || null;
    }

    const brand = await Brand.create(data);
    res.status(201).json({ message: "Brand created", data: brand });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/brands/:id */
exports.updateBrand = async (req, res) => {
  try {
    const filter = { _id: req.params.id, ...(await branchFilter(req)) };
    const brand  = await Brand.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json({ message: "Brand updated", data: brand });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/brands/:id */
exports.deleteBrand = async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ brand: req.params.id });
    if (productCount > 0)
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) use this brand`,
      });

    const filter = { _id: req.params.id, ...(await branchFilter(req)) };
    const brand  = await Brand.findOneAndDelete(filter);
    if (!brand) return res.status(404).json({ message: "Brand not found" });
    res.json({ message: "Brand deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  BRANCHES  (SUPER_ADMIN only)                              */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/branches */
exports.getBranches = async (req, res) => {
  try {
    const filter = {};
    if (req.query.organization) filter.organization = req.query.organization;
    if (req.query.status)       filter.status       = req.query.status;
    if (req.query.search)       filter.branchName   = { $regex: req.query.search, $options: "i" };

    const branches = await Branch.find(filter)
      .populate("organization", "name")
      .populate("admin", "name email")
      .sort({ createdAt: -1 });

    res.json({ data: branches, total: branches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/branches/:id */
exports.getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate("organization", "name phone email")
      .populate("admin", "name email role");
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/branches */
exports.createBranch = async (req, res) => {
  try {
    const { branchName, organization, address, city, state, admin, status } = req.body;
    if (!branchName || !organization)
      return res.status(400).json({ message: "branchName and organization are required" });

    const branch = await Branch.create({ branchName, organization, address, city, state, admin, status });
    const populated = await Branch.findById(branch._id)
      .populate("organization", "name")
      .populate("admin", "name email");
    res.status(201).json({ message: "Branch created", data: populated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/branches/:id */
exports.updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate("organization", "name").populate("admin", "name email");
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch updated", data: branch });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/branches/:id */
exports.deleteBranch = async (req, res) => {
  try {
    const userCount    = await User.countDocuments({ branch: req.params.id });
    const productCount = await Product.countDocuments({ branch: req.params.id });

    if (userCount > 0 || productCount > 0)
      return res.status(400).json({
        message: `Cannot delete: branch has ${userCount} user(s) and ${productCount} product(s)`,
      });

    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    res.json({ message: "Branch deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  ORGANIZATIONS  (SUPER_ADMIN only)                         */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/organizations */
exports.getOrganizations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.name   = { $regex: req.query.search, $options: "i" };

    const orgs = await Organization.find(filter).sort({ createdAt: -1 });
    res.json({ data: orgs, total: orgs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** GET /admin/organizations/:id */
exports.getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** POST /admin/organizations */
exports.createOrganization = async (req, res) => {
  try {
    const { name, gstNumber, phone, email, address, city, state, country, status } = req.body;
    if (!name) return res.status(400).json({ message: "name is required" });

    const org = await Organization.create({ name, gstNumber, phone, email, address, city, state, country, status });
    res.status(201).json({ message: "Organization created", data: org });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** PUT /admin/organizations/:id */
exports.updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json({ message: "Organization updated", data: org });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/** DELETE /admin/organizations/:id */
exports.deleteOrganization = async (req, res) => {
  try {
    const branchCount = await Branch.countDocuments({ organization: req.params.id });
    if (branchCount > 0)
      return res.status(400).json({
        message: `Cannot delete: ${branchCount} branch(es) belong to this organization`,
      });

    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) return res.status(404).json({ message: "Organization not found" });
    res.json({ message: "Organization deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  SEARCH (cross-entity)                                      */
/* ═══════════════════════════════════════════════════════════ */

/** GET /admin/search?q=term  — search across all entities */
exports.globalSearch = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ message: "Query param 'q' is required" });

    const regex  = { $regex: q, $options: "i" };
    const filter = await branchFilter(req);

    const [products, categories, suppliers, brands, users] = await Promise.all([
      Product.find({ ...filter, name: regex }).limit(5).select("name price stock").lean(),
      Category.find({ ...filter, name: regex }).limit(5).select("name description").lean(),
      Supplier.find({ ...filter, supplierName: regex }).limit(5).select("supplierName phoneNumber").lean(),
      Brand.find({ ...filter, name: regex }).limit(5).select("name").lean(),
      User.find({ ...filter, $or: [{ name: regex }, { email: regex }] }).limit(5)
        .select("name email role").lean(),
    ]);

    res.json({ products, categories, suppliers, brands, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
