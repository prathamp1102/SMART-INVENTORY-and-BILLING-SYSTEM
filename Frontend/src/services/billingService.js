import axiosInstance from "./axiosInstance";

export const createInvoice = async (payload) => {
  const { data } = await axiosInstance.post("/invoices", payload);
  return data;
};

export const getInvoices = async (params) => {
  const { data } = await axiosInstance.get("/invoices", { params });
  return data;
};

export const getInvoiceById = async (id) => {
  const { data } = await axiosInstance.get(`/invoices/${id}`);
  return data;
};

export const processReturn = async (payload) => {
  const { data } = await axiosInstance.post("/returns", payload);
  return data;
};

export const sendInvoiceEmail = async (id, email = null) => {
  const { data } = await axiosInstance.post(`/invoices/${id}/send-email`, email ? { email } : {});
  return data;
};

export const testSmtpConnection = async () => {
  const { data } = await axiosInstance.get("/invoices/smtp-test");
  return data;
};
