import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const V   = "#7c3aed";
const VL  = "rgba(124,58,237,.08)";
const VB  = "rgba(124,58,237,.2)";
const P   = "#059669";
const PL  = "rgba(5,150,105,.08)";
const PB  = "rgba(5,150,105,.2)";
const AM  = "#b45309";
const AML = "rgba(180,83,9,.08)";
const AMB = "rgba(180,83,9,.2)";
const RD  = "#dc2626";
const RDL = "rgba(239,68,68,.08)";
const RDB = "rgba(239,68,68,.2)";
const B   = "#0284c7";
const BL  = "rgba(2,132,199,.08)";
const BB  = "rgba(2,132,199,.2)";

const STATUS_STYLE = {
  PENDING:   { color: AM, bg: AML, border: AMB },
  APPROVED:  { color: B,  bg: BL,  border: BB  },
  RECEIVED:  { color: P,  bg: PL,  border: PB  },
  CANCELLED: { color: RD, bg: RDL, border: RDB },
  PARTIAL:   { color: V,  bg: VL,  border: VB  },
};

function fmt(n)  { return (n || 0).toLocaleString("en-IN"); }
function fmtK(n) { return n >= 100000 ? (n / 100000).toFixed(1) + "L" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : fmt(n); }

function KpiCard({ label, value, sub, color, bg, border }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: `1px solid ${border}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(26,26,46,.04)" }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: "24px", fontWeight: 900, color, letterSpacing: "-.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color, fontFamily: "'DM Mono',monospace", marginTop: "2px", opacity: .75 }}>{sub}</div>}
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

export default function PurchaseReport() {
  const navigate = useNavigate();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const [period, setPeriod]     = useState("month");
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo]     = useState(todayStr);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    const params = { period };
    if (period === "custom") { params.from = dateFrom; params.to = dateTo; }
    axiosInstance.get("/reports/purchase", { params })
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [period]);

  const orders = data?.orders || [];
  const kpis   = data?.kpis   || {};

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") list = list.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.supplier?.supplierName || "").toLowerCase().includes(q) ||
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.status || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  // Supplier breakdown from filtered orders
  const supplierBreakdown = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const name = o.supplier?.supplierName || "Unknown Supplier";
      if (!map[name]) map[name] = { name, orders: 0, value: 0, paid: 0 };
      map[name].orders += 1;
      map[name].value  += o.totalAmount || 0;
      map[name].paid   += o.paidAmount  || 0;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [orders]);

  const maxSupplierVal = supplierBreakdown[0]?.value || 1;

  const thS = { padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase" };
  const selS = { padding: "7px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.13)", outline: "none", fontSize: "12px", background: "#fff", cursor: "pointer" };

  return (
    <PageShell title="Purchase Report" subtitle="Purchase orders, supplier spend and payment status">

      {/* Back */}
      <button
        onClick={() => navigate("/reports")}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", padding: 0, letterSpacing: ".06em" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        BACK TO REPORTS
      </button>

      {/* Period picker */}
      <div style={{ background: "#fff", borderRadius: "13px", padding: "12px 16px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "18px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", borderRadius: "9px", overflow: "hidden", border: "1px solid rgba(26,26,46,.12)" }}>
          {[["today", "Today"], ["week", "7 Days"], ["month", "This Month"], ["quarter", "Quarter"], ["year", "This Year"], ["custom", "Custom"]].map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)} style={{ padding: "7px 13px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: period === k ? `linear-gradient(135deg,${V},#6d28d9)` : "#fff", color: period === k ? "#fff" : "rgba(26,26,46,.48)", transition: "all .15s" }}>{label}</button>
          ))}
        </div>
        {period === "custom" && <>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={selS} />
          <span style={{ color: "rgba(26,26,46,.3)" }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={selS} />
          <button onClick={load} style={{ ...selS, background: `linear-gradient(135deg,${V},#6d28d9)`, color: "#fff", border: "none", fontWeight: 700 }}>Apply</button>
        </>}

        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...selS, marginLeft: "8px" }}>
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="RECEIVED">Received</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        {/* Search */}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search supplier, order…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...selS, paddingLeft: "32px", width: "200px" }} />
        </div>

        <ExcelExport
          data={filtered.map(o => ({
            order: o.orderNumber || o._id?.slice(-8),
            supplier: o.supplier?.supplierName || "—",
            date: new Date(o.createdAt).toLocaleDateString("en-IN"),
            items: (o.items || []).length,
            totalAmount: o.totalAmount || 0,
            paidAmount: o.paidAmount || 0,
            pendingAmount: (o.totalAmount || 0) - (o.paidAmount || 0),
            status: o.status,
          }))}
          filename={`purchase_report_${period}`}
          sheetName="Purchase Report"
          accent={{ color: V, light: VL, border: VB }}
          columns={[
            { key: "order",         label: "Order #" },
            { key: "supplier",      label: "Supplier" },
            { key: "date",          label: "Date" },
            { key: "items",         label: "Items" },
            { key: "totalAmount",   label: "Total Amount (₹)" },
            { key: "paidAmount",    label: "Paid (₹)" },
            { key: "pendingAmount", label: "Pending (₹)" },
            { key: "status",        label: "Status" },
          ]}
        />
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px", marginBottom: "18px" }}>
        <KpiCard label="Total Orders"   value={fmt(kpis.totalOrders)}          color={V}  bg={VL}  border={VB} />
        <KpiCard label="Total PO Value" value={`₹${fmtK(kpis.totalValue)}`}    sub={`₹${fmt(kpis.totalValue)}`} color={B}  bg={BL}  border={BB} />
        <KpiCard label="Total Paid"     value={`₹${fmtK(kpis.totalPaid)}`}     sub={`₹${fmt(kpis.totalPaid)}`}  color={P}  bg={PL}  border={PB} />
        <KpiCard label="Pending Payment" value={`₹${fmtK(kpis.totalPending)}`} sub={`₹${fmt(kpis.totalPending)}`} color={AM} bg={AML} border={AMB} />
      </div>

      {/* Supplier breakdown chart */}
      {!loading && supplierBreakdown.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid rgba(26,26,46,.08)", padding: "20px", marginBottom: "18px", boxShadow: "0 2px 10px rgba(26,26,46,.04)" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "16px" }}>Top Suppliers by Purchase Value</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {supplierBreakdown.map((s, i) => {
              const pct = Math.round((s.value / maxSupplierVal) * 100);
              const paidPct = s.value > 0 ? Math.round((s.paid / s.value) * 100) : 0;
              const colors = [V, B, P, AM, "#475569", RD];
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.3)", width: "16px" }}>{i + 1}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{s.name}</span>
                      <span style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{s.orders} orders</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "11px", color: P, fontFamily: "'DM Mono',monospace" }}>Paid: {paidPct}%</span>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 700, color: colors[i] }}>₹{fmtK(s.value)}</span>
                    </div>
                  </div>
                  <div style={{ height: "6px", borderRadius: "99px", background: "rgba(26,26,46,.07)", overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[i], borderRadius: "99px", opacity: .85 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${Math.round(pct * paidPct / 100)}%`, background: P, borderRadius: "99px", opacity: .5 }} />
                  </div>
                  <div style={{ fontSize: "9px", color: "rgba(26,26,46,.3)", fontFamily: "'DM Mono',monospace", marginTop: "2px" }}>
                    Paid ₹{fmtK(s.paid)} · Pending ₹{fmtK(s.value - s.paid)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 14px rgba(26,26,46,.05)" }}>
        {loading ? (
          <div style={{ padding: "70px", textAlign: "center", color: "rgba(26,26,46,.3)", fontSize: "13px" }}>Loading purchase data…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
                  {["Order #", "Date", "Supplier", "Items", "Total Amount", "Paid", "Pending", "Status"].map(h => (
                    <th key={h} style={thS}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "70px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🛒</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,46,.4)" }}>No purchase orders for this period</div>
                  </td></tr>
                ) : filtered.map((o, i) => {
                  const st = STATUS_STYLE[o.status] || STATUS_STYLE.PENDING;
                  const pending = (o.totalAmount || 0) - (o.paidAmount || 0);
                  return (
                    <tr key={o._id}
                      style={{ borderBottom: "1px solid rgba(26,26,46,.042)", background: i % 2 === 0 ? "#fff" : "rgba(26,26,46,.01)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.018)"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "rgba(26,26,46,.01)"}
                    >
                      <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11.5px", fontWeight: 700, color: V }}>{o.orderNumber || o._id?.slice(-8)}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "rgba(26,26,46,.5)" }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td style={{ padding: "11px 14px", fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{o.supplier?.supplierName || "—"}</td>
                      <td style={{ padding: "11px 14px", fontSize: "12px", color: "rgba(26,26,46,.5)", fontFamily: "'DM Mono',monospace" }}>{(o.items || []).length}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "'Fraunces',serif", fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>₹{fmt(o.totalAmount)}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: P }}>₹{fmt(o.paidAmount)}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: pending > 0 ? AM : "rgba(26,26,46,.3)" }}>
                        {pending > 0 ? `₹${fmt(pending)}` : "—"}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ padding: "2px 9px", borderRadius: "99px", background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: "9.5px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                          {o.status || "PENDING"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: "2px solid rgba(26,26,46,.08)", background: "rgba(26,26,46,.02)" }}>
                    <td colSpan={4} style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>Total ({filtered.length} orders)</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 900, color: "#1a1a2e" }}>₹{fmt(filtered.reduce((s, o) => s + (o.totalAmount || 0), 0))}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 900, color: P }}>₹{fmt(filtered.reduce((s, o) => s + (o.paidAmount || 0), 0))}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 900, color: AM }}>₹{fmt(filtered.reduce((s, o) => s + Math.max(0, (o.totalAmount || 0) - (o.paidAmount || 0)), 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
