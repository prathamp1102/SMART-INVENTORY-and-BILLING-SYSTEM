import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";

const ac         = "#059669";
const acLight    = "rgba(5,150,105,.08)";
const acBorder   = "rgba(5,150,105,.2)";
const acGlow     = "rgba(5,150,105,.18)";
const purple     = "#7c3aed";
const purpleLight  = "rgba(124,58,237,.08)";
const purpleBorder = "rgba(124,58,237,.2)";
const green      = "#059669";
const greenLight   = "rgba(5,150,105,.08)";
const greenBorder  = "rgba(5,150,105,.2)";
const red        = "#dc2626";

function Spinner({ size = 20, color = ac }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid rgba(5,150,105,.15)", borderTopColor: color, animation: "spin .7s linear infinite", flexShrink: 0 }} />;
}

function KpiCard({ icon, label, value, trend, trendUp, color = ac, light = acLight, border = acBorder, delay = "0s", onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: "20px", border: `1px solid ${border}`, padding: "22px", cursor: onClick ? "pointer" : "default", transition: "all .22s", animation: `fadeUp .45s ease ${delay} both` }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 36px ${border}`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: light, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
        </div>
        {trend && <span style={{ fontSize: "11px", fontWeight: 700, color: trendUp ? green : red, background: trendUp ? "rgba(5,150,105,.1)" : "rgba(239,68,68,.1)", padding: "3px 8px", borderRadius: "99px", fontFamily: "'DM Mono',monospace" }}>{trendUp ? "↑" : "↓"} {trend}</span>}
      </div>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: "30px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-.04em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: "8px" }}>{label}</div>
    </div>
  );
}

function ActionTile({ icon, label, desc, color = ac, light = acLight, border = acBorder, onClick, badge }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px", borderRadius: "13px", border: `1px solid ${border}`, background: light, cursor: "pointer", transition: "all .18s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = `0 4px 18px ${border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: "#fff", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${border}` }}>
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e", display: "flex", alignItems: "center", gap: "7px" }}>
          {label}
          {badge && <span style={{ fontSize: "10px", fontWeight: 700, color: red, background: "rgba(239,68,68,.1)", padding: "1px 7px", borderRadius: "99px", fontFamily: "'DM Mono',monospace" }}>{badge}</span>}
        </div>
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
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

function InfoChip({ icon, label, value, color }) {
  return (
    <div style={{ background: "rgba(26,26,46,.025)", borderRadius: 9, padding: "8px 10px", border: "1px solid rgba(26,26,46,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

function OrgBranchBanner({ profile, loading }) {
  if (loading) return (
    <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${acBorder}`, padding: "20px 24px", marginBottom: 22, display: "flex", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  const org    = profile?.organization || profile?.branch?.organization || null;
  const branch = profile?.branch;

  return (
    <div style={{ display: "grid", gridTemplateColumns: branch ? "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" : "1fr", gap: 14, marginBottom: 22, animation: "fadeUp .35s ease both" }}>

      <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${purpleBorder}`, padding: "18px 22px", boxShadow: `0 4px 20px ${purpleLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: org ? 14 : 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${purple},#6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${purpleBorder}` }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: purple, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 2 }}>Your Organization</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: org ? "#1a1a2e" : "rgba(26,26,46,.3)", fontStyle: org ? "normal" : "italic" }}>
              {org ? org.name : "Not assigned"}
            </div>
          </div>
          {org && (
            <span style={{ fontSize: 10, fontWeight: 700, color: org.status === "ACTIVE" ? green : "#b45309", background: org.status === "ACTIVE" ? greenLight : "rgba(180,83,9,.08)", border: `1px solid ${org.status === "ACTIVE" ? greenBorder : "rgba(180,83,9,.2)"}`, borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
              {org.status}
            </span>
          )}
        </div>
        {org && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {org.city      && <InfoChip icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" label="City"  value={org.city}      color={purple} />}
            {org.gstNumber && <InfoChip icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5" label="GST"   value={org.gstNumber} color={purple} />}
            {org.email     && <InfoChip icon="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" label="Email" value={org.email}     color={purple} />}
            {org.phone     && <InfoChip icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" label="Phone" value={org.phone}     color={purple} />}
          </div>
        )}
        {!org && <p style={{ fontSize: 12, color: "rgba(26,26,46,.4)", margin: 0 }}>Ask your Admin to assign you to an organization.</p>}
      </div>

      {branch && (
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${greenBorder}`, padding: "18px 22px", boxShadow: `0 4px 20px ${greenLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${green},#047857)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${greenBorder}` }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: green, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 2 }}>Your Branch</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>{branch.branchName}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: branch.status === "ACTIVE" ? green : "#b45309", background: branch.status === "ACTIVE" ? greenLight : "rgba(180,83,9,.08)", border: `1px solid ${branch.status === "ACTIVE" ? greenBorder : "rgba(180,83,9,.2)"}`, borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
              {branch.status}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {branch.city    && <InfoChip icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" label="City"    value={branch.city}    color={green} />}
            {branch.address && <InfoChip icon="M2.25 21.75h19.5m-18-18v18m10.5-18v18m6-13.5V21"                                                                    label="Address" value={branch.address} color={green} />}
            {branch.phone   && <InfoChip icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" label="Phone"   value={branch.phone}   color={green} />}
            {branch.email   && <InfoChip icon="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" label="Email"   value={branch.email}   color={green} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const [profile, setProfile]               = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [lowStockCount, setLowStockCount]   = useState(0);
  const [invoicesToday, setInvoicesToday]   = useState(0);
  const [returnsToday, setReturnsToday]     = useState(0);
  const [grnToday, setGrnToday]             = useState(0);
  const [salesToday, setSalesToday]         = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    axiosInstance.get("/auth/me")
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));

    axiosInstance.get("/products")
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setLowStockCount(all.filter(p => p.stock <= 10).length);
      }).catch(() => {});

    const today = new Date().toISOString().split("T")[0];
    axiosInstance.get("/invoices", { params: { from: today, to: today } })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        const paid = list.filter(i => i.status === "PAID");
        setInvoicesToday(paid.length);
        setSalesToday(paid.reduce((s, i) => s + (i.grandTotal || 0), 0));
        setRecentInvoices(list.slice(0, 6));
      }).catch(() => {});

    axiosInstance.get("/returns")
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        setReturnsToday(list.filter(ret => new Date(ret.createdAt) >= todayStart).length);
      }).catch(() => {});

    // GRN entries today
    axiosInstance.get("/grn")
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        setGrnToday(list.filter(g => new Date(g.createdAt) >= todayStart).length);
      }).catch(() => setGrnToday(0));
  }, []);

  const orgName    = profile?.organization?.name || profile?.branch?.organization?.name;
  const branchName = profile?.branch?.branchName;
  const contextLabel = branchName ? `${orgName || "—"} · ${branchName}` : orgName || "No organization assigned";

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
      `}</style>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ac, boxShadow: `0 0 8px ${acGlow}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: ac, letterSpacing: ".2em", textTransform: "uppercase" }}>Staff Panel · Active Shift</span>
          </div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: "30px", fontWeight: 700, color: "#1a1a2e", letterSpacing: "-.04em", margin: 0, lineHeight: 1.1 }}>
            {greeting}, <em style={{ color: ac, fontStyle: "italic" }}>{user?.name?.split(" ")[0]}</em> 👨‍💻
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(26,26,46,.45)", marginTop: "7px" }}>
            Billing & stock operations · {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          {!profileLoading && (orgName || branchName) && (
            <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 99, background: acLight, border: `1px solid ${acBorder}` }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" /></svg>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: ac, fontWeight: 600 }}>{contextLabel}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/sales/desk")} style={{ padding: "10px 22px", borderRadius: "12px", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${ac},#047857)`, color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Poppins',sans-serif", boxShadow: `0 4px 18px ${acGlow}`, display: "flex", alignItems: "center", gap: "7px" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            New Invoice
          </button>
          <button onClick={() => navigate("/billing/returns")} style={{ padding: "10px 18px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, cursor: "pointer", background: acLight, color: ac, fontSize: "13px", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>
            Process Return
          </button>
        </div>
      </div>

      {/* ── Org / Branch Banner ─────────────────────────── */}
      <OrgBranchBanner profile={profile} loading={profileLoading} />

      {/* ── KPIs ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(175px,100%), 1fr))", gap: "14px", marginBottom: "22px" }}>
        <KpiCard icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18" label="Invoices Today" value={invoicesToday} delay="0s" onClick={() => navigate("/billing/invoice")} />
        <KpiCard icon="M2.25 18.75a60.07 60.07 0 0115.797 2.101" label="Sales Today" value={salesToday != null ? `₹${salesToday >= 1000 ? (salesToday / 1000).toFixed(1) + "k" : salesToday}` : "—"} delay=".06s" color={ac} onClick={() => navigate("/reports/sales")} />
        <KpiCard icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25" label="Low Stock Items" value={lowStockCount} trendUp={false} color={red} light="rgba(239,68,68,.08)" border="rgba(239,68,68,.2)" delay=".12s" onClick={() => navigate("/inventory/stock")} />
        <KpiCard icon="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" label="Returns Today" value={returnsToday} trendUp={false} color="#b45309" light="rgba(180,83,9,.08)" border="rgba(180,83,9,.2)" delay=".18s" onClick={() => navigate("/billing/returns")} />
        <KpiCard icon="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" label="GRN Today" value={grnToday} delay=".24s" onClick={() => navigate("/inventory/grn")} />
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%), 1fr))", gap: "16px", marginBottom: "16px" }}>
        <SectionBox title="Billing & Sales" icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18">
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <ActionTile icon="M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.625-3.375 2.25-3.375-2.25-4.125 2.625V4.757" label="Sales Desk" desc="Scan or search products, apply discount & generate bill" onClick={() => navigate("/sales/desk")} />
            <ActionTile icon="M9 12h3.75M9 15h3.75" label="View All Invoices" desc="Search, filter & reprint receipts" onClick={() => navigate("/billing/invoice")} />
            <ActionTile icon="M9 15L3 9m0 0l6-6M3 9h12" label="Process Return" desc="Accept return & issue refund" onClick={() => navigate("/billing/returns")} />
            <ActionTile icon="M3 13.125C3 12.504 3.504 12 4.125 12" label="Daily Sales Summary" desc="View your shift billing report" onClick={() => navigate("/inventory/reports")} />
          </div>
        </SectionBox>

        <SectionBox title="Inventory Tasks" icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25">
          <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
            <ActionTile icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25" label="Stock Management" desc="Check availability & update levels" badge={lowStockCount > 0 ? `${lowStockCount} low` : undefined} onClick={() => navigate("/inventory/stock")} />
            <ActionTile icon="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5" label="Record GRN" desc="Log received goods from supplier" onClick={() => navigate("/inventory/grn")} />
            <ActionTile icon="M3 13.125C3 12.504 3.504 12 4.125 12" label="Inventory Reports" desc="Stock movement & damage entries" onClick={() => navigate("/inventory/reports")} />
            <ActionTile icon="M9.568 3H5.25A2.25 2.25 0 003 5.25" label="Check Product Stock" desc="Verify availability before billing" onClick={() => navigate("/products")} />
            <ActionTile icon="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63" label="Service Requests" desc="View & update assigned complaints" onClick={() => navigate("/staff/service-requests")} />
          </div>
        </SectionBox>
      </div>

      {/* ── Recent Invoices ──────────────────────────────── */}
      <SectionBox title="Recent Invoices" icon="M9 12h3.75M9 15h3.75M9 18h3.75"
        right={
          <button onClick={() => navigate("/billing/invoice")} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: ac, letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "99px", background: acLight, border: `1px solid ${acBorder}`, cursor: "pointer" }}>
            View All
          </button>
        }>
        {recentInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "rgba(26,26,46,.35)", fontSize: 13 }}>No invoices yet today</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Invoice", "Customer", "Amount", "Method", "Status"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".13em", textTransform: "uppercase", borderBottom: "1px solid rgba(26,26,46,.06)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv._id} style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 10px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: ac }}>{inv.invoiceNo || "—"}</td>
                  <td style={{ padding: "11px 10px", fontSize: "13px", color: "#1a1a2e" }}>{inv.customerName || "Walk-in"}</td>
                  <td style={{ padding: "11px 10px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>₹{inv.grandTotal?.toLocaleString("en-IN") || "0"}</td>
                  <td style={{ padding: "11px 10px", fontSize: "12px", color: "rgba(26,26,46,.5)" }}>{inv.paymentMode || "—"}</td>
                  <td style={{ padding: "11px 10px" }}>
                    <span style={{
                      padding: "2px 9px", borderRadius: "99px", fontSize: "10.5px", fontFamily: "'DM Mono',monospace", fontWeight: 600,
                      color:       inv.status === "PAID" ? green     : inv.status === "PENDING" ? "#b45309"              : red,
                      background:  inv.status === "PAID" ? "rgba(5,150,105,.08)" : inv.status === "PENDING" ? "rgba(180,83,9,.08)" : "rgba(239,68,68,.08)",
                      border: `1px solid ${inv.status === "PAID" ? "rgba(5,150,105,.2)" : inv.status === "PENDING" ? "rgba(180,83,9,.2)" : "rgba(239,68,68,.2)"}`,
                    }}>
                      {inv.status}
                    </span>
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
