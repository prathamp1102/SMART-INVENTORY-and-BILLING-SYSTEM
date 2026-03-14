import axiosInstance from "./axiosInstance";

// ── Organization APIs ─────────────────────────────────────────────
export const getOrganizations = () =>
  axiosInstance.get("/organizations").then((r) => r.data);

export const createOrganization = (data) =>
  axiosInstance.post("/organizations", data).then((r) => r.data);

export const updateOrganization = (id, data) =>
  axiosInstance.put(`/organizations/${id}`, data).then((r) => r.data);

export const deleteOrganization = (id) =>
  axiosInstance.delete(`/organizations/${id}`).then((r) => r.data);

// ── Branch APIs ───────────────────────────────────────────────────
export const getBranches = () =>
  axiosInstance.get("/branches").then((r) => r.data);

export const createBranch = (data) =>
  axiosInstance.post("/branches", data).then((r) => r.data);

export const updateBranch = (id, data) =>
  axiosInstance.put(`/branches/${id}`, data).then((r) => r.data);

export const deleteBranch = (id) =>
  axiosInstance.delete(`/branches/${id}`).then((r) => r.data);

export const assignAdmin = (branchId, adminId) =>
  axiosInstance
    .post("/branches/assign-admin", { branchId, adminId })
    .then((r) => r.data);

// ── Admin users for dropdown ──────────────────────────────────────
export const getAdminUsers = () =>
  axiosInstance.get("/branches/admins").then((r) => r.data);

// ── Staff Assignment APIs ─────────────────────────────────────
export const getBranchStaff = (branchId) =>
  axiosInstance.get(`/branches/${branchId}/staff`).then((r) => r.data);

export const getUnassignedStaff = (organizationId) =>
  axiosInstance.get("/branches/staff/unassigned", { params: { organizationId } }).then((r) => r.data);

export const assignStaff = (staffId, branchId) =>
  axiosInstance.post("/branches/assign-staff", { staffId, branchId }).then((r) => r.data);

export const bulkAssignStaff = (staffIds, branchId) =>
  axiosInstance.post("/branches/assign-staff/bulk", { staffIds, branchId }).then((r) => r.data);
