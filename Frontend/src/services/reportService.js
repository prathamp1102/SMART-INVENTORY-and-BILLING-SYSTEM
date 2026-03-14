import axiosInstance from "./axiosInstance";

export const getSalesReport = async (params) => {
  const { data } = await axiosInstance.get("/reports/sales", { params });
  return data;
};

export const getStockReport = async () => {
  const { data } = await axiosInstance.get("/reports/stock");
  return data;
};

export const getProfitLossReport = async (params) => {
  const { data } = await axiosInstance.get("/reports/profit-loss", { params });
  return data;
};

export const getPurchaseReport = async (params) => {
  const { data } = await axiosInstance.get("/reports/purchase", { params });
  return data;
};

export const getInventoryReport = async () => {
  const { data } = await axiosInstance.get("/reports/inventory");
  return data;
};
