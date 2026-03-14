import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";
import PaymentInfoPanel from "../../components/ui/PaymentInfoPanel";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const PAYMENT_MODES = [
  {
    value: "CASH",
    label: "Cash on Delivery",
    icon: "💵",
    color: "#059669",
    bg: "rgba(5,150,105,.08)",
    border: "rgba(5,150,105,.25)",
    desc: "Pay cash at delivery",
  },
  {
    value: "CREDIT_DEBIT",
    label: "Credit / Debit Card",
    icon: "💳",
    color: "#6366f1",
    bg: "rgba(99,102,241,.08)",
    border: "rgba(99,102,241,.25)",
    desc: "Visa, Mastercard, RuPay",
  },
  {
    value: "UPI",
    label: "UPI / QR Code",
    icon: "📲",
    color: "#7c3aed",
    bg: "rgba(124,58,237,.08)",
    border: "rgba(124,58,237,.25)",
    desc: "GPay, PhonePe, Paytm",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: "🏦",
    color: "#0284c7",
    bg: "rgba(2,132,199,.08)",
    border: "rgba(2,132,199,.25)",
    desc: "NEFT, RTGS, IMPS",
  },
];

export default function PlaceOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const currency = "₹";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("customer_cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
  }, []);

  const subtotal = cart.reduce((s, i) => s + (i.price || i.sellingPrice || 0) * i.qty, 0);

  const backendPaymentMode = (mode) => {
    if (mode === "CREDIT_DEBIT") return "CARD";
    return mode;
  };

  const handleSubmit = async () => {
    if (!cart.length) return;
    setPlacing(true);
    setError("");
    try {
      const rows = cart.map(item => ({
        productName: item.name,
        barcode: item.barcode || "",
        qty: item.qty,
        unitPrice: item.price || item.sellingPrice || 0,
        discount: 0,
        customerName: user?.name || "Customer",
        customerPhone: user?.phone || "",
        paymentMode: backendPaymentMode(paymentMode),
        notes,
        date: new Date().toISOString().split("T")[0],
      }));
      const res = await axiosInstance.post("/sales-orders/import", { rows });
      localStorage.removeItem("customer_cart");
      setSuccess(res.data);
      setCart([]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: "520px", margin: "60px auto", textAlign: "center", animation: "fadeUp .4s ease both" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e", marginBottom: "8px" }}>Order Placed!</h2>
        <p style={{ color: "rgba(26,26,46,.5)", fontSize: "14px", marginBottom: "8px" }}>
          Your order has been confirmed and an invoice has been generated.
        </p>
        <p style={{ color: "rgba(26,26,46,.4)", fontSize: "13px", marginBottom: "28px" }}>
          {success.ordersCreated || success.created?.length || 1} order(s) processed successfully.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/customer/order-history")} style={{ padding: "12px 22px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            View Order History
          </button>
          <button onClick={() => navigate("/billing/invoice")} style={{ padding: "12px 22px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            View Invoice
          </button>
          <button onClick={() => navigate("/customer/products")} style={{ padding: "12px 22px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${ac},#92400e)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
            Shop More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", animation: "fadeUp .4s ease both" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>

      <button onClick={() => navigate("/customer/products")} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", cursor: "pointer", color: "rgba(26,26,46,.5)", fontSize: "13px", marginBottom: "24px", padding: 0 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        Back to Products
      </button>

      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", margin: "0 0 24px" }}>Place Order</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.4)" }}>
          <p>No items in cart. <span style={{ color: ac, cursor: "pointer", fontWeight: 700 }} onClick={() => navigate("/customer/products")}>Browse Products</span></p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Order Items */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Order Items ({cart.length})</h3>
            </div>
            <div style={{ padding: "0 22px" }}>
              {cart.map((item, i) => (
                <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < cart.length - 1 ? "1px solid rgba(26,26,46,.06)" : "none" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>{item.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)", marginTop: "2px" }}>Qty: {item.qty} × {currency}{Number(item.price || item.sellingPrice || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: ac }}>{currency}{(Number(item.price || item.sellingPrice || 0) * item.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "16px 22px", background: acLight, borderTop: "1px solid rgba(180,83,9,.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#1a1a2e" }}>Grand Total</span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: ac }}>{currency}{subtotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Payment Method</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {PAYMENT_MODES.map(mode => {
                const isSelected = paymentMode === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => setPaymentMode(mode.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "13px 14px",
                      borderRadius: "14px",
                      border: isSelected ? `2px solid ${mode.color}` : "1.5px solid rgba(26,26,46,.1)",
                      background: isSelected ? mode.bg : "#fafafa",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all .18s",
                      outline: "none",
                    }}
                  >
                    <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>{mode.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 800, color: isSelected ? mode.color : "#1a1a2e", lineHeight: 1.2 }}>{mode.label}</div>
                      <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>{mode.desc}</div>
                    </div>
                    {isSelected && (
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: mode.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Online payment details panel */}
            {paymentMode !== "CASH" && (
              <PaymentInfoPanel method={paymentMode} amount={subtotal} />
            )}

            {/* Cash on delivery note */}
            {paymentMode === "CASH" && (
              <div style={{ padding: "13px 16px", borderRadius: "12px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.18)", display: "flex", alignItems: "center", gap: "10px", animation: "fadeIn .25s ease both" }}>
                <span style={{ fontSize: "20px" }}>🛵</span>
                <div style={{ fontSize: "12px", color: "#059669", fontWeight: 600, lineHeight: 1.5 }}>
                  Pay in cash when your order arrives at your doorstep. Please keep exact change ready.
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Special Instructions <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(26,26,46,.35)" }}>(Optional)</span></h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions or delivery notes..."
              rows={3} style={{ width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "14px", background: "#fff", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "12px", padding: "14px 18px", color: "#dc2626", fontSize: "13.5px" }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={placing} style={{
            padding: "16px", borderRadius: "14px", border: "none", fontSize: "16px", fontWeight: 800,
            background: placing ? "rgba(26,26,46,.1)" : `linear-gradient(135deg,${ac},#92400e)`,
            color: placing ? "rgba(26,26,46,.3)" : "#fff", cursor: placing ? "not-allowed" : "pointer", transition: "all .2s",
          }}>
            {placing ? "Placing Order..." : `Confirm Order · ${currency}${subtotal.toLocaleString()}`}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "rgba(26,26,46,.3)", fontSize: "11px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            TLS 1.3 Encrypted · Secure Checkout · EVARA V1.0
          </div>
        </div>
      )}
    </div>
  );
}
