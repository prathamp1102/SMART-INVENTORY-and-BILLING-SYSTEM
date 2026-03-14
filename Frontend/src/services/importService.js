import axiosInstance from "./axiosInstance";

export const importOrganizations = (rows) => axiosInstance.post("/import/organizations", { rows }).then(r => r.data);
export const importBranches      = (rows) => axiosInstance.post("/import/branches",      { rows }).then(r => r.data);
export const importUsers         = (rows) => axiosInstance.post("/import/users",         { rows }).then(r => r.data);
export const importCategories    = (rows) => axiosInstance.post("/import/categories",    { rows }).then(r => r.data);
export const importSuppliers     = (rows) => axiosInstance.post("/import/suppliers",     { rows }).then(r => r.data);
export const importProducts      = (rows) => axiosInstance.post("/import/products",      { rows }).then(r => r.data);
export const importInventory     = (rows) => axiosInstance.post("/import/inventory",     { rows }).then(r => r.data);
export const importAttendance    = (rows) => axiosInstance.post("/import/attendance",    { rows }).then(r => r.data);
