import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const STEPS = [
  { key: "placed",     label: "Order Placed",      desc: "Your order has been received",      icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" },
  { key: "confirmed",  label: "Confirmed",          desc: "Order confirmed by the store",       icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "processing", label: "Processing",         desc: "Items being prepared",               icon: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" },
  { key: "ready",      label: "Ready",              desc: "Order ready for pickup/delivery",    icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3m4.125-7.5H3M3 6.75h18M3 12h18" },
  { key: "completed",  label: "Completed",          desc: "Order successfully delivered",       icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
];

function getStepIndex(status) {
  if (!status) return 1;
  const s = status.toUpperCase();
  if (s === "CANCELLED") return -1;
  if (s === "CONFIRMED" || s === "PAID") return 4;
  if (s === "PENDING") return 1;
  return 1;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!orderId.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      // Try invoice by ID first
      const res = await axiosInstance.get(`/invoices/${orderId.trim()}`);
      setOrder(res.data);
    } catch {
      try {
        // Fallback: search through invoices
        const res2 = await axiosInstance.get("/invoices");
        const all = Array.isArray(res2.data) ? res2.data : (res2.data?.invoices || []);
        const found = all.find(o =>
          (o.invoiceNo || o.invoiceNumber || "").toLowerCase().includes(orderId.trim().toLowerCase()) ||
          (o._id || "").toLowerCase() === orderId.trim().toLowerCase()
        );
        if (found) setOrder(found);
        else setError("Order not found. Please check the Order ID and try again.");
      } catch {
        setError("Could not retrieve order. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = order ? getStepIndex(order.status || order.paymentStatus) : -1;
  const isCancelled = order && ((order.status || order.paymentStatus || "").toUpperCase() === "CANCELLED");

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Track Order</h1>
        <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", marginTop: "5px" }}>Enter your Order ID to track its status</p>
      </div>

      {/* Search */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(26,26,46,.5)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: ".08em" }}>Order ID / Invoice Number</label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleTrack()}
            placeholder="e.g. INV-1082 or order ID..."
            style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.12)", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={handleTrack} disabled={loading || !orderId.trim()} style={{
            padding: "12px 22px", borderRadius: "12px", border: "none", fontSize: "14px", fontWeight: 700,
            background: orderId.trim() ? `linear-gradient(135deg,${ac},#92400e)` : "rgba(26,26,46,.08)",
            color: orderId.trim() ? "#fff" : "rgba(26,26,46,.3)", cursor: orderId.trim() ? "pointer" : "not-allowed"
          }}>
            {loading ? "Tracking..." : "Track"}
          </button>
        </div>
        {error && <div style={{ marginTop: "10px", color: "#dc2626", fontSize: "13px" }}>{error}</div>}
      </div>

      {/* Order Result */}
      {order && (
        <div style={{ animation: "fadeUp .35s ease both" }}>
          {/* Order Info */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>Order ID</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: ac }}>{order.invoiceNo || order.invoiceNumber || String(order._id).slice(-8).toUpperCase()}</div>
              </div>
              <span style={{
                fontSize: "12px", fontWeight: 700, padding: "5px 12px", borderRadius: "99px",
                background: isCancelled ? "rgba(239,68,68,.1)" : (order.status === "CONFIRMED" || order.status === "PAID") ? "rgba(5,150,105,.1)" : "rgba(245,158,11,.1)",
                color: isCancelled ? "#dc2626" : (order.status === "CONFIRMED" || order.status === "PAID") ? "#059669" : "#d97706"
              }}>
                {order.status || order.paymentStatus || "CONFIRMED"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { l: "Date", v: order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { l: "Amount", v: `₹${Number(order.grandTotal || order.totalAmount || 0).toLocaleString()}` },
                { l: "Payment", v: order.paymentMode || order.paymentMethod || "—" },
                { l: "Items", v: (order.items || []).length + " item(s)" },
              ].map((info, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(26,26,46,.025)", border: "1px solid rgba(26,26,46,.06)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>{info.l}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>{info.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Tracker */}
          {!isCancelled ? (
            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "24px", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 24px", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Order Progress</h3>
              {STEPS.map((step, i) => {
                const done = i < stepIndex;
                const active = i === stepIndex - 1;
                return (
                  <div key={step.key} style={{ display: "flex", gap: "14px", marginBottom: i < STEPS.length - 1 ? "0" : "0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: done || active ? acLight : "rgba(26,26,46,.04)",
                        border: done || active ? `2px solid ${ac}` : "2px solid rgba(26,26,46,.1)",
                      }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={done || active ? ac : "rgba(26,26,46,.25)"} strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                        </svg>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ width: "2px", flex: 1, minHeight: "28px", background: done ? ac : "rgba(26,26,46,.08)", margin: "4px 0" }} />
                      )}
                    </div>
                    <div style={{ paddingTop: "6px", paddingBottom: i < STEPS.length - 1 ? "16px" : "0" }}>
                      <div style={{ fontSize: "14px", fontWeight: done || active ? 700 : 500, color: done || active ? "#1a1a2e" : "rgba(26,26,46,.35)" }}>{step.label}</div>
                      <div style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: "rgba(239,68,68,.06)", borderRadius: "16px", border: "1.5px solid rgba(239,68,68,.15)", padding: "20px 22px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>Order Cancelled</div>
                  <div style={{ fontSize: "12px", color: "rgba(239,68,68,.7)", marginTop: "2px" }}>This order has been cancelled.</div>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {(order.items || []).length > 0 && (
            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a2e" }}>Order Items</h3>
              </div>
              {(order.items || []).map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", borderBottom: i < order.items.length - 1 ? "1px solid rgba(26,26,46,.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1a2e" }}>{it.productName || it.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>Qty: {it.qty}</div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: ac }}>₹{Number(it.total || (it.unitPrice * it.qty) || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          {/* View Full Invoice */}
          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            <button onClick={() => navigate(`/billing/invoice/${order._id}`)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              View Full Invoice
            </button>
            <button onClick={() => navigate("/customer/order-history")} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.1)", background: "#fff", color: "#1a1a2e", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              All Orders
            </button>
          </div>
        </div>
      )}

      {/* Help */}
      {!order && !loading && (
        <div style={{ background: acLight, borderRadius: "16px", border: `1px solid ${acBorder}`, padding: "18px 22px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: ac, marginBottom: "6px" }}>How to find your Order ID?</div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "rgba(26,26,46,.6)", lineHeight: 1.8 }}>
            <li>Check your invoice or confirmation email</li>
            <li>Go to <span style={{ color: ac, cursor: "pointer", fontWeight: 700 }} onClick={() => navigate("/customer/order-history")}>Order History</span> to find your order</li>
            <li>The format is usually INV-XXXX</li>
          </ul>
        </div>
      )}
    </div>
  );
}
