import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import useAuth from "../../hooks/useAuth";

const ALL_REPORTS = [
  {
    title: "Staff Performance",
    subtitle: "Attendance scores, hours logged, grade breakdown and monthly trends",
    path: "/staff/performance",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    accent: "#7c3aed",
    light: "rgba(124,58,237,.08)",
    border: "rgba(124,58,237,.2)",
    badge: "Performance",
    heroIcon: "📊",
    heroLabel: "Perf",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Billing Activity",
    subtitle: "Invoices raised per staff, total sales, average invoice value and top performers",
    path: "/staff/billing-activity",
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
    accent: "#0284c7",
    light: "rgba(2,132,199,.08)",
    border: "rgba(2,132,199,.2)",
    badge: "Billing",
    heroIcon: "🧾",
    heroLabel: "Billing",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Shift Schedule",
    subtitle: "Weekly shift assignments, upcoming rosters and shift completion status",
    path: "/staff/shifts",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12V12zm0 3h.008v.008H12v-.008zm0 3h.008v.008H12v-.008zm2.25-6h.008v.008H14.25V12zm0 3h.008v.008H14.25v-.008zm0 3h.008v.008H14.25v-.008zm2.25-6h.008v.008H16.5V12zm0 3h.008v.008H16.5v-.008z",
    accent: "#059669",
    light: "rgba(5,150,105,.08)",
    border: "rgba(5,150,105,.2)",
    badge: "Scheduling",
    heroIcon: "📅",
    heroLabel: "Shifts",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Attendance Report",
    subtitle: "Full daily attendance log, clock-in/out times, duration and status edits",
    path: "/attendance/report",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    accent: "#b45309",
    light: "rgba(180,83,9,.08)",
    border: "rgba(180,83,9,.2)",
    badge: "Attendance",
    heroIcon: "🗓️",
    heroLabel: "Attend",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "My Reports",
    subtitle: "View your own sales history, daily billing summary and personal performance",
    path: "/staff/my-reports",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    accent: "#059669",
    light: "rgba(5,150,105,.08)",
    border: "rgba(5,150,105,.2)",
    badge: "Limited",
    heroIcon: "📊",
    heroLabel: "Mine",
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    title: "My Attendance",
    subtitle: "Personal attendance history, monthly summary and self check-in / check-out",
    path: "/attendance/my",
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
    accent: "#dc2626",
    light: "rgba(239,68,68,.08)",
    border: "rgba(239,68,68,.2)",
    badge: "Personal",
    heroIcon: "👤",
    heroLabel: "Mine",
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    title: "Sales Desk",
    subtitle: "Your personal billing history, invoices you've raised and sales summary",
    path: "/sales/desk",
    icon: "M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.625-3.375 2.25-3.375-2.25-4.125 2.625V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    accent: "#059669",
    light: "rgba(5,150,105,.08)",
    border: "rgba(5,150,105,.2)",
    badge: "My Sales",
    heroIcon: "💰",
    heroLabel: "Sales",
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
  {
    title: "Inventory Reports",
    subtitle: "Stock levels, low stock alerts, GRN history and inventory movement logs",
    path: "/inventory/reports",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3M9 11.25v1.5M12 9v3.75m3-6.75v6.75",
    accent: "#0284c7",
    light: "rgba(2,132,199,.08)",
    border: "rgba(2,132,199,.2)",
    badge: "Inventory",
    heroIcon: "📦",
    heroLabel: "Stock",
    roles: ["SUPER_ADMIN", "ADMIN", "STAFF"],
  },
];

export default function StaffReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "STAFF";

  const reports = ALL_REPORTS.filter(r => r.roles.includes(role));
  const heroItems = reports.slice(0, 6);

  return (
    <PageShell
      title="Staff Reports"
      subtitle="Workforce intelligence — attendance, performance, billing and scheduling"
    >
      {/* ── Hero Banner ── */}
      <div style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 8px 32px rgba(26,26,46,.18)",
      }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", fontWeight: 900, color: "#fff", letterSpacing: "-.02em", marginBottom: "5px" }}>
            Staff Reports Centre
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,.45)", fontFamily: "'DM Mono',monospace", letterSpacing: ".04em" }}>
            {reports.length} REPORT TYPES · REAL-TIME DATA · EXCEL EXPORT
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {heroItems.map(r => (
            <div key={r.path} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => navigate(r.path)}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{r.heroIcon}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", color: "rgba(255,255,255,.4)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                {r.heroLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Report Cards Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px" }}>
        {reports.map((r) => (
          <div
            key={r.path}
            onClick={() => navigate(r.path)}
            style={{
              background: "#fff",
              borderRadius: "18px",
              border: `1.5px solid ${r.border}`,
              padding: "24px",
              cursor: "pointer",
              transition: "all .2s ease",
              boxShadow: "0 2px 12px rgba(26,26,46,.05)",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 12px 32px ${r.border}`;
              e.currentTarget.style.background = r.light;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,26,46,.05)";
              e.currentTarget.style.background = "#fff";
            }}
          >
            {/* Background decoration circle */}
            <div style={{
              position: "absolute", top: "-20px", right: "-20px",
              width: "100px", height: "100px", borderRadius: "50%",
              background: r.light, opacity: 0.5,
              pointerEvents: "none",
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative" }}>
              {/* Icon box */}
              <div style={{
                width: "46px", height: "46px", borderRadius: "13px",
                background: r.light, border: `1px solid ${r.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={r.accent} strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                  <path d={r.icon} />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <span style={{
                    fontFamily: "'Fraunces',serif", fontSize: "15px",
                    fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.01em",
                  }}>{r.title}</span>
                  <span style={{
                    padding: "2px 7px", borderRadius: "99px",
                    background: r.light, border: `1px solid ${r.border}`,
                    color: r.accent, fontSize: "9px",
                    fontFamily: "'DM Mono',monospace", fontWeight: 700,
                    letterSpacing: ".1em", textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}>{r.badge}</span>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(26,26,46,.48)", lineHeight: 1.5 }}>
                  {r.subtitle}
                </div>
              </div>
            </div>

            {/* Footer — OPEN REPORT → */}
            <div style={{
              marginTop: "18px", paddingTop: "14px",
              borderTop: `1px solid ${r.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: "10px",
                color: r.accent, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700,
              }}>Open Report</span>
              <svg viewBox="0 0 24 24" fill="none" stroke={r.accent} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
