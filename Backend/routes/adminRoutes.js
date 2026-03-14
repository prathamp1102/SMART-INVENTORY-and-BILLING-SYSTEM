/**
 * ============================================================
 *  ADMIN ROUTES  — /api/admin/*
 *  Auth: Bearer <JWT>
 *  Roles: SUPER_ADMIN (all), ADMIN (branch-scoped subset)
 * ============================================================
 */

const express  = require("express");
const router   = express.Router();
const { protect, authorize } = require("../middlewares/rolemiddleware");
const ctrl     = require("../controllers/adminController");

// Every route below requires auth
router.use(protect, authorize("SUPER_ADMIN", "ADMIN"));

/* ─── Overview ──────────────────────────────────────────── */
router.get("/overview", ctrl.getAdminOverview);

/* ─── Global Search ─────────────────────────────────────── */
router.get("/search",   ctrl.globalSearch);

/* ─── Users ─────────────────────────────────────────────── */
router.get   ("/users",     ctrl.getUsers);
router.get   ("/staff",      ctrl.getStaffList);
router.get   ("/users/:id", ctrl.getUserById);
router.post  ("/users",     ctrl.createUser);
router.put   ("/users/:id", ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

/* ─── Products ───────────────────────────────────────────── */
router.get   ("/products",            ctrl.getProducts);
router.get   ("/products/:id",        ctrl.getProductById);
router.post  ("/products",            ctrl.createProduct);
router.put   ("/products/:id",        ctrl.updateProduct);
router.delete("/products/:id",        ctrl.deleteProduct);
router.patch ("/products/:id/stock",  ctrl.adjustStock);

/* ─── Categories ─────────────────────────────────────────── */
router.get   ("/categories",     ctrl.getCategories);
router.get   ("/categories/:id", ctrl.getCategoryById);
router.post  ("/categories",     ctrl.createCategory);
router.put   ("/categories/:id", ctrl.updateCategory);
router.delete("/categories/:id", ctrl.deleteCategory);

/* ─── Suppliers ──────────────────────────────────────────── */
router.get   ("/suppliers",     ctrl.getSuppliers);
router.get   ("/suppliers/:id", ctrl.getSupplierById);
router.post  ("/suppliers",     ctrl.createSupplier);
router.put   ("/suppliers/:id", ctrl.updateSupplier);
router.delete("/suppliers/:id", ctrl.deleteSupplier);

/* ─── Brands ─────────────────────────────────────────────── */
router.get   ("/brands",     ctrl.getBrands);
router.get   ("/brands/:id", ctrl.getBrandById);
router.post  ("/brands",     ctrl.createBrand);
router.put   ("/brands/:id", ctrl.updateBrand);
router.delete("/brands/:id", ctrl.deleteBrand);

/* ─── Branches (SUPER_ADMIN only) ───────────────────────── */
router.get   ("/branches",     authorize("SUPER_ADMIN"), ctrl.getBranches);
router.get   ("/branches/:id", authorize("SUPER_ADMIN"), ctrl.getBranchById);
router.post  ("/branches",     authorize("SUPER_ADMIN"), ctrl.createBranch);
router.put   ("/branches/:id", authorize("SUPER_ADMIN"), ctrl.updateBranch);
router.delete("/branches/:id", authorize("SUPER_ADMIN"), ctrl.deleteBranch);

/* ─── Organizations (SUPER_ADMIN only) ──────────────────── */
router.get   ("/organizations",     authorize("SUPER_ADMIN"), ctrl.getOrganizations);
router.get   ("/organizations/:id", authorize("SUPER_ADMIN"), ctrl.getOrganizationById);
router.post  ("/organizations",     authorize("SUPER_ADMIN"), ctrl.createOrganization);
router.put   ("/organizations/:id", authorize("SUPER_ADMIN"), ctrl.updateOrganization);
router.delete("/organizations/:id", authorize("SUPER_ADMIN"), ctrl.deleteOrganization);

module.exports = router;
