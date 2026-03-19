import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";

const REPORTS = [
  {
    title: "Stock Report",
    subtitle: "Full inventory levels, stock valuation and status",
    path: "/reports/stock",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3M9 11.25v1.5M12 9v3.75m3-6.75v6.75",
    accent: "#0284c7",
    light: "rgba(2,132,199,.08)",
    border: "rgba(2,132,199,.2)",
    badge: "Inventory",
  },
  {
    title: "Low Stock Report",
    subtitle: "Products below threshold — act before running out",
    path: "/reports/low-stock",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    accent: "#b45309",
    light: "rgba(180,83,9,.08)",
    border: "rgba(180,83,9,.2)",
    badge: "Alerts",
  },
  {
    title: "Purchase Report",
    subtitle: "Purchase orders, supplier spend and payment status",
    path: "/reports/purchase",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
    accent: "#7c3aed",
    light: "rgba(124,58,237,.08)",
    border: "rgba(124,58,237,.2)",
    badge: "Procurement",
  },
  {
    title: "Sales Report",
    subtitle: "Revenue, invoices, top products and payment methods",
    path: "/reports/sales",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    accent: "#059669",
    light: "rgba(5,150,105,.08)",
    border: "rgba(5,150,105,.2)",
    badge: "Revenue",
  },
  {
    title: "Profit Report",
    subtitle: "Gross & net profit, margins and category breakdown",
    path: "/reports/profit-loss",
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    accent: "#dc2626",
    light: "rgba(239,68,68,.08)",
    border: "rgba(239,68,68,.2)",
    badge: "Financials",
  },
];

export default function Reports() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Reports"
      subtitle="Business intelligence — stock, purchasing, sales and profitability"
    >
      {/* Hero summary bar */}
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
            Reports Centre
          </div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,.45)", fontFamily: "'DM Mono',monospace", letterSpacing: ".04em" }}>
            5 REPORT TYPES · REAL-TIME DATA · EXCEL EXPORT
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {[["Stock","📦"],["Low Stock","⚠️"],["Purchase","🛒"],["Sales","📈"],["Profit","💰"]].map(([label, icon]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", color: "rgba(255,255,255,.4)", letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Report cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(300px, 100%), 1fr))", gap: "16px" }}>
        {REPORTS.map((r) => (
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
            {/* Background decoration */}
            <div style={{
              position: "absolute", top: "-20px", right: "-20px",
              width: "100px", height: "100px", borderRadius: "50%",
              background: r.light, opacity: 0.5,
            }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", position: "relative" }}>
              {/* Icon */}
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
                  }}>{r.badge}</span>
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(26,26,46,.48)", lineHeight: 1.5 }}>
                  {r.subtitle}
                </div>
              </div>
            </div>

            {/* Footer arrow */}
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
