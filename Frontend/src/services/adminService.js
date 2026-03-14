/**
 * adminService.js
 * Complete frontend service for all Admin API calls
 * Base URL: /api/admin/*
 */
import axiosInstance from "./axiosInstance";

const BASE = "/admin";

/* ── Overview ─────────────────────────────────────────────── */
export const getAdminOverview = async () => {
  const { data } = await axiosInstance.get(`${BASE}/overview`);
  return data;
};

/* ── Global Search ────────────────────────────────────────── */
export const globalSearch = async (q) => {
  const { data } = await axiosInstance.get(`${BASE}/search`, { params: { q } });
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  USERS                                                     */
/* ══════════════════════════════════════════════════════════ */
export const getUsers = async (params = {}) => {
  // params: { page, limit, role, search, isActive }
  const { data } = await axiosInstance.get(`${BASE}/users`, { params });
  return data; // { data, total, page, pages }
};

export const getUserById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/users/${id}`);
  return data;
};

export const createUser = async (payload) => {
  // { name, email, password, role, phone, address, organization?, branch? }
  const { data } = await axiosInstance.post(`${BASE}/users`, payload);
  return data; // { message, data: user }
};

export const updateUser = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/users/${id}`);
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  PRODUCTS                                                  */
/* ══════════════════════════════════════════════════════════ */
export const getAdminProducts = async (params = {}) => {
  // params: { page, limit, category, supplier, brand, search, lowStock, outOfStock, isActive }
  const { data } = await axiosInstance.get(`${BASE}/products`, { params });
  return data; // { data, total, page, pages }
};

export const getAdminProductById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/products/${id}`);
  return data;
};

export const createAdminProduct = async (payload) => {
  // { name, category, price, costPrice, stock?, supplier?, brand?, barcode?, description?, reorderLevel?, unit?, hsn?, branch? }
  const { data } = await axiosInstance.post(`${BASE}/products`, payload);
  return data; // { message, data: product }
};

export const updateAdminProduct = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/products/${id}`, payload);
  return data;
};

export const deleteAdminProduct = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/products/${id}`);
  return data;
};

export const adjustStock = async (id, adjustment, reason = "") => {
  // adjustment: positive = add stock, negative = remove stock
  const { data } = await axiosInstance.patch(`${BASE}/products/${id}/stock`, {
    adjustment,
    reason,
  });
  return data; // { message, stock, product }
};

/* ══════════════════════════════════════════════════════════ */
/*  CATEGORIES                                                */
/* ══════════════════════════════════════════════════════════ */
export const getAdminCategories = async (params = {}) => {
  // params: { search, isActive }
  const { data } = await axiosInstance.get(`${BASE}/categories`, { params });
  return data; // { data, total }
};

export const getAdminCategoryById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/categories/${id}`);
  return data;
};

export const createAdminCategory = async (payload) => {
  // { name, description, branch? }
  const { data } = await axiosInstance.post(`${BASE}/categories`, payload);
  return data;
};

export const updateAdminCategory = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/categories/${id}`, payload);
  return data;
};

export const deleteAdminCategory = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/categories/${id}`);
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  SUPPLIERS                                                 */
/* ══════════════════════════════════════════════════════════ */
export const getAdminSuppliers = async (params = {}) => {
  // params: { page, limit, status, search }
  const { data } = await axiosInstance.get(`${BASE}/suppliers`, { params });
  return data; // { data, total, page, pages }
};

export const getAdminSupplierById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/suppliers/${id}`);
  return data;
};

export const createAdminSupplier = async (payload) => {
  // { supplierName, phoneNumber, companyName?, gstNumber?, email?, address?, city?, state?, bankDetails?, openingBalance?, status?, branch? }
  const { data } = await axiosInstance.post(`${BASE}/suppliers`, payload);
  return data;
};

export const updateAdminSupplier = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/suppliers/${id}`, payload);
  return data;
};

export const deleteAdminSupplier = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/suppliers/${id}`);
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  BRANDS                                                    */
/* ══════════════════════════════════════════════════════════ */
export const getAdminBrands = async (params = {}) => {
  const { data } = await axiosInstance.get(`${BASE}/brands`, { params });
  return data;
};

export const getAdminBrandById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/brands/${id}`);
  return data;
};

export const createAdminBrand = async (payload) => {
  // { name, description?, branch? }
  const { data } = await axiosInstance.post(`${BASE}/brands`, payload);
  return data;
};

export const updateAdminBrand = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/brands/${id}`, payload);
  return data;
};

export const deleteAdminBrand = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/brands/${id}`);
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  BRANCHES  (SUPER_ADMIN only)                             */
/* ══════════════════════════════════════════════════════════ */
export const getBranches = async (params = {}) => {
  const { data } = await axiosInstance.get(`${BASE}/branches`, { params });
  return data;
};

export const getBranchById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/branches/${id}`);
  return data;
};

export const createBranch = async (payload) => {
  // { branchName, organization, address?, city?, state?, admin?, status? }
  const { data } = await axiosInstance.post(`${BASE}/branches`, payload);
  return data;
};

export const updateBranch = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/branches/${id}`, payload);
  return data;
};

export const deleteBranch = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/branches/${id}`);
  return data;
};

/* ══════════════════════════════════════════════════════════ */
/*  ORGANIZATIONS  (SUPER_ADMIN only)                        */
/* ══════════════════════════════════════════════════════════ */
export const getOrganizations = async (params = {}) => {
  const { data } = await axiosInstance.get(`${BASE}/organizations`, { params });
  return data;
};

export const getOrganizationById = async (id) => {
  const { data } = await axiosInstance.get(`${BASE}/organizations/${id}`);
  return data;
};

export const createOrganization = async (payload) => {
  // { name, gstNumber?, phone?, email?, address?, city?, state?, country?, status? }
  const { data } = await axiosInstance.post(`${BASE}/organizations`, payload);
  return data;
};

export const updateOrganization = async (id, payload) => {
  const { data } = await axiosInstance.put(`${BASE}/organizations/${id}`, payload);
  return data;
};

export const deleteOrganization = async (id) => {
  const { data } = await axiosInstance.delete(`${BASE}/organizations/${id}`);
  return data;
};
