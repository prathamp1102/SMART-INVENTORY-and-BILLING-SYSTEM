import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const AM  = "#b45309";
const AML = "rgba(180,83,9,.08)";
const AMB = "rgba(180,83,9,.2)";
const RD  = "#dc2626";
const RDL = "rgba(239,68,68,.08)";
const RDB = "rgba(239,68,68,.2)";
const BL  = "#0284c7";

function fmt(n) { return (n || 0).toLocaleString("en-IN"); }

function KpiCard({ label, value, sub, color, bg, border }) {
  return (
    <div style={{ background: "#fff", borderRadius: "14px", border: `1px solid ${border}`, padding: "18px 20px", boxShadow: "0 2px 10px rgba(26,26,46,.04)" }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: "26px", fontWeight: 900, color, letterSpacing: "-.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color, fontFamily: "'DM Mono',monospace", marginTop: "2px", opacity: .75 }}>{sub}</div>}
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: "6px" }}>{label}</div>
    </div>
  );
}

export default function LowStockReport() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [threshold, setThreshold] = useState(10);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState("stock_asc");
  const [filterMode, setFilterMode] = useState("both"); // "low" | "out" | "both"

  useEffect(() => {
    setLoading(true);
    axiosInstance.get("/products")
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const alerts = useMemo(() => {
    return products.filter(p => p.stock <= threshold);
  }, [products, threshold]);

  const filtered = useMemo(() => {
    let list = alerts;
    if (filterMode === "low") list = list.filter(p => p.stock > 0 && p.stock <= threshold);
    else if (filterMode === "out") list = list.filter(p => p.stock === 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "stock_asc")  list = [...list].sort((a, b) => a.stock - b.stock);
    if (sortBy === "stock_desc") list = [...list].sort((a, b) => b.stock - a.stock);
    if (sortBy === "name_asc")   list = [...list].sort((a, b) => (a.name||"").localeCompare(b.name||""));
    if (sortBy === "value_desc") list = [...list].sort((a, b) => (b.stock * b.costPrice) - (a.stock * a.costPrice));

    return list;
  }, [alerts, filterMode, search, sortBy]);

  const outCount  = alerts.filter(p => p.stock === 0).length;
  const lowCount  = alerts.filter(p => p.stock > 0 && p.stock <= threshold).length;
  const totalLostValue = alerts.reduce((s, p) => s + ((threshold - p.stock) * (p.costPrice || 0)), 0);
  const totalCurrentVal = alerts.reduce((s, p) => s + (p.stock * (p.costPrice || 0)), 0);

  const thS = { padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase" };

  return (
    <PageShell title="Low Stock Report" subtitle="Products below threshold — restocking priority and supplier action required">

      {/* Back to reports */}
      <button
        onClick={() => navigate("/reports")}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", padding: 0, letterSpacing: ".06em" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        BACK TO REPORTS
      </button>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(150px, 100%), 1fr))", gap: "12px", marginBottom: "20px" }}>
        <KpiCard label="Out of Stock"    value={outCount}              color={RD}  bg={RDL}  border={RDB} />
        <KpiCard label="Low Stock"       value={lowCount}              color={AM}  bg={AML}  border={AMB} />
        <KpiCard label="Total Alerts"    value={alerts.length}         color={BL}  bg="rgba(2,132,199,.08)" border="rgba(2,132,199,.2)" />
        <KpiCard label="Current Value"   value={`₹${fmt(totalCurrentVal)}`} sub="at cost price" color="#059669" bg="rgba(5,150,105,.08)" border="rgba(5,150,105,.2)" />
        <KpiCard label="Reorder Gap Est" value={`₹${fmt(totalLostValue)}`}  sub="to fill to threshold" color={AM} bg={AML} border={AMB} />
      </div>

      {/* Urgent banner */}
      {outCount > 0 && (
        <div style={{ background: RDL, border: `1.5px solid ${RDB}`, borderRadius: "13px", padding: "14px 18px", marginBottom: "18px", display: "flex", alignItems: "center", gap: "12px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={RD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: RD }}>{outCount} product{outCount > 1 ? "s" : ""} completely out of stock</span>
            <span style={{ fontSize: "12px", color: "rgba(26,26,46,.5)", marginLeft: "8px" }}>— immediate restocking required to prevent lost sales</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ background: "#fff", borderRadius: "13px", padding: "12px 16px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", borderRadius: "9px", overflow: "hidden", border: "1px solid rgba(26,26,46,.12)" }}>
          {[["both", "All Alerts"], ["out", "Out of Stock"], ["low", "Low Stock"]].map(([k, label]) => (
            <button key={k} onClick={() => setFilterMode(k)} style={{ padding: "7px 13px", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", background: filterMode === k ? `linear-gradient(135deg,${AM},#92400e)` : "#fff", color: filterMode === k ? "#fff" : "rgba(26,26,46,.48)", transition: "all .15s" }}>{label}</button>
          ))}
        </div>

        {/* Threshold */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.4)", letterSpacing: ".08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Threshold</label>
          <input
            type="number" min="1" max="200" value={threshold}
            onChange={e => setThreshold(Math.max(1, Number(e.target.value)))}
            style={{ width: "70px", padding: "7px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.13)", outline: "none", fontSize: "13px", fontFamily: "'DM Mono',monospace", textAlign: "center" }}
          />
          <span style={{ fontSize: "11px", color: "rgba(26,26,46,.35)" }}>units</span>
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.13)", outline: "none", fontSize: "12px", background: "#fff", cursor: "pointer" }}>
          <option value="stock_asc">Stock: Low → High</option>
          <option value="stock_desc">Stock: High → Low</option>
          <option value="name_asc">Name: A → Z</option>
          <option value="value_desc">Value: High → Low</option>
        </select>

        {/* Search */}
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ height: "38px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", outline: "none", paddingLeft: "32px", paddingRight: "12px", fontSize: "13px", background: "#fff", width: "200px" }} />
        </div>

        <ExcelExport
          data={filtered}
          filename="low_stock_report"
          sheetName="Low Stock"
          accent={{ color: AM, light: AML, border: AMB }}
          columns={[
            { key: "name", label: "Product Name" },
            { key: "category.name", label: "Category" },
            { key: "barcode", label: "Barcode" },
            { key: "stock", label: "Current Stock" },
            { key: "stock", label: "Stock Status", format: (v) => v === 0 ? "OUT OF STOCK" : "LOW STOCK" },
            { key: "costPrice", label: "Cost Price (₹)" },
            { key: "price", label: "Selling Price (₹)" },
            { key: "stock", label: "Current Value (₹)", format: (v, row) => ((v || 0) * (row.costPrice || 0)).toFixed(2) },
            { key: "branch.branchName", label: "Branch" },
          ]}
        />

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.35)", letterSpacing: ".1em" }}>
          {loading ? "Loading…" : `${filtered.length} products`}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 14px rgba(26,26,46,.05)" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
                {["Product", "Category", "Barcode", "Cost ₹", "Sell ₹", "Stock", "Stock Value", "Status", "Urgency"].map(h => (
                  <th key={h} style={thS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: "70px", textAlign: "center", color: "rgba(26,26,46,.3)", fontSize: "13px" }}>Loading inventory data…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "70px", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "rgba(26,26,46,.45)", marginBottom: "6px" }}>No low stock alerts</div>
                  <div style={{ fontSize: "12px", color: "rgba(26,26,46,.3)" }}>All products are above the threshold of {threshold} units</div>
                </td></tr>
              ) : filtered.map((p, i) => {
                const isOut  = p.stock === 0;
                const pct    = threshold > 0 ? Math.min(100, Math.round((p.stock / threshold) * 100)) : 0;
                const stockVal = (p.stock || 0) * (p.costPrice || 0);
                const urgency  = isOut ? "CRITICAL" : p.stock <= Math.ceil(threshold * 0.3) ? "HIGH" : "MEDIUM";
                const urgColor = urgency === "CRITICAL" ? RD : urgency === "HIGH" ? AM : "#b45309";
                const urgBg    = urgency === "CRITICAL" ? RDL : AML;
                const urgBorder = urgency === "CRITICAL" ? RDB : AMB;

                return (
                  <tr key={p._id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(26,26,46,.05)" : "none", background: isOut ? "rgba(239,68,68,.018)" : "rgba(180,83,9,.008)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = isOut ? "rgba(239,68,68,.018)" : "rgba(180,83,9,.008)"}
                  >
                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{p.name}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {p.category?.name
                        ? <span style={{ padding: "2px 8px", borderRadius: "99px", background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.18)", color: "#059669", fontSize: "10.5px", fontFamily: "'DM Mono',monospace" }}>{p.category.name}</span>
                        : <span style={{ color: "rgba(26,26,46,.25)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{p.barcode || "—"}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "rgba(26,26,46,.6)" }}>₹{fmt(p.costPrice)}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 700, color: "#1a1a2e" }}>₹{fmt(p.price)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontSize: "22px", fontWeight: 900, color: isOut ? RD : AM }}>{p.stock}</span>
                        <div style={{ width: "64px", height: "4px", borderRadius: "99px", background: "rgba(26,26,46,.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: isOut ? RD : AM, borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", color: "rgba(26,26,46,.3)" }}>{pct}% of threshold</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: "rgba(26,26,46,.6)" }}>₹{fmt(stockVal)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px",
                        borderRadius: "99px", background: isOut ? RDL : AML,
                        border: `1px solid ${isOut ? RDB : AMB}`,
                        color: isOut ? RD : AM, fontSize: "10.5px",
                        fontFamily: "'DM Mono',monospace",
                      }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }} />
                        {isOut ? "OUT OF STOCK" : "LOW STOCK"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ padding: "2px 9px", borderRadius: "99px", background: urgBg, border: `1px solid ${urgBorder}`, color: urgColor, fontSize: "9.5px", fontFamily: "'DM Mono',monospace", fontWeight: 800, letterSpacing: ".06em" }}>{urgency}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: "2px solid rgba(26,26,46,.08)", background: "rgba(26,26,46,.02)" }}>
                  <td colSpan={5} style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>Total ({filtered.length} products)</td>
                  <td style={{ padding: "12px 14px", fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 900, color: AM }}>{filtered.reduce((s, p) => s + p.stock, 0)}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 900, color: "#059669" }}>₹{fmt(filtered.reduce((s, p) => s + (p.stock * (p.costPrice || 0)), 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </PageShell>
  );
}
