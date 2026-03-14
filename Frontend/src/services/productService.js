import axiosInstance from "./axiosInstance";

// ── Products ─────────────────────────────────────────────────
export const getProducts = async () => {
  const { data } = await axiosInstance.get("/products");
  return data;
};

export const getProductById = async (id) => {
  const { data } = await axiosInstance.get(`/products/${id}`);
  return data;
};

export const createProduct = async (payload) => {
  const { data } = await axiosInstance.post("/products/add", payload);
  return data;
};

export const updateProduct = async (id, payload) => {
  const { data } = await axiosInstance.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await axiosInstance.delete(`/products/${id}`);
  return data;
};

// ── Categories ───────────────────────────────────────────────
export const getCategories = async () => {
  const { data } = await axiosInstance.get("/categories");
  return data;
};

export const createCategory = async (payload) => {
  const { data } = await axiosInstance.post("/categories/add", payload);
  return data;
};

export const updateCategory = async (id, payload) => {
  const { data } = await axiosInstance.put(`/categories/${id}`, payload);
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await axiosInstance.delete(`/categories/${id}`);
  return data;
};

export const getCategoryById = async (id) => {
  const { data } = await axiosInstance.get(`/categories/${id}`);
  return data;
};

// ── Suppliers ────────────────────────────────────────────────
export const getSuppliers = async () => {
  const { data } = await axiosInstance.get("/suppliers");
  return data;
};

export const getSupplierById = async (id) => {
  const { data } = await axiosInstance.get(`/suppliers/${id}`);
  return data;
};

export const createSupplier = async (payload) => {
  // Backend route: POST /api/suppliers/add
  const { data } = await axiosInstance.post("/suppliers/add", payload);
  return data;
};

export const updateSupplier = async (id, payload) => {
  const { data } = await axiosInstance.put(`/suppliers/${id}`, payload);
  return data;
};

export const deleteSupplier = async (id) => {
  const { data } = await axiosInstance.delete(`/suppliers/${id}`);
  return data;
};
