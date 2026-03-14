import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const P   = "#059669";
const PL  = "rgba(5,150,105,.08)";
const PB  = "rgba(5,150,105,.2)";
const B   = "#0284c7";
const BL  = "rgba(2,132,199,.08)";
const BB  = "rgba(2,132,199,.2)";
const V   = "#7c3aed";
const VL  = "rgba(124,58,237,.08)";
const VB  = "rgba(124,58,237,.2)";
const RD  = "#dc2626";
const RDL = "rgba(239,68,68,.08)";
const RDB = "rgba(239,68,68,.2)";

function fmt(n)  { return (n || 0).toLocaleString("en-IN"); }
function fmtK(n) { return n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : fmt(n); }

function KpiCard({ label, value, sub, change, changeUp, color, border }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: `1px solid ${border}`, padding: "20px 22px", boxShadow: "0 2px 10px rgba(26,26,46,.04)" }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: "26px", fontWeight: 900, color, letterSpacing: "-.03em", marginBottom: "4px" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.45)", fontFamily: "'DM Mono',monospace", marginBottom: "6px" }}>{sub}</div>}
      {change && (
        <span style={{ fontSize: "11px", fontWeight: 700, color: changeUp ? P : RD, background: changeUp ? PL : RDL, padding: "2px 8px", borderRadius: "99px", fontFamily: "'DM Mono',monospace" }}>
          {changeUp ? "↑" : "↓"} {change}
        </span>
      )}
    </div>
  );
}

export default function ProfitLossReport() {
  const navigate = useNavigate();
  const [period, setPeriod]   = useState("month");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axiosInstance.get("/reports/profit-loss", { params: { period } })
      .then(r => setData(r.data))
      .catch(e => {
        setData(null);
        setError(e?.response?.data?.message || "Failed to load profit data.");
      })
      .finally(() => setLoading(false));
  }, [period]);

  const kpis        = data?.kpis        || {};
  const monthlyData = data?.monthlyData || [];
  const categories  = data?.categories  || [];
  const maxRevenue  = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.revenue), 1) : 1;
  const grossMarginPct = kpis.grossMargin || "0.0";
  const netMarginPct   = kpis.netMargin   || "0.0";

  return (
    <PageShell title="Profit Report" subtitle="Gross and net profit, margins and category breakdown">

      <button onClick={() => navigate("/reports")}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", padding: 0, letterSpacing: ".06em" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        BACK TO REPORTS
      </button>

      {/* Period + Export */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", borderRadius: "9px", overflow: "hidden", border: "1px solid rgba(26,26,46,.12)" }}>
          {[["today","Today"],["week","7 Days"],["month","This Month"],["quarter","Quarter"],["year","This Year"]].map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{ padding: "7px 14px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: period === k ? `linear-gradient(135deg,${V},#6d28d9)` : "#fff", color: period === k ? "#fff" : "rgba(26,26,46,.48)", transition: "all .15s" }}>{label}</button>
          ))}
        </div>
        <ExcelExport
          data={monthlyData}
          filename="profit_report"
          sheetName="Profit and Loss"
          accent={{ color: V, light: VL, border: VB }}
          columns={[
            { key: "month",   label: "Month" },
            { key: "revenue", label: "Revenue (Rs)" },
            { key: "cost",    label: "Cost of Goods (Rs)" },
            { key: "gross",   label: "Gross Profit (Rs)" },
            { key: "net",     label: "Net Profit (Rs)" },
          ]}
        />
      </div>

      {loading ? (
        <div style={{ padding: "80px", textAlign: "center", color: "rgba(26,26,46,.3)", fontSize: "13px" }}>Loading profit data…</div>
      ) : error ? (
        <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(239,68,68,.25)", padding: "40px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚠️</div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#dc2626", marginBottom: "8px" }}>Unable to load report</div>
          <div style={{ fontSize: "13px", color: "rgba(26,26,46,.5)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>{error}</div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px", marginBottom: "22px" }}>
            <KpiCard label="Total Revenue"  value={`₹${fmtK(kpis.revenue)}`} sub={`₹${fmt(kpis.revenue)}`}  color={B}  border={BB}  changeUp={true}  change={`${grossMarginPct}% margin`} />
            <KpiCard label="Cost of Goods"  value={`₹${fmtK(kpis.cost)}`}    sub={`₹${fmt(kpis.cost)}`}     color={RD} border={RDB} />
            <KpiCard label="Gross Profit"   value={`₹${fmtK(kpis.gross)}`}   sub={`₹${fmt(kpis.gross)}`}    color={P}  border={PB}  changeUp={kpis.gross >= 0}  change={`${grossMarginPct}% gross`} />
            <KpiCard label="Net Profit"     value={`₹${fmtK(kpis.gross)}`}   sub={`₹${fmt(kpis.gross)}`}    color={V}  border={VB}  changeUp={kpis.gross >= 0}  change={`${netMarginPct}% net`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "16px", marginBottom: "18px" }}>

            {/* Bar chart */}
            {monthlyData.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", padding: "22px", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e", marginBottom: "12px" }}>Monthly Trend (6 Months)</div>
                <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {[[B, "Revenue"], [P, "Gross Profit"], [V, "Net Profit"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(26,26,46,.55)", fontFamily: "'DM Mono',monospace" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />{l}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", height: "140px" }}>
                  {monthlyData.map((m, idx) => (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{ width: "100%", display: "flex", gap: "2px", alignItems: "flex-end", height: "120px" }}>
                        {[[m.revenue, B], [m.gross, P], [m.net || m.gross, V]].map(([val, color], j) => {
                          const h = maxRevenue > 0 ? Math.max(2, Math.round((Math.max(0, val) / maxRevenue) * 110)) : 2;
                          return <div key={j} style={{ flex: 1, height: `${h}px`, borderRadius: "4px 4px 0 0", background: color, opacity: 0.85 }} />;
                        })}
                      </div>
                      <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", textAlign: "center" }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* P&L summary */}
            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", padding: "22px", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e", marginBottom: "18px" }}>
                {period === "today" ? "Today's" : period === "week" ? "7-Day" : period === "month" ? "Monthly" : period === "quarter" ? "Quarterly" : "Annual"} P&L Summary
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Gross Revenue",           val: `₹${fmt(kpis.revenue)}`,     color: "#1a1a2e",          type: "normal" },
                  { label: "(-) Cost of Goods Sold",  val: `−₹${fmt(kpis.cost)}`,       color: RD,                 type: "normal" },
                  { label: "= Gross Profit",           val: `₹${fmt(kpis.gross)}`,       color: P,                  type: "divider" },
                  { label: "(-) Operating Expenses",   val: "—",                          color: "rgba(26,26,46,.4)", type: "normal" },
                  { label: "= Net Profit",              val: `₹${fmt(kpis.gross)}`,       color: V,                  type: "total" },
                ].map(row => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: row.type === "total" ? "14px 0 0" : "10px 0",
                    borderTop: row.type === "divider" || row.type === "total" ? "2px solid rgba(26,26,46,.08)" : "none",
                    marginTop: row.type === "divider" ? "4px" : 0,
                  }}>
                    <span style={{ fontSize: "13px", color: row.type === "total" ? "#1a1a2e" : "rgba(26,26,46,.6)", fontWeight: row.type === "total" ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: row.type === "total" ? "16px" : "13px", fontWeight: row.type === "total" ? 900 : 600, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "18px", padding: "14px", borderRadius: "12px", background: VL, border: `1px solid ${VB}` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "6px" }}>Gross Margin</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "28px", fontWeight: 900, color: V }}>{grossMarginPct}%</div>
                  <div style={{ fontSize: "12px", color: "rgba(26,26,46,.5)" }}>retained as profit</div>
                </div>
                <div style={{ marginTop: "10px", height: "6px", borderRadius: "99px", background: "rgba(26,26,46,.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, Number(grossMarginPct)))}%`, background: V, borderRadius: "99px" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Category table */}
          {categories.length > 0 && (
            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Profit by Category</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".12em", textTransform: "uppercase" }}>{categories.length} categories</div>
              </div>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(26,26,46,.03)" }}>
                      {["Category", "Revenue", "Cost", "Gross Profit", "Margin %", "Bar"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".13em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, i) => {
                      const gross  = c.revenue - c.cost;
                      const colors = [B, P, V, "#b45309", "#475569", RD, "#0891b2"];
                      const color  = colors[i % colors.length];
                      return (
                        <tr key={c.name} style={{ borderTop: "1px solid rgba(26,26,46,.05)" }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.018)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <td style={{ padding: "13px 16px", fontSize: "13.5px", fontWeight: 600, color: "#1a1a2e" }}>{c.name}</td>
                          <td style={{ padding: "13px 16px", fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "rgba(26,26,46,.7)" }}>₹{fmt(c.revenue)}</td>
                          <td style={{ padding: "13px 16px", fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "rgba(26,26,46,.5)" }}>₹{fmt(c.cost)}</td>
                          <td style={{ padding: "13px 16px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: gross >= 0 ? P : RD }}>{gross >= 0 ? "+" : ""}₹{fmt(gross)}</td>
                          <td style={{ padding: "13px 16px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 800, color }}>{c.margin}%</td>
                          <td style={{ padding: "13px 16px", width: "180px" }}>
                            <div style={{ height: "8px", borderRadius: "99px", background: "rgba(26,26,46,.07)" }}>
                              <div style={{ width: `${Math.min(100, Math.max(0, Number(c.margin)))}%`, height: "100%", borderRadius: "99px", background: color }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid rgba(26,26,46,.08)", background: "rgba(26,26,46,.02)" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>Total</td>
                      <td style={{ padding: "12px 16px", fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 900, color: "#1a1a2e" }}>₹{fmt(categories.reduce((s, c) => s + c.revenue, 0))}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 900, color: RD }}>₹{fmt(categories.reduce((s, c) => s + c.cost, 0))}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 900, color: P }}>₹{fmt(categories.reduce((s, c) => s + (c.revenue - c.cost), 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {!loading && kpis.revenue === 0 && (
            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", padding: "70px", textAlign: "center", marginTop: "18px" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>💰</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "rgba(26,26,46,.45)", marginBottom: "6px" }}>No sales data for this period</div>
              <div style={{ fontSize: "12px", color: "rgba(26,26,46,.3)" }}>Create invoices in Sales Desk to see profit analytics here</div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
