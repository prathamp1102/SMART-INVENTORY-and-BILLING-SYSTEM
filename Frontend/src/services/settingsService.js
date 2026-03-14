import axiosInstance from "./axiosInstance";

/* ════════════════════════════════════════════════════════════════
   TAX / GST SETTINGS
   orgId  — pass org ObjectId for SA; omit for Admin (auto-scoped)
   branch — pass branchId for branch-level override (SA only)
════════════════════════════════════════════════════════════════ */
export const getTaxConfig = (orgId = null, branchId = null) => {
  const params = {};
  if (orgId)    params.org    = orgId;
  if (branchId) params.branch = branchId;
  return axiosInstance.get("/settings/tax", { params });
};

export const getAllTaxConfigs = () =>
  axiosInstance.get("/settings/tax/all");

export const saveTaxConfig = (data, orgId = null, branchId = null) => {
  const params = {};
  if (orgId)    params.org    = orgId;
  if (branchId) params.branch = branchId;
  return axiosInstance.put("/settings/tax", data, { params });
};

export const addTaxRate    = (rate, orgId, branchId) =>
  axiosInstance.post("/settings/tax/rates", rate,
    { params: { ...(orgId && { org: orgId }), ...(branchId && { branch: branchId }) } });

export const updateTaxRate = (id, rate, orgId, branchId) =>
  axiosInstance.put(`/settings/tax/rates/${id}`, rate,
    { params: { ...(orgId && { org: orgId }), ...(branchId && { branch: branchId }) } });

export const deleteTaxRate = (id, orgId, branchId) =>
  axiosInstance.delete(`/settings/tax/rates/${id}`,
    { params: { ...(orgId && { org: orgId }), ...(branchId && { branch: branchId }) } });

/* ════════════════════════════════════════════════════════════════
   INVOICE FORMAT SETTINGS
   orgId — pass org ObjectId for SA; omit for Admin (auto-scoped)
════════════════════════════════════════════════════════════════ */
export const getInvoiceConfig = (orgId = null) =>
  axiosInstance.get("/settings/invoice",
    { params: orgId ? { org: orgId } : {} });

export const getAllInvoiceConfigs = () =>
  axiosInstance.get("/settings/invoice/all");

export const saveInvoiceConfig = (data, orgId = null) =>
  axiosInstance.put("/settings/invoice", data,
    { params: orgId ? { org: orgId } : {} });

/* ════════════════════════════════════════════════════════════════
   CURRENCY SETTINGS  (global — one for all)
════════════════════════════════════════════════════════════════ */
export const getCurrencyConfig  = ()     => axiosInstance.get("/settings/currency");
export const saveCurrencyConfig = (data) => axiosInstance.put("/settings/currency", data);

/* ════════════════════════════════════════════════════════════════
   BACKUP & RESTORE
════════════════════════════════════════════════════════════════ */
export const triggerBackup    = ()     => axiosInstance.post("/settings/backup");
export const getBackupHistory = ()     => axiosInstance.get("/settings/backup/history");
export const getBackupConfig  = ()     => axiosInstance.get("/settings/backup/config");
export const saveBackupConfig = (data) => axiosInstance.put("/settings/backup/config", data);

export const downloadBackup = (id, filename) =>
  axiosInstance.get(`/settings/backup/${id}/download`, { responseType: "blob" })
    .then((res) => {
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", filename || `backup-${id}.gz`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });

export const restoreBackup = (file) => {
  const form = new FormData();
  form.append("backup", file);
  return axiosInstance.post("/settings/backup/restore", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
};

/* ════════════════════════════════════════════════════════════════
   ORGANIZATIONS  (for SA org-selector dropdown)
════════════════════════════════════════════════════════════════ */
export const getOrganizations = () =>
  axiosInstance.get("/organizations");
