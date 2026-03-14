import axiosInstance from "./axiosInstance";

// Place a sales order (customer facing)
export const placeCustomerOrder = async (items, customerInfo, paymentMode = "CASH", notes = "") => {
  const rows = items.map(item => ({
    productName: item.name,
    barcode: item.barcode || "",
    qty: item.qty,
    unitPrice: item.sellingPrice || item.price || 0,
    discount: 0,
    customerName: customerInfo.name || "Customer",
    customerPhone: customerInfo.phone || "",
    paymentMode,
    notes,
    date: new Date().toISOString().split("T")[0],
  }));
  const { data } = await axiosInstance.post("/sales-orders/import", { rows });
  return data;
};

// Get all orders for the logged-in customer
export const getCustomerOrders = async () => {
  try {
    const { data } = await axiosInstance.get("/invoices");
    return Array.isArray(data) ? data : (data?.invoices || []);
  } catch {
    const { data } = await axiosInstance.get("/sales-orders");
    return Array.isArray(data) ? data : (data?.orders || []);
  }
};

// Get a single order/invoice by ID
export const getOrderById = async (id) => {
  const { data } = await axiosInstance.get(`/invoices/${id}`);
  return data;
};

// Track order by invoice number or ID
export const trackOrder = async (searchId) => {
  try {
    const { data } = await axiosInstance.get(`/invoices/${searchId}`);
    return data;
  } catch {
    const { data } = await axiosInstance.get("/invoices");
    const all = Array.isArray(data) ? data : (data?.invoices || []);
    return all.find(o =>
      (o.invoiceNumber || "").toLowerCase().includes(searchId.toLowerCase()) ||
      (o._id || "").toLowerCase() === searchId.toLowerCase()
    ) || null;
  }
};
