import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";

/* ── design tokens ─────────────────────────────────────────── */
const C = {
  purple:  "#6d28d9", purpleL: "rgba(109,40,217,.08)", purpleB: "rgba(109,40,217,.22)", purpleG: "rgba(109,40,217,.2)",
  blue:    "#0369a1", blueL:   "rgba(3,105,161,.08)",  blueB:   "rgba(3,105,161,.22)",
  green:   "#047857", greenL:  "rgba(4,120,87,.08)",   greenB:  "rgba(4,120,87,.22)",
  red:     "#b91c1c", redL:    "rgba(185,28,28,.08)",  redB:    "rgba(185,28,28,.2)",
  amber:   "#92400e", amberL:  "rgba(146,64,14,.08)",  amberB:  "rgba(146,64,14,.2)",
  teal:    "#0f766e", tealL:   "rgba(15,118,110,.08)", tealB:   "rgba(15,118,110,.22)",
  ink:     "#0f172a", inkSoft: "rgba(15,18,42,.45)",   inkFaint:"rgba(15,18,42,.07)",
  bg:      "#f8fafc",
};

/* ── formatters ────────────────────────────────────────────── */
const fmtNum = n => {
  if (n == null) return "—";
  if (n >= 1e7) return `${(n/1e7).toFixed(1)}Cr`;
  if (n >= 1e5) return `${(n/1e5).toFixed(1)}L`;
  if (n >= 1e3) return `${(n/1e3).toFixed(1)}k`;
  return String(n);
};
const fmtRs = n => {
  if (n == null) return "—";
  if (n >= 1e7) return `₹${(n/1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n/1e3).toFixed(1)}k`;
  return `₹${n}`;
};

/* ── SVG Icon ──────────────────────────────────────────────── */
function Icon({ d, size = 18, color = "currentColor", w = 1.8 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── Skeleton loader ───────────────────────────────────────── */
function Sk({ h = 14, w = "100%" }) {
  return <div style={{ width: w, height: h, borderRadius: 7, background: "rgba(109,40,217,.07)", animation: "pulse 1.6s ease-in-out infinite" }} />;
}

/* ── Badge ─────────────────────────────────────────────────── */
function Badge({ children, color, bg, border }) {
  return (
    <span style={{ padding: "2px 9px", borderRadius: 99, background: bg, border: `1px solid ${border}`, color, fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700, letterSpacing: ".03em", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

/* ── Status Dot ────────────────────────────────────────────── */
function StatusDot({ active }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? C.green : C.red, display: "inline-block", flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, color: active ? C.green : C.red, fontWeight: 700 }}>{active ? "Active" : "Inactive"}</span>
    </span>
  );
}

/* ── Metric Card (top KPIs) ────────────────────────────────── */
function MetricCard({ icon, label, value, sub, badge, badgeUp, color, bg, border, onClick, loading, delay = "0s", trend }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 18, border: `1.5px solid ${hov && onClick ? color : border}`,
        padding: "18px 20px", cursor: onClick ? "pointer" : "default",
        transform: hov && onClick ? "translateY(-3px)" : "none",
        boxShadow: hov && onClick ? `0 12px 32px ${bg}` : "0 1px 8px rgba(15,18,42,.05)",
        transition: "all .2s", animation: `fadeUp .35s ease ${delay} both`,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* accent stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}66)`, borderRadius: "18px 18px 0 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, marginTop: 4 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon d={icon} color={color} size={16} />
        </div>
        {badge && !loading && (
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace", padding: "2px 8px", borderRadius: 99, color: badgeUp !== false ? C.green : C.red, background: badgeUp !== false ? C.greenL : C.redL, border: `1px solid ${badgeUp !== false ? C.greenB : C.redB}` }}>
            {badgeUp !== false ? "↑" : "↓"} {badge}
          </span>
        )}
      </div>

      {loading ? (
        <><Sk h={26} w="55%" /><div style={{ marginTop: 6 }}><Sk h={10} w="75%" /></div></>
      ) : (
        <>
          <div style={{ fontFamily: "'Figtree',sans-serif", fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "-.05em", lineHeight: 1, marginBottom: 5 }}>{value}</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.inkSoft, letterSpacing: ".16em", textTransform: "uppercase" }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 3 }}>{sub}</div>}
          {trend && (
            <div style={{ marginTop: 10, height: 28, display: "flex", alignItems: "flex-end", gap: 2 }}>
              {trend.map((v, i) => {
                const max = Math.max(...trend, 1);
                const h = Math.round((v / max) * 24) || 2;
                return <div key={i} style={{ flex: 1, height: h, borderRadius: 3, background: i === trend.length - 1 ? color : `${color}44`, transition: "height .3s" }} />;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Section Card wrapper ──────────────────────────────────── */
function Card({ title, icon, iconColor = C.purple, right, children, style = {}, noPad = false }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, border: `1.5px solid ${C.inkFaint}`, boxShadow: "0 1px 10px rgba(15,18,42,.04)", overflow: "hidden", ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: `1px solid ${C.inkFaint}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: C.purpleL, border: `1px solid ${C.purpleB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icon} color={iconColor} size={14} />
          </div>
          <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: 14.5, fontWeight: 800, color: C.ink }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={noPad ? {} : { padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

/* ── Quick Action tile ─────────────────────────────────────── */
function ActionTile({ icon, label, desc, color, bg, border, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11, padding: "11px 13px",
        borderRadius: 12, border: `1.5px solid ${hov ? color : border}`,
        background: hov ? bg : "#fafafa", cursor: "pointer",
        transform: hov ? "translateX(3px)" : "none",
        transition: "all .16s",
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon d={icon} color={color} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{label}</div>
        <div style={{ fontSize: 11, color: C.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{desc}</div>
      </div>
      <Icon d="M8.25 4.5l7.5 7.5-7.5 7.5" color="rgba(15,18,42,.2)" size={12} w={2.5} />
    </div>
  );
}

/* ── Pill Tabs ─────────────────────────────────────────────── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "3px", background: "rgba(15,18,42,.05)", borderRadius: 10, width: "fit-content" }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, fontFamily: "'DM Mono',monospace",
          background: active === t.key ? "#fff" : "transparent",
          color: active === t.key ? C.purple : C.inkSoft,
          boxShadow: active === t.key ? "0 1px 6px rgba(15,18,42,.1)" : "none",
          transition: "all .16s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

/* ── Inline Bar ────────────────────────────────────────────── */
function InlineBar({ pct, color }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: "rgba(15,18,42,.07)", width: "100%", marginTop: 4 }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 99, background: color, transition: "width .5s ease" }} />
    </div>
  );
}

/* ── Log row ───────────────────────────────────────────────── */
function LogRow({ dot, text, time }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 0", borderBottom: `1px solid ${C.inkFaint}` }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 5 }} />
      <div style={{ fontSize: 12.5, color: "rgba(15,18,42,.68)", flex: 1, lineHeight: 1.55 }}>{text}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: "rgba(15,18,42,.28)", whiteSpace: "nowrap", flexShrink: 0 }}>{time}</div>
    </div>
  );
}

/* ── Alert row ─────────────────────────────────────────────── */
function AlertRow({ name, stock, category, branch, critical }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.inkFaint}` }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: critical ? C.red : C.amber, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ fontSize: 10.5, color: C.inkSoft, marginTop: 1 }}>{category} · {branch}</div>
      </div>
      <Badge color={critical ? C.red : C.amber} bg={critical ? C.redL : C.amberL} border={critical ? C.redB : C.amberB}>
        {critical ? "OUT" : `${stock} left`}
      </Badge>
    </div>
  );
}

/* ── Compact top bar button ────────────────────────────────── */
function TopBtn({ label, icon, onClick, primary }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "9px 18px", borderRadius: 11, border: primary ? "none" : `1.5px solid ${C.purpleB}`,
        cursor: "pointer",
        background: primary ? (hov ? "#5b21b6" : C.purple) : (hov ? C.purpleL : "transparent"),
        color: primary ? "#fff" : C.purple,
        fontSize: 12.5, fontWeight: 700, fontFamily: "'Figtree',sans-serif",
        display: "flex", alignItems: "center", gap: 6,
        transition: "all .16s",
      }}
    >
      {icon && <Icon d={icon} color={primary ? "#fff" : C.purple} size={13} w={2.5} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN DASHBOARD                                             */
/* ═══════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const now      = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get("/superadmin/dashboard");
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const k = data?.kpis || {};

  /* ── quick actions ── */
  const quickActions = [
    { icon: "M12 4.5v15m7.5-7.5h-15",                                    label: "Add New User",        desc: "Create admin, staff or cashier account", color: C.purple, bg: C.purpleL, border: C.purpleB, path: "/users/add"          },
    { icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622", label: "Add Product",         desc: "Add inventory item across any branch",   color: C.blue,   bg: C.blueL,   border: C.blueB,   path: "/products/add"        },
    { icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18",                          label: "Manage Orgs",         desc: "Create / edit company & branch setup",   color: C.green,  bg: C.greenL,  border: C.greenB,  path: "/organization"        },
    { icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21",  label: "Branch Assignment",   desc: "Assign admins and staff to branches",    color: C.amber,  bg: C.amberL,  border: C.amberB,  path: "/branch-assignment"   },
    { icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581", label: "Categories",  desc: "Manage product categories",  color: C.teal,   bg: C.tealL,   border: C.tealB,   path: "/categories"          },
    { icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593",                label: "System Settings",     desc: "Tax, invoice, currency & backup",        color: C.blue,   bg: C.blueL,   border: C.blueB,   path: "/settings/system"     },
    { icon: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63", label: "Service Management", desc: "All warranties & service requests", color: C.teal, bg: C.tealL, border: "rgba(15,118,110,.22)", path: "/service/management" },
  ];

  /* ── role color map ── */
  const roleColor = { SUPER_ADMIN: [C.purple, C.purpleB], ADMIN: [C.blue, C.blueB], STAFF: [C.green, C.greenB], CUSTOMER: [C.amber, C.amberB] };

  /* ── real 7-day stock value sparkline from backend ── */
  const sparkline = k.stockValueTrend && k.stockValueTrend.length === 7 ? k.stockValueTrend : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800;900&family=DM+Mono:wght@400;500;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.42; } }
        @keyframes blink  { 0%,100% { opacity:1; } 50% { opacity:.3; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ animation: "fadeUp .35s ease both", fontFamily: "'Figtree',sans-serif" }}>

        {/* ════════════════════════════════════ HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            {/* live badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "blink 2.5s infinite" }} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.purple, letterSpacing: ".22em", textTransform: "uppercase" }}>Super Admin Console · Live</span>
            </div>
            <h1 style={{ fontFamily: "'Figtree',sans-serif", fontSize: 28, fontWeight: 900, color: C.ink, letterSpacing: "-.05em", margin: 0, lineHeight: 1.1 }}>
              {greeting}, <em style={{ color: C.purple, fontStyle: "italic" }}>{user?.name?.split(" ")[0] || "Admin"}</em>
            </h1>
            <p style={{ fontSize: 13, color: C.inkSoft, margin: "5px 0 0" }}>
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <TopBtn label="Add User" icon="M12 4.5v15m7.5-7.5h-15" onClick={() => navigate("/users/add")} primary />
            <TopBtn label="System Monitor" onClick={() => navigate("/system-monitoring")} />
            <button onClick={load} title="Refresh" style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.purpleB}`, background: C.purpleL, color: C.purple, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" color={C.purple} size={15} />
            </button>
          </div>
        </div>

        {/* error */}
        {error && (
          <div style={{ background: C.redL, border: `1px solid ${C.redB}`, borderRadius: 12, padding: "12px 18px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: C.red, fontSize: 13, fontWeight: 600 }}>{error}</span>
            <button onClick={load} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.redB}`, background: "#fff", color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* ════════════════════════════════════ COMPANY SUMMARY BANNER */}
        <div style={{
          background: `linear-gradient(135deg, ${C.purple} 0%, #4f46e5 50%, #0369a1 100%)`,
          borderRadius: 18, padding: "22px 26px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          boxShadow: `0 8px 32px ${C.purpleG}`,
          animation: "fadeUp .35s ease .05s both",
        }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(255,255,255,.6)", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 6 }}>Company Overview</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-.04em", lineHeight: 1.1 }}>
              {loading ? "—" : `${k.totalOrganizations ?? 0} Organisation${(k.totalOrganizations ?? 0) !== 1 ? "s" : ""}`} ·{" "}
              {loading ? "—" : `${k.activeBranches ?? 0} Active Branch${(k.activeBranches ?? 0) !== 1 ? "es" : ""}`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 5 }}>
              {loading ? "Loading..." : `${k.totalUsers ?? 0} users · ${k.totalProducts ?? 0} products · ${k.activeSuppliers ?? 0} suppliers`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Stock Value", value: fmtRs(k.totalStockValue), icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5" },
              { label: "Active Users", value: fmtNum(k.activeUsers), icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
              { label: "Out of Stock", value: fmtNum(k.outOfStockCount), icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,.12)", borderRadius: 12, padding: "11px 16px", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.15)", textAlign: "center", minWidth: 100 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
                  <Icon d={stat.icon} color="rgba(255,255,255,.75)" size={14} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-.04em", lineHeight: 1 }}>
                  {loading ? "—" : stat.value}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: ".14em", marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════ KPI STRIP */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
          <MetricCard loading={loading} delay=".0s"
            icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
            label="Total Users" value={fmtNum(k.totalUsers)} sub={`${k.activeUsers ?? "—"} active`}
            badge={k.newUsersThisMonth > 0 ? `${k.newUsersThisMonth} new` : null} badgeUp
            color={C.purple} bg={C.purpleL} border={C.purpleB} onClick={() => navigate("/users")}
          />
          <MetricCard loading={loading} delay=".06s"
            icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5"
            label="Products" value={fmtNum(k.totalProducts)} sub={k.outOfStockCount > 0 ? `${k.outOfStockCount} out of stock` : "All stocked"}
            badge={k.newProductsMonth > 0 ? `${k.newProductsMonth} new` : null} badgeUp
            color={C.blue} bg={C.blueL} border={C.blueB} onClick={() => navigate("/products")}
          />
          <MetricCard loading={loading} delay=".12s"
            icon="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3m4.125-7.5H3"
            label="Suppliers" value={fmtNum(k.activeSuppliers)} sub={`${k.totalSuppliers ?? "—"} total`}
            badge={k.newSuppliersMonth > 0 ? `${k.newSuppliersMonth} new` : null} badgeUp
            color={C.green} bg={C.greenL} border={C.greenB} onClick={() => navigate("/suppliers")}
          />
          <MetricCard loading={loading} delay=".18s"
            icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18"
            label="Branches" value={fmtNum(k.activeBranches)} sub={`${k.totalOrganizations ?? "—"} orgs · ${k.totalBranches ?? "—"} total`}
            color={C.amber} bg={C.amberL} border={C.amberB} onClick={() => navigate("/organization")}
          />
          <MetricCard loading={loading} delay=".24s"
            icon="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581"
            label="Categories" value={fmtNum(k.totalCategories)}
            color={C.teal} bg={C.tealL} border={C.tealB} onClick={() => navigate("/categories")}
          />
          <MetricCard loading={loading} delay=".30s"
            icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5"
            label="Stock Value" value={fmtRs(k.totalStockValue)}
            sub={k.lowStockCount > 0 ? `${k.lowStockCount} low-stock alerts` : "Stock healthy"}
            badge={k.lowStockCount > 0 ? `${k.lowStockCount} alerts` : null} badgeUp={false}
            color={k.lowStockCount > 0 ? C.amber : C.green}
            bg={k.lowStockCount > 0 ? C.amberL : C.greenL}
            border={k.lowStockCount > 0 ? C.amberB : C.greenB}
            trend={sparkline}
          />
        </div>

        {/* ════════════════════════════════════ TAB NAVIGATION */}
        <div style={{ marginBottom: 16 }}>
          <TabBar
            tabs={[
              { key: "overview",  label: "Overview"      },
              { key: "branches",  label: "Branches"      },
              { key: "alerts",    label: `Alerts${k.lowStockCount > 0 || k.outOfStockCount > 0 ? ` (${(k.lowStockCount||0)+(k.outOfStockCount||0)})` : ""}` },
              { key: "activity",  label: "Activity"      },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* ════════════════════════════════════ TAB: OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>

            {/* Quick Actions */}
            <Card title="Quick Actions" icon="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75" iconColor={C.purple}
              right={
                <button onClick={() => navigate("/system-monitoring")} style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${C.purpleB}`, background: C.purpleL, color: C.purple, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  Monitor →
                </button>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {quickActions.map(a => <ActionTile key={a.label} {...a} onClick={() => navigate(a.path)} />)}
              </div>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Users by Role */}
              <Card title="Users by Role" icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" iconColor={C.blue}>
                {loading
                  ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[...Array(3)].map((_, i) => <Sk key={i} h={38} />)}</div>
                  : Object.entries(data?.roleBreakdown || {}).map(([role, count]) => {
                      const total = k.totalUsers || 1;
                      const pct   = Math.round((count / total) * 100);
                      const [clr] = roleColor[role] || [C.purple];
                      return (
                        <div key={role} style={{ marginBottom: 13 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{role.replace(/_/g, " ")}</span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, color: clr }}>{count} ({pct}%)</span>
                          </div>
                          <InlineBar pct={pct} color={clr} />
                        </div>
                      );
                    })
                }
              </Card>

              {/* Stock Health */}
              <Card title="Stock Health" icon="M9 12l2.25 2.25 4.5-4.5m5.25.75a9 9 0 11-18 0 9 9 0 0118 0z" iconColor={C.green}>
                {loading
                  ? <Sk h={90} />
                  : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "In Stock",    value: (k.totalProducts || 0) - (k.outOfStockCount || 0) - (k.lowStockCount || 0), color: C.green,  bg: C.greenL },
                        { label: "Low Stock",   value: k.lowStockCount || 0,                                                         color: C.amber,  bg: C.amberL },
                        { label: "Out of Stock",value: k.outOfStockCount || 0,                                                       color: C.red,    bg: C.redL   },
                        { label: "Total Items", value: k.totalProducts || 0,                                                         color: C.blue,   bg: C.blueL  },
                      ].map(item => (
                        <div key={item.label} style={{ borderRadius: 12, background: item.bg, border: `1px solid ${item.color}33`, padding: "12px 14px" }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: item.color, letterSpacing: "-.04em" }}>{item.value}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: item.color, textTransform: "uppercase", letterSpacing: ".12em", marginTop: 4 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </Card>

              {/* New this month */}
              <Card title="Added This Month" icon="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" iconColor={C.teal}>
                {loading
                  ? <Sk h={60} />
                  : (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[
                        { label: "New Users",    value: k.newUsersThisMonth ?? 0,    color: C.purple },
                        { label: "New Products", value: k.newProductsMonth ?? 0,     color: C.blue   },
                        { label: "New Suppliers",value: k.newSuppliersMonth ?? 0,    color: C.green  },
                      ].map(item => (
                        <div key={item.label} style={{ flex: "1 1 80px", borderRadius: 11, border: `1.5px solid ${item.color}33`, padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: item.color, letterSpacing: "-.04em" }}>{item.value}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: C.inkSoft, textTransform: "uppercase", letterSpacing: ".1em", marginTop: 3 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════ TAB: BRANCHES */}
        {activeTab === "branches" && (
          <Card title="Branch Health Overview" icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18" iconColor={C.amber}
            right={
              <button onClick={() => navigate("/organization")} style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${C.amberB}`, background: C.amberL, color: C.amber, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                Manage Orgs →
              </button>
            }
            noPad
          >
            {loading
              ? <div style={{ padding: "20px" }}><Sk h={160} /></div>
              : (data?.branchHealth?.length > 0
                  ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(15,18,42,.02)" }}>
                            {["Branch", "Organisation", "Admin", "Status", "Products", "Users", "Stock Val.", "Alerts"].map(h => (
                              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: C.inkSoft, letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.branchHealth.map(b => (
                            <tr key={b.id} onClick={() => navigate("/branch-assignment")} style={{ cursor: "pointer" }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.purpleL; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontSize: 13, fontWeight: 700, color: C.ink }}>{b.name}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontSize: 12, color: C.inkSoft }}>{b.org}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontSize: 12, color: C.ink }}>{b.admin}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}` }}><StatusDot active={b.status === "ACTIVE"} /></td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 700, color: C.blue }}>{b.products}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.ink }}>{b.users ?? "—"}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}`, fontFamily: "'DM Mono',monospace", fontSize: 11.5, fontWeight: 700, color: C.green }}>{fmtRs(b.stockValue)}</td>
                              <td style={{ padding: "11px 14px", borderTop: `1px solid ${C.inkFaint}` }}>
                                {b.outOfStock > 0 && <Badge color={C.red}   bg={C.redL}   border={C.redB}  >{b.outOfStock} OOS</Badge>}
                                {b.lowStock > 0   && <span style={{ marginLeft: 4 }}><Badge color={C.amber} bg={C.amberL} border={C.amberB}>{b.lowStock} low</Badge></span>}
                                {b.outOfStock === 0 && b.lowStock === 0 && <Badge color={C.green} bg={C.greenL} border={C.greenB}>OK</Badge>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "32px", textAlign: "center", color: C.inkSoft, fontSize: 13 }}>
                      No branches yet.{" "}
                      <span onClick={() => navigate("/organization")} style={{ color: C.purple, cursor: "pointer", fontWeight: 700 }}>Create one →</span>
                    </div>
                  )
              )
            }
          </Card>
        )}

        {/* ════════════════════════════════════ TAB: ALERTS */}
        {activeTab === "alerts" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            <Card title="Inventory Alerts" icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" iconColor={C.red}
              right={<button onClick={() => navigate("/system-monitoring")} style={{ padding: "4px 12px", borderRadius: 8, border: `1.5px solid ${C.redB}`, background: C.redL, color: C.red, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>View All →</button>}
            >
              {loading
                ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[...Array(4)].map((_, i) => <Sk key={i} h={46} />)}</div>
                : (data?.inventoryAlerts?.length > 0
                    ? data.inventoryAlerts.map((a, i) => <AlertRow key={i} {...a} />)
                    : (
                      <div style={{ textAlign: "center", padding: "28px 0" }}>
                        <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color={C.green} size={28} />
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: C.green }}>All products adequately stocked</div>
                      </div>
                    )
                )
              }
            </Card>

            <Card title="Alert Summary" icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" iconColor={C.amber}>
              {loading
                ? <Sk h={120} />
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Out of Stock",  value: k.outOfStockCount || 0,  color: C.red,   bg: C.redL,   desc: "Requires immediate restock"  },
                      { label: "Low Stock (≤10)",value: k.lowStockCount || 0,   color: C.amber, bg: C.amberL, desc: "Order soon to avoid stockout" },
                    ].map(item => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: item.bg, border: `1px solid ${item.color}33` }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: item.color, letterSpacing: "-.05em", lineHeight: 1, minWidth: 48 }}>{item.value}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{item.label}</div>
                          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ borderTop: `1px solid ${C.inkFaint}`, marginTop: 4, paddingTop: 12 }}>
                      <button onClick={() => navigate("/inventory/stock")} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1.5px solid ${C.purpleB}`, background: C.purpleL, color: C.purple, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Manage Stock →
                      </button>
                    </div>
                  </div>
                )
              }
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════ TAB: ACTIVITY */}
        {activeTab === "activity" && (
          <Card title="Recent Activity" icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" iconColor={C.green}
            right={<Badge color={C.green} bg={C.greenL} border={C.greenB}>LIVE</Badge>}
          >
            {loading
              ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[...Array(6)].map((_, i) => <Sk key={i} h={13} />)}</div>
              : (data?.activityFeed?.length > 0
                  ? data.activityFeed.map((l, i) => <LogRow key={i} {...l} />)
                  : <div style={{ textAlign: "center", color: C.inkSoft, fontSize: 13, padding: "20px 0" }}>No recent activity found.</div>
                )
            }
          </Card>
        )}

      </div>
    </>
  );
}
