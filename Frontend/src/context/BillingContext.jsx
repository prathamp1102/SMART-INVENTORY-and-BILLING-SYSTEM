import { createContext, useState, useCallback } from "react";
import { createInvoice, getInvoices } from "../services/billingService";

export const BillingContext = createContext(null);

export function BillingProvider({ children }) {
  const [cart, setCart]         = useState([]);   // Sales Desk cart items
  const [invoices, setInvoices] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // ── Cart helpers ─────────────────────────────────────────
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i._id === product._id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...product, qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i._id !== productId));
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart((prev) => prev.map((i) => (i._id === productId ? { ...i, qty } : i)));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ── Billing API ──────────────────────────────────────────
  const submitInvoice = useCallback(async (meta) => {
    setLoadingBilling(true);
    try {
      // Map cart items to the shape the backend expects
      const items = cart.map(i => ({
        product:     i._id,
        productName: i.name,
        qty:         i.qty,
        unitPrice:   i.price,
      }));

      const payload = {
        items,
        customerName:    meta.customerName,
        customerPhone:   meta.customerPhone  || undefined,
        customerEmail:   meta.customerEmail  || undefined,
        discountAmount:  meta.discount || 0,
        taxAmount:       meta.taxAmount || 0,
        amountPaid:      meta.amountPaid || undefined,
        paymentMode:     meta.paymentMethod,
        notes:           meta.notes,
      };

      const data = await createInvoice(payload);
      // Note: caller is responsible for clearing cart after using cart data
      return data;
    } finally {
      setLoadingBilling(false);
    }
  }, [cart]);

  const fetchInvoices = useCallback(async (params) => {
    const data = await getInvoices(params);
    setInvoices(data);
  }, []);

  return (
    <BillingContext.Provider value={{
      cart, cartTotal, invoices, loadingBilling,
      addToCart, removeFromCart, updateQty, clearCart,
      submitInvoice, fetchInvoices,
    }}>
      {children}
    </BillingContext.Provider>
  );
}
