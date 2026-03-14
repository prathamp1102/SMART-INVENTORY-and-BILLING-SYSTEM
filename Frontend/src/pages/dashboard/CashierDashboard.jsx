import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";
const acGlow = "rgba(180,83,9,.18)";
const green = "#059669";
const greenLight = "rgba(5,150,105,.08)";
const greenBorder = "rgba(5,150,105,.2)";
const red = "#dc2626";

function Spinner({ size = 20, color = ac }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid rgba(180,83,9,.15)`, borderTopColor: color, animation: "spin .7s linear infinite", flexShrink: 0 }} />
  );
}

function KpiCard({ icon, label, value, trend, trendUp, color = ac, light = acLight, border = acBorder, delay = "0s", onClick, loading }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: "20px", border: `1px solid ${border}`, padding: "22px", cursor: onClick ? "pointer" : "default", transition: "all .22s", animation: `fadeUp .45s ease ${delay} both` }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 36px ${border}`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: light, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
        </div>
        {trend && !loading && <span style={{ fontSize: "11px", fontWeight: 700, color: trendUp ? green : red, background: trendUp ? "rgba(5,150,105,.1)" : "rgba(239,68,68,.1)", padding: "3px 8px", borderRadius: "99px", fontFamily: "'DM Mono',monospace" }}>{trendUp ? "↑" : "↓"} {trend}</span>}
      </div>
      {loading ? (
        <div style={{ display: "flex", padding: "8px 0" }}><Spinner size={18} /></div>
      ) : (
        <>
          <div style={{ fontFamily: "'Figtree',sans-serif", fontSize: "30px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-.04em", lineHeight: 1 }}>{value ?? "—"}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: "8px" }}>{label}</div>
        </>
      )}
    </div>
  );
}

function ActionTile({ icon, label, desc, color = ac, light = acLight, border = acBorder, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px", borderRadius: "13px", border: `1px solid ${border}`, background: light, cursor: "pointer", transition: "all .18s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = `0 4px 18px ${border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "#fff", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${border}` }}>
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>{label}</div>
        <div style={{ fontSize: "11.5px", color: "rgba(26,26,46,.45)", marginTop: "2px" }}>{desc}</div>
      </div>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.25)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </div>
  );
}

function SectionBox({ title, icon, children, right }) {
  return (
    <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", boxShadow: "0 2px 16px rgba(26,26,46,.05)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
          </div>
          <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

export default function CashierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const [loadingKpis, setLoadingKpis]         = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [totalOrders, setTotalOrders]         = useState(null);
  const [totalInvoices, setTotalInvoices]     = useState(null);
  const [totalSpent, setTotalSpent]           = useState(null);
  const [openReturns, setOpenReturns]         = useState(null);
  const [recentInvoices, setRecentInvoices]   = useState([]);

  const fmtMoney = (n) => {
    if (n == null) return "—";
    if (n >= 1e7)  return `₹${(n / 1e7).toFixed(2)}Cr`;
    if (n >= 1e5)  return `₹${(n / 1e5).toFixed(1)}L`;
    if (n >= 1e3)  return `₹${(n / 1e3).toFixed(1)}k`;
    return `₹${n}`;
  };

  useEffect(() => {
    // Invoices — backend scopes by JWT user
    axiosInstance.get("/invoices")
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        const active = list.filter(i => i.status !== "CANCELLED");
        setTotalOrders(active.length);
        setTotalInvoices(list.length);
        setTotalSpent(active.reduce((s, i) => s + (i.grandTotal || 0), 0));
        setRecentInvoices(list.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => { setLoadingKpis(false); setLoadingInvoices(false); });

    // Pending returns
    axiosInstance.get("/returns")
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setOpenReturns(list.filter(ret => ret.status === "PENDING").length);
      })
      .catch(() => setOpenReturns(0));
  }, []);

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: green, boxShadow: "0 0 8px rgba(5,150,105,.5)", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: ac, letterSpacing: ".2em", textTransform: "uppercase" }}>Customer Portal</span>
          </div>
          <h1 style={{ fontFamily: "'Figtree',sans-serif", fontSize: "30px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-.04em", margin: 0, lineHeight: 1.1 }}>
            {greeting}, <em style={{ color: ac, fontStyle: "italic" }}>{user?.name?.split(" ")[0]}</em> 👋
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(26,26,46,.45)", marginTop: "7px" }}>Your orders, invoices &amp; account — all in one place.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/profile")} style={{ padding: "10px 20px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, cursor: "pointer", background: acLight, color: ac, fontSize: "13px", fontWeight: 700, fontFamily: "'Figtree',sans-serif", display: "flex", alignItems: "center", gap: "7px" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
            My Profile
          </button>
          <button onClick={() => navigate("/change-password")} style={{ padding: "10px 20px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.14)", cursor: "pointer", background: "#fff", color: "rgba(26,26,46,.65)", fontSize: "13px", fontWeight: 600, fontFamily: "'Figtree',sans-serif" }}>Change Password</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: "14px", marginBottom: "22px" }}>
        <KpiCard loading={loadingKpis} icon="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.09.85-.672 1.575-1.526 1.51l-15.626-1.183" label="Total Orders" value={totalOrders} trend="lifetime" trendUp delay="0s" />
        <KpiCard loading={loadingKpis} icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" label="Total Invoices" value={totalInvoices} trend="all time" trendUp delay=".06s" onClick={() => navigate("/billing/invoice")} />
        <KpiCard loading={loadingKpis} icon="M2.25 18.75a60.07 60.07 0 0115.797 2.101" label="Total Spent" value={fmtMoney(totalSpent)} trend="lifetime" trendUp delay=".12s" />
        <KpiCard loading={loadingKpis} icon="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" label="Open Returns" value={openReturns} trend={openReturns > 0 ? "in process" : "none pending"} trendUp={false} color={red} light="rgba(239,68,68,.08)" border="rgba(239,68,68,.2)" delay=".18s" onClick={() => navigate("/billing/returns")} />
      </div>

      {/* Quick actions + Account */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px", marginBottom: "16px" }}>
        <SectionBox title="My Orders & Payments" icon="M9 12h3.75M9 15h3.75M9 18h3.75">
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <ActionTile icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25" label="Browse Products" desc="View catalog & add to cart" onClick={() => navigate("/customer/products")} />
            <ActionTile icon="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75" label="Place an Order" desc="Order products directly" onClick={() => navigate("/customer/products")} />
            <ActionTile icon="M9 12h3.75M9 15h3.75M9 18h3.75" label="Order History" desc="View all past orders" onClick={() => navigate("/customer/order-history")} />
            <ActionTile icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" label="Track Order" desc="Check your order status" onClick={() => navigate("/customer/track-order")} />
            <ActionTile icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6" label="Register Warranty" desc="Register your inverter warranty" onClick={() => navigate("/customer/register-warranty")} />
            <ActionTile icon="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877" label="Service Request" desc="Raise a complaint or repair request" onClick={() => navigate("/customer/service-request")} />
            <ActionTile icon="M9 6.75V15m6-6v8.25" label="Track Complaint" desc="Monitor your service request status" onClick={() => navigate("/customer/track-complaint")} />
            <ActionTile icon="M9 15L3 9m0 0l6-6M3 9h12" label="Request a Return" desc="Return products & track refund status" onClick={() => navigate("/billing/returns")} />
          </div>
        </SectionBox>

        <SectionBox title="My Account" icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z">
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", borderRadius: "14px", background: acLight, border: `1px solid ${acBorder}`, marginBottom: "14px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `linear-gradient(135deg,${ac},#92400e)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${acGlow}` }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>{user?.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a2e", fontFamily: "'Figtree',sans-serif" }}>{user?.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(26,26,46,.5)", marginTop: "2px" }}>{user?.email}</div>
              <span style={{ display: "inline-block", marginTop: "5px", fontSize: "10px", fontFamily: "'DM Mono',monospace", color: ac, background: acLight, border: `1px solid ${acBorder}`, padding: "2px 8px", borderRadius: "99px" }}>Customer</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <ActionTile icon="M15.75 6a3.75 3.75 0 11-7.5 0" label="Update Profile" desc="Change name & contact details" onClick={() => navigate("/profile")} />
            <ActionTile icon="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5" label="Change Password" desc="Update your login credentials" onClick={() => navigate("/change-password")} />
          </div>

          {!loadingKpis && totalOrders != null && (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Orders", value: totalOrders, color: ac },
                { label: "Spent", value: fmtMoney(totalSpent), color: "#0284c7" },
                { label: "Invoices", value: totalInvoices, color: green },
                { label: "Returns", value: openReturns, color: red },
              ].map(item => (
                <div key={item.label} style={{ borderRadius: 11, border: `1px solid ${item.color}22`, padding: "10px 12px", textAlign: "center", background: `${item.color}08` }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: item.color, letterSpacing: "-.04em", lineHeight: 1 }}>{item.value ?? "—"}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </SectionBox>
      </div>

      {/* Recent Invoices */}
      <SectionBox title="Recent Invoice History" icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18"
        right={<button onClick={() => navigate("/billing/invoice")} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: ac, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "99px", background: acLight, border: `1px solid ${acBorder}`, cursor: "pointer" }}>View All</button>}>

        {loadingInvoices ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 28 }}><Spinner /></div>
        ) : recentInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "rgba(26,26,46,.35)", fontSize: 13 }}>No invoices found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Invoice No.", "Date", "Amount", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".13em", textTransform: "uppercase", borderBottom: "1px solid rgba(26,26,46,.06)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv._id} style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 12px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: ac }}>{inv.invoiceNo || "—"}</td>
                  <td style={{ padding: "12px 12px", fontSize: "13px", color: "rgba(26,26,46,.55)" }}>
                    {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td style={{ padding: "12px 12px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>
                    ₹{(inv.grandTotal || 0).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px", fontSize: "10.5px", fontFamily: "'DM Mono',monospace", fontWeight: 600,
                      color: inv.status === "PAID" ? green : inv.status === "CANCELLED" ? red : ac,
                      background: inv.status === "PAID" ? "rgba(5,150,105,.08)" : inv.status === "CANCELLED" ? "rgba(239,68,68,.08)" : "rgba(180,83,9,.08)",
                      border: `1px solid ${inv.status === "PAID" ? "rgba(5,150,105,.2)" : inv.status === "CANCELLED" ? "rgba(239,68,68,.2)" : "rgba(180,83,9,.2)"}`,
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 12px" }}>
                    <button onClick={() => navigate(`/billing/invoice/${inv._id}`)}
                      style={{ padding: "4px 12px", borderRadius: "8px", border: `1px solid ${acBorder}`, background: acLight, color: ac, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 600, cursor: "pointer" }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionBox>
    </div>
  );
}
