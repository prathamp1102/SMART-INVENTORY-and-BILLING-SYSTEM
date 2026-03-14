import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const STATUS_STYLE = {
  CONFIRMED: { bg: "rgba(5,150,105,.1)", color: "#059669" },
  PAID:      { bg: "rgba(5,150,105,.1)", color: "#059669" },
  PENDING:   { bg: "rgba(245,158,11,.1)", color: "#d97706" },
  PARTIAL:   { bg: "rgba(245,158,11,.1)", color: "#d97706" },
  CANCELLED: { bg: "rgba(239,68,68,.1)", color: "#dc2626" },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const currency = "₹";

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Invoices are the primary source — backend now filters by customerId for CUSTOMER role
      const res = await axiosInstance.get("/invoices");
      const all = Array.isArray(res.data) ? res.data : (res.data?.invoices || []);
      setOrders(all);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    const id = (o.invoiceNo || o.invoiceNumber || o._id || "").toLowerCase();
    const cust = (o.customerName || "").toLowerCase();
    const matchSearch = id.includes(search.toLowerCase()) || cust.includes(search.toLowerCase());
    const status = o.status || o.paymentStatus || "CONFIRMED";
    const matchStatus = statusFilter === "all" || status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Order History</h1>
        <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", marginTop: "5px" }}>View all your past orders and their status</p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Orders", value: orders.length, icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" },
          { label: "Completed", value: orders.filter(o => ["CONFIRMED","PAID"].includes(o.status || o.paymentStatus)).length, icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Pending", value: orders.filter(o => (o.status || o.paymentStatus) === "PENDING").length, icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(26,26,46,.08)", padding: "18px 20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: acLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e" }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em", marginTop: "3px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803" />
          </svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search orders..."
            style={{ width: "100%", paddingLeft: "36px", paddingRight: "12px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "14px", outline: "none", background: "#fff", boxSizing: "border-box" }} />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "10px 14px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "14px", background: "#fff", cursor: "pointer", outline: "none" }}>
          <option value="all">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.4)" }}>Loading orders...</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.4)" }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.2)" strokeWidth="1.4" style={{ marginBottom: "12px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p>No orders found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 80px", padding: "12px 20px", borderBottom: "1px solid rgba(26,26,46,.06)", background: "rgba(26,26,46,.02)" }}>
              {["Order ID", "Date", "Amount", "Status", ""].map((h, i) => (
                <div key={i} style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'DM Mono',monospace" }}>{h}</div>
              ))}
            </div>

            {paginated.map((order, idx) => {
              const orderId = order.invoiceNo || order.invoiceNumber || order._id;
              const status = order.status || order.paymentStatus || "CONFIRMED";
              const st = STATUS_STYLE[status] || STATUS_STYLE.CONFIRMED;
              const isOpen = expanded === idx;
              const items = order.items || [];
              return (
                <div key={order._id || idx}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 80px", padding: "14px 20px", borderBottom: "1px solid rgba(26,26,46,.05)", alignItems: "center", cursor: "pointer", transition: "background .15s" }}
                    onClick={() => setExpanded(isOpen ? null : idx)}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: ac }}>{String(orderId).slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: "13px", color: "rgba(26,26,46,.6)" }}>{formatDate(order.date || order.createdAt)}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>₹{Number(order.grandTotal || order.totalAmount || 0).toLocaleString()}</div>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "99px", background: st.bg, color: st.color, width: "fit-content" }}>{status}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={e => { e.stopPropagation(); navigate(`/billing/invoice/${order._id}`); }}
                        style={{ padding: "5px 10px", borderRadius: "7px", border: `1px solid ${acBorder}`, background: acLight, color: ac, fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>View</button>
                    </div>
                  </div>
                  {isOpen && items.length > 0 && (
                    <div style={{ padding: "12px 20px 16px 40px", background: "rgba(26,26,46,.015)", borderBottom: "1px solid rgba(26,26,46,.05)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(26,26,46,.4)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: ".08em" }}>Items</div>
                      {items.map((it, ii) => (
                        <div key={ii} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: ii < items.length - 1 ? "1px solid rgba(26,26,46,.04)" : "none" }}>
                          <span style={{ fontSize: "13px", color: "#1a1a2e" }}>{it.productName || it.name} <span style={{ color: "rgba(26,26,46,.4)" }}>× {it.qty}</span></span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: ac }}>₹{Number(it.total || (it.unitPrice * it.qty) || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "16px" }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.1)", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>←</button>
                <span style={{ fontSize: "13px", color: "rgba(26,26,46,.5)" }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.1)", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>→</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/customer/products")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Order
        </button>
        <button onClick={() => navigate("/billing/invoice")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", color: "#1a1a2e", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" /></svg>
          All Invoices
        </button>
      </div>
    </div>
  );
}
