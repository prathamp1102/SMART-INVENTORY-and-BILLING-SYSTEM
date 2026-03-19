import { useState, useEffect, useCallback } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";

/* ── palette ──────────────────────────────────────────────── */
const ac   = "#7c3aed";
const acL  = "rgba(124,58,237,.08)";
const acB  = "rgba(124,58,237,.2)";
const blue = "#0284c7"; const blueL = "rgba(2,132,199,.08)"; const blueB = "rgba(2,132,199,.2)";
const green= "#059669"; const greenL= "rgba(5,150,105,.08)"; const greenB= "rgba(5,150,105,.2)";
const red  = "#dc2626"; const redL  = "rgba(239,68,68,.08)"; const redB  = "rgba(239,68,68,.2)";
const amber= "#b45309"; const amberL= "rgba(180,83,9,.08)";  const amberB= "rgba(180,83,9,.2)";

const fmt = (n) =>
  n === null || n === undefined ? "—"
  : n >= 1e7 ? `₹${(n/1e7).toFixed(1)}Cr`
  : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L`
  : n >= 1000 ? `₹${(n/1000).toFixed(1)}k`
  : `₹${n.toLocaleString("en-IN")}`;

const fmtN = (n) => n === null || n === undefined ? "—" : n.toLocaleString("en-IN");

/* ── micro components ─────────────────────────────────────── */
function KpiCard({ label, value, sub, color = blue, bg = blueL, border = blueB, badge, badgeUp }) {
  return (
    <div style={{ background: "#fff", borderRadius: "18px", border: `1px solid ${border}`, padding: "20px", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</span>
        {badge && <span style={{ fontSize: "10.5px", fontWeight: 700, color: badgeUp !== false ? green : red, background: badgeUp !== false ? "rgba(5,150,105,.1)" : "rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: "99px", fontFamily: "'DM Mono',monospace" }}>{badgeUp !== false ? "↑" : "↓"} {badge}</span>}
      </div>
      <div style={{ fontFamily: "'Figtree',sans-serif", fontSize: "28px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.04em" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "5px", fontFamily: "'DM Mono',monospace" }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{ fontFamily: "'Figtree',sans-serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: "13px", color: "rgba(26,26,46,.45)", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", boxShadow: "0 2px 12px rgba(26,26,46,.05)", overflow: "hidden", ...style }}>{children}</div>;
}

function CardHead({ title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
      <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>{title}</span>
      {right}
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".13em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" }}>{children}</th>;
}
function Td({ children, style = {} }) {
  return <td style={{ padding: "12px 14px", fontSize: "13px", color: "#1a1a2e", borderTop: "1px solid rgba(26,26,46,.05)", ...style }}>{children}</td>;
}

function Badge({ children, color = blue, bg = blueL, border = blueB }) {
  return <span style={{ padding: "2px 9px", borderRadius: "99px", background: bg, border: `1px solid ${border}`, color, fontSize: "10.5px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{children}</span>;
}

function StatusDot({ status }) {
  const on = status === "ACTIVE" || status === "SUCCESS" || status === "active";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: on ? green : red, boxShadow: on ? `0 0 5px ${greenB}` : `0 0 5px ${redB}`, display: "inline-block" }} />
    <span style={{ fontSize: "12px", color: on ? green : red, fontWeight: 600 }}>{status}</span>
  </span>;
}

function BarChart({ data, valueKey, labelKey, color = blue }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "140px", padding: "0 4px" }}>
      {data.map((d, i) => {
        const h = Math.round(((d[valueKey] || 0) / max) * 120);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color, fontWeight: 600, textAlign: "center" }}>
              {d[valueKey] >= 1000 ? `₹${(d[valueKey]/1000).toFixed(0)}k` : d[valueKey]}
            </div>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "120px" }}>
              <div style={{ width: "100%", height: `${h}px`, borderRadius: "5px 5px 0 0", background: `linear-gradient(180deg,${color},${color}99)`, transition: "height .4s ease", minHeight: "3px" }} />
            </div>
            <div style={{ fontSize: "9.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", textAlign: "center" }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px", flexDirection: "column", gap: "12px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${acL}`, borderTop: `3px solid ${ac}`, animation: "spin 0.8s linear infinite" }} />
      <span style={{ fontSize: "13px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>Loading data…</span>
    </div>
  );
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div style={{ padding: "32px", textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: red, marginBottom: "12px" }}>{msg}</div>
      <button onClick={onRetry} style={{ padding: "8px 18px", borderRadius: "10px", border: `1px solid ${redB}`, background: redL, color: red, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Retry</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: SALES REPORT
═══════════════════════════════════════════════════════════════ */
function SalesTab() {
  const [period, setPeriod] = useState("month");
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get(`/superadmin/reports/sales?period=${period}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load sales report");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;
  const { summary: s, daily, topProducts, payMethods } = data;

  const kpis = [
    { label: "Total Revenue",    value: fmt(s.totalRevenue), badge: `${s.totalProducts} products`, color: blue, bg: blueL, border: blueB },
    { label: "Net After Returns", value: fmt(s.netRevenue),  sub: `Returns: ${fmt(s.returns)}`,   color: ac, bg: acL, border: acB },
    { label: "Total Invoices",   value: fmtN(s.totalInvoices), sub: `Avg: ${fmt(s.avgInvoice)} / invoice`, color: green, bg: greenL, border: greenB },
    { label: "Gross Profit",     value: fmt(s.grossProfit),  sub: `${s.activeSuppliers} suppliers`, color: amber, bg: amberL, border: amberB },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Period Selector */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "12px", alignSelf: "flex-start" }}>
        {[["today","Today"],["week","This Week"],["month","This Month"],["quarter","Quarter"],["year","This Year"]].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12.5px", fontWeight: 600, fontFamily: "'Figtree',sans-serif", transition: "all .15s", background: period === k ? "#fff" : "transparent", color: period === k ? "#1a1a2e" : "rgba(26,26,46,.45)", boxShadow: period === k ? "0 1px 6px rgba(26,26,46,.1)" : "none" }}>{l}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(180px, 100%), 1fr))", gap: "14px" }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Bar Chart + Payment Methods */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(300px, 100%), 1fr))", gap: "16px" }}>
        <Card>
          <CardHead title="Daily Sales (Last 7 Days)" />
          <div style={{ padding: "20px 22px" }}>
            <BarChart data={daily} valueKey="sales" labelKey="date" color={blue} />
          </div>
        </Card>
        <Card>
          <CardHead title="Payment Methods" />
          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {payMethods.map((m, i) => {
              const colors  = [blue, green, ac];
              const bgs     = [blueL, greenL, acL];
              const borders = [blueB, greenB, acB];
              return (
                <div key={m.method}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{m.method}</div>
                      <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{m.count} invoices · {fmt(m.amount)}</div>
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "14px", fontWeight: 800, color: colors[i] }}>{m.pct}%</span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "99px", background: "rgba(26,26,46,.07)" }}>
                    <div style={{ width: `${m.pct}%`, height: "100%", borderRadius: "99px", background: colors[i], transition: "width .5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHead title="Top Products by Revenue" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "rgba(26,26,46,.03)" }}>
              {["#","Product","Category","Branch","Revenue","Margin"].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}>
                  <Td><div style={{ width: "24px", height: "24px", borderRadius: "6px", background: blueL, border: `1px solid ${blueB}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: "10px", fontWeight: 700, color: blue }}>{i + 1}</div></Td>
                  <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                  <Td><Badge color={green} bg={greenL} border={greenB}>{p.category}</Badge></Td>
                  <Td><Badge color={ac} bg={acL} border={acB}>{p.branch}</Badge></Td>
                  <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(p.revenue)}</Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "5px", borderRadius: "99px", background: "rgba(26,26,46,.08)" }}>
                        <div style={{ width: `${Math.min(p.margin, 100)}%`, height: "100%", borderRadius: "99px", background: p.margin > 40 ? green : p.margin > 20 ? blue : amber }} />
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", fontWeight: 700, minWidth: "35px" }}>{p.margin}%</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: INVENTORY REPORT
═══════════════════════════════════════════════════════════════ */
function InventoryTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [view, setView]       = useState("overview"); // overview | low | out

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get("/superadmin/reports/inventory");
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load inventory report");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;
  const { summary: s, lowStockProducts, outOfStockProducts, byCategory, byBranch } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(160px, 100%), 1fr))", gap: "14px" }}>
        <KpiCard label="Total Products" value={fmtN(s.totalProducts)} sub={`${fmtN(s.totalStock)} units in stock`} color={blue} bg={blueL} border={blueB} />
        <KpiCard label="Stock Value"    value={fmt(s.totalValue)}     sub={`${fmtN(s.totalCategories)} categories`} color={green} bg={greenL} border={greenB} />
        <KpiCard label="Low Stock"      value={fmtN(s.lowStockCount)} sub="≤ 10 units remaining" color={amber} bg={amberL} border={amberB} />
        <KpiCard label="Out of Stock"   value={fmtN(s.outOfStockCount)} sub="Immediate restock needed" color={red} bg={redL} border={redB} />
      </div>

      {/* Sub-view selector */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "12px", alignSelf: "flex-start" }}>
        {[["overview","Overview"],["low","Low Stock"],["out","Out of Stock"]].map(([k,l]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12.5px", fontWeight: 600, fontFamily: "'Figtree',sans-serif", transition: "all .15s", background: view === k ? "#fff" : "transparent", color: view === k ? "#1a1a2e" : "rgba(26,26,46,.45)", boxShadow: view === k ? "0 1px 6px rgba(26,26,46,.1)" : "none" }}>{l}</button>
        ))}
      </div>

      {view === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(300px, 100%), 1fr))", gap: "16px" }}>
          {/* By Category */}
          <Card>
            <CardHead title="Stock by Category" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Category</Th><Th>Products</Th><Th>Units</Th><Th>Value</Th></tr></thead>
                <tbody>
                  {byCategory.map(c => (
                    <tr key={c.name}>
                      <Td style={{ fontWeight: 600 }}>{c.name}</Td>
                      <Td style={{ fontFamily: "'DM Mono',monospace" }}>{c.count}</Td>
                      <Td style={{ fontFamily: "'DM Mono',monospace" }}>{fmtN(c.totalStock)}</Td>
                      <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(c.totalValue)}</Td>
                    </tr>
                  ))}
                  {byCategory.length === 0 && <tr><Td colSpan={4} style={{ textAlign: "center", color: "rgba(26,26,46,.3)" }}>No category data</Td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          {/* By Branch */}
          <Card>
            <CardHead title="Stock by Branch" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Branch</Th><Th>Products</Th><Th>Units</Th><Th>Low</Th></tr></thead>
                <tbody>
                  {byBranch.map(b => (
                    <tr key={b.name}>
                      <Td>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{b.city}</div>
                      </Td>
                      <Td style={{ fontFamily: "'DM Mono',monospace" }}>{b.count}</Td>
                      <Td style={{ fontFamily: "'DM Mono',monospace" }}>{fmtN(b.totalStock)}</Td>
                      <Td>
                        {b.lowStock > 0
                          ? <Badge color={amber} bg={amberL} border={amberB}>{b.lowStock} low</Badge>
                          : <Badge color={green} bg={greenL} border={greenB}>OK</Badge>}
                      </Td>
                    </tr>
                  ))}
                  {byBranch.length === 0 && <tr><Td colSpan={4} style={{ textAlign: "center", color: "rgba(26,26,46,.3)" }}>No branch data</Td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {view === "low" && (
        <Card>
          <CardHead title="Low Stock Products" right={<Badge color={amber} bg={amberL} border={amberB}>{lowStockProducts.length} items</Badge>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Product</Th><Th>Category</Th><Th>Branch</Th><Th>Stock</Th><Th>Price</Th></tr></thead>
              <tbody>
                {lowStockProducts.map((p, i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                    <Td><Badge color={green} bg={greenL} border={greenB}>{p.category}</Badge></Td>
                    <Td><Badge color={ac} bg={acL} border={acB}>{p.branch}</Badge></Td>
                    <Td><span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 800, color: p.stock <= 5 ? red : amber }}>{p.stock}</span></Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(p.price)}</Td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && <tr><Td colSpan={5} style={{ textAlign: "center", color: green }}>✓ All products adequately stocked</Td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {view === "out" && (
        <Card>
          <CardHead title="Out of Stock Products" right={<Badge color={red} bg={redL} border={redB}>{outOfStockProducts.length} items</Badge>} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Product</Th><Th>Category</Th><Th>Branch</Th><Th>Selling Price</Th><Th>Cost Price</Th></tr></thead>
              <tbody>
                {outOfStockProducts.map((p, i) => (
                  <tr key={i}>
                    <Td style={{ fontWeight: 600 }}>{p.name}</Td>
                    <Td><Badge color={green} bg={greenL} border={greenB}>{p.category}</Badge></Td>
                    <Td><Badge color={ac} bg={acL} border={acB}>{p.branch}</Badge></Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(p.price)}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace" }}>{fmt(p.costPrice)}</Td>
                  </tr>
                ))}
                {outOfStockProducts.length === 0 && <tr><Td colSpan={5} style={{ textAlign: "center", color: green }}>✓ No out-of-stock items</Td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: BRANCH-WISE REPORT
═══════════════════════════════════════════════════════════════ */
function BranchTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get("/superadmin/reports/branches");
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load branch report");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;
  const { summary: s, branches, organizations } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(160px, 100%), 1fr))", gap: "14px" }}>
        <KpiCard label="Total Branches"      value={fmtN(s.totalBranches)}      sub={`${fmtN(s.activeBranches)} active`}  color={blue}  bg={blueL}  border={blueB} />
        <KpiCard label="Organizations"       value={fmtN(s.totalOrganizations)} sub="Companies registered"                color={ac}    bg={acL}    border={acB}   />
        <KpiCard label="Total System Users"  value={fmtN(s.totalUsers)}         sub="Across all branches"                 color={green} bg={greenL} border={greenB}/>
      </div>

      {/* Organizations summary */}
      {organizations.length > 0 && (
        <Card>
          <CardHead title="Organizations" />
          <div style={{ padding: "16px 22px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {organizations.map(o => (
              <div key={o.id} style={{ padding: "10px 16px", borderRadius: "12px", background: acL, border: `1px solid ${acB}` }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1a1a2e" }}>{o.name}</div>
                <div style={{ fontSize: "11px", color: "rgba(26,26,46,.45)", fontFamily: "'DM Mono',monospace" }}>{o.branches} branch{o.branches !== 1 ? "es" : ""}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Branch Table */}
      <Card>
        <CardHead title="All Branches" right={<Badge color={blue} bg={blueL} border={blueB}>{branches.length} branches</Badge>} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(26,26,46,.03)" }}>
                <Th>Branch</Th><Th>Organization</Th><Th>Admin</Th><Th>Status</Th><Th>Products</Th><Th>Users</Th><Th>Stock Value</Th><Th>Est. Revenue</Th><Th>Alerts</Th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b.id}>
                  <Td>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{b.city}{b.state ? `, ${b.state}` : ""}</div>
                  </Td>
                  <Td style={{ fontSize: "12px" }}>{b.organization}</Td>
                  <Td>
                    <div style={{ fontSize: "12px", fontWeight: 600 }}>{b.admin}</div>
                    <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)" }}>{b.adminEmail}</div>
                  </Td>
                  <Td><StatusDot status={b.status} /></Td>
                  <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{b.totalProducts}</Td>
                  <Td style={{ fontFamily: "'DM Mono',monospace" }}>{b.totalUsers}</Td>
                  <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(b.stockValue)}</Td>
                  <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: blue }}>{fmt(b.estimatedRevenue)}</Td>
                  <Td>
                    {b.outOfStock > 0 && <Badge color={red} bg={redL} border={redB}>{b.outOfStock} OOS</Badge>}
                    {b.lowStock > 0 && <Badge color={amber} bg={amberL} border={amberB}>{b.lowStock} low</Badge>}
                    {b.outOfStock === 0 && b.lowStock === 0 && <Badge color={green} bg={greenL} border={greenB}>OK</Badge>}
                  </Td>
                </tr>
              ))}
              {branches.length === 0 && <tr><Td colSpan={9} style={{ textAlign: "center", color: "rgba(26,26,46,.3)" }}>No branches found</Td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PROFIT & LOSS
═══════════════════════════════════════════════════════════════ */
function ProfitLossTab() {
  const [period, setPeriod]   = useState("month");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get(`/superadmin/reports/profit-loss?period=${period}`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load P&L report");
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;
  const { summary: s, monthly, byCategory, byBranch } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Period */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "12px", alignSelf: "flex-start" }}>
        {[["month","This Month"],["quarter","Quarter"],["year","This Year"]].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12.5px", fontWeight: 600, fontFamily: "'Figtree',sans-serif", transition: "all .15s", background: period === k ? "#fff" : "transparent", color: period === k ? "#1a1a2e" : "rgba(26,26,46,.45)", boxShadow: period === k ? "0 1px 6px rgba(26,26,46,.1)" : "none" }}>{l}</button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(160px, 100%), 1fr))", gap: "14px" }}>
        <KpiCard label="Total Revenue"  value={fmt(s.totalRevenue)} badge={`${s.revenueChange > 0 ? "+" : ""}${s.revenueChange}%`} badgeUp={s.revenueChange >= 0} color={blue}  bg={blueL}  border={blueB}  />
        <KpiCard label="Cost of Goods"  value={fmt(s.totalCost)}    sub="Direct product costs"                                       color={red}   bg={redL}   border={redB}   />
        <KpiCard label="Gross Profit"   value={fmt(s.grossProfit)}  sub={`Margin: ${s.grossMargin}%`}                                color={green} bg={greenL} border={greenB} />
        <KpiCard label="Net Profit"     value={fmt(s.netProfit)}    badge={`${s.profitChange > 0 ? "+" : ""}${s.profitChange}%`} badgeUp={s.profitChange >= 0} sub={`Net margin: ${s.netMargin}%`} color={ac} bg={acL} border={acB} />
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHead title="Monthly Revenue vs Cost Trend" />
        <div style={{ padding: "20px 22px" }}>
          <BarChart data={monthly} valueKey="revenue" labelKey="month" color={blue} />
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", justifyContent: "center" }}>
            {[["Revenue", blue], ["Cost", red], ["Net Profit", green]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} />
                <span style={{ fontSize: "11px", color: "rgba(26,26,46,.5)", fontFamily: "'DM Mono',monospace" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(300px, 100%), 1fr))", gap: "16px" }}>
        {/* By Category */}
        <Card>
          <CardHead title="P&L by Category" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Category</Th><Th>Revenue</Th><Th>Gross Profit</Th><Th>Margin</Th></tr></thead>
              <tbody>
                {byCategory.map(c => (
                  <tr key={c.name}>
                    <Td style={{ fontWeight: 600 }}>{c.name}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(c.revenue)}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: c.gross >= 0 ? green : red }}>{fmt(c.gross)}</Td>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <div style={{ flex: 1, height: "5px", borderRadius: "99px", background: "rgba(26,26,46,.08)" }}>
                          <div style={{ width: `${Math.min(Math.abs(c.margin), 100)}%`, height: "100%", borderRadius: "99px", background: c.margin > 30 ? green : c.margin > 15 ? blue : amber }} />
                        </div>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", fontWeight: 700, minWidth: "40px" }}>{c.margin}%</span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* By Branch */}
        <Card>
          <CardHead title="P&L by Branch" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "rgba(26,26,46,.03)" }}><Th>Branch</Th><Th>Revenue</Th><Th>Profit</Th><Th>Margin</Th></tr></thead>
              <tbody>
                {byBranch.map(b => (
                  <tr key={b.name}>
                    <Td style={{ fontWeight: 600 }}>{b.name}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{fmt(b.revenue)}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: b.profit >= 0 ? green : red }}>{fmt(b.profit)}</Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: b.margin > 20 ? green : amber }}>{b.margin}%</Td>
                  </tr>
                ))}
                {byBranch.length === 0 && <tr><Td colSpan={4} style={{ textAlign: "center", color: "rgba(26,26,46,.3)" }}>No branch data</Td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* P&L Statement */}
      <Card>
        <CardHead title="Income Statement Summary" />
        <div style={{ padding: "20px 22px" }}>
          {[
            { label: "Total Revenue",      value: s.totalRevenue, color: "#1a1a2e", bold: true },
            { label: "Cost of Goods Sold", value: -s.totalCost,   color: red },
            { label: "Gross Profit",       value: s.grossProfit,  color: green, bold: true, line: true },
            { label: "Operating Expenses", value: -s.expenses,    color: red },
            { label: "Net Profit",         value: s.netProfit,    color: s.netProfit >= 0 ? green : red, bold: true, line: true, big: true },
          ].map(row => (
            <div key={row.label}>
              {row.line && <div style={{ borderTop: "2px solid rgba(26,26,46,.08)", margin: "12px 0 8px" }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: row.big ? "15px" : "13px", fontWeight: row.bold ? 700 : 500, color: "#1a1a2e" }}>{row.label}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: row.big ? "18px" : "14px", fontWeight: row.bold ? 800 : 600, color: row.color }}>
                  {row.value < 0 ? `(${fmt(-row.value)})` : fmt(row.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: SYSTEM LOGS
═══════════════════════════════════════════════════════════════ */
const LOG_SEVERITY_CONFIG = {
  INFO:    { color: blue,  bg: blueL,  border: blueB  },
  SUCCESS: { color: green, bg: greenL, border: greenB },
  WARNING: { color: amber, bg: amberL, border: amberB },
  ERROR:   { color: red,   bg: redL,   border: redB   },
};

const LOG_TYPE_CONFIG = {
  USER:       { color: ac,    bg: acL,    border: acB    },
  INVENTORY:  { color: blue,  bg: blueL,  border: blueB  },
  SUPPLIER:   { color: green, bg: greenL, border: greenB },
  ATTENDANCE: { color: amber, bg: amberL, border: amberB },
  SYSTEM:     { color: red,   bg: redL,   border: redB   },
};

function SystemLogsTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState("ALL");
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get(`/superadmin/logs?page=${page}&limit=50`);
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load system logs");
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;
  if (error)   return <ErrorBox msg={error} onRetry={load} />;

  const logs = data.logs.filter(l => filter === "ALL" || l.type === filter || l.severity === filter);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) + " " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const types = ["ALL","USER","INVENTORY","SUPPLIER","ATTENDANCE","SYSTEM","WARNING","ERROR"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(140px, 100%), 1fr))", gap: "12px" }}>
        {[
          { label: "Total Events",  value: fmtN(data.total), color: blue,  bg: blueL,  border: blueB  },
          { label: "Warnings",      value: fmtN(data.logs.filter(l => l.severity === "WARNING").length), color: amber, bg: amberL, border: amberB },
          { label: "Errors",        value: fmtN(data.logs.filter(l => l.severity === "ERROR").length),   color: red,   bg: redL,   border: redB   },
          { label: "System Events", value: fmtN(data.logs.filter(l => l.type === "SYSTEM").length),      color: ac,    bg: acL,    border: acB    },
        ].map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 13px", borderRadius: "8px", border: `1px solid ${filter === t ? acB : "rgba(26,26,46,.12)"}`, background: filter === t ? acL : "transparent", color: filter === t ? ac : "rgba(26,26,46,.5)", fontSize: "11.5px", fontWeight: filter === t ? 700 : 500, cursor: "pointer", fontFamily: "'DM Mono',monospace", transition: "all .15s" }}>{t}</button>
        ))}
        <button onClick={load} style={{ padding: "5px 13px", borderRadius: "8px", border: `1px solid ${greenB}`, background: greenL, color: green, fontSize: "11.5px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace", marginLeft: "auto" }}>↻ Refresh</button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHead title={`Audit Log — ${logs.length} events`} right={
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: green, background: greenL, border: `1px solid ${greenB}`, padding: "3px 9px", borderRadius: "99px", letterSpacing: ".12em" }}>LIVE</span>
        } />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(26,26,46,.03)" }}>
                <Th>Severity</Th><Th>Type</Th><Th>Action</Th><Th>Detail</Th><Th>Timestamp</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const sev = LOG_SEVERITY_CONFIG[log.severity] || LOG_SEVERITY_CONFIG.INFO;
                const typ = LOG_TYPE_CONFIG[log.type]         || LOG_TYPE_CONFIG.SYSTEM;
                return (
                  <tr key={i} style={{ background: log.severity === "ERROR" ? "rgba(239,68,68,.02)" : log.severity === "WARNING" ? "rgba(180,83,9,.02)" : undefined }}>
                    <Td><Badge color={sev.color} bg={sev.bg} border={sev.border}>{log.severity}</Badge></Td>
                    <Td><Badge color={typ.color} bg={typ.bg} border={typ.border}>{log.type}</Badge></Td>
                    <Td style={{ fontWeight: 600, fontSize: "12.5px" }}>{log.action}</Td>
                    <Td style={{ fontSize: "12px", color: "rgba(26,26,46,.6)", maxWidth: "min(300px, 100%)" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.detail}</div>
                    </Td>
                    <Td style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.4)", whiteSpace: "nowrap" }}>{formatTime(log.timestamp)}</Td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: "rgba(26,26,46,.3)", padding: "32px" }}>No logs match the selected filter</Td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {data.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "16px", borderTop: "1px solid rgba(26,26,46,.06)" }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 16px", borderRadius: "9px", border: `1px solid ${acB}`, background: page === 1 ? "rgba(26,26,46,.04)" : acL, color: page === 1 ? "rgba(26,26,46,.3)" : ac, cursor: page === 1 ? "default" : "pointer", fontSize: "12px", fontWeight: 700 }}>← Prev</button>
            <span style={{ padding: "6px 12px", fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "rgba(26,26,46,.5)" }}>Page {page} / {data.pages}</span>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} style={{ padding: "6px 16px", borderRadius: "9px", border: `1px solid ${acB}`, background: page === data.pages ? "rgba(26,26,46,.04)" : acL, color: page === data.pages ? "rgba(26,26,46,.3)" : ac, cursor: page === data.pages ? "default" : "pointer", fontSize: "12px", fontWeight: 700 }}>Next →</button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { key: "sales",     label: "📊 Sales Report",      Comp: SalesTab },
  { key: "inventory", label: "📦 Inventory Report",   Comp: InventoryTab },
  { key: "branches",  label: "🏢 Branch-wise Report", Comp: BranchTab },
  { key: "pl",        label: "💹 Profit & Loss",      Comp: ProfitLossTab },
  { key: "logs",      label: "🔍 System Logs",        Comp: SystemLogsTab },
];

export default function SystemMonitoring() {
  const [tab, setTab] = useState("sales");
  const activeTab = TABS.find(t => t.key === tab);
  const ActiveComp = activeTab?.Comp;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
      `}</style>
      <PageShell
        title="Full System Monitoring"
        subtitle="Real-time reports · Sales · Inventory · Branches · Profit & Loss · Audit Logs"
      >
        {/* Tab Bar */}
        <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "14px", marginBottom: "24px", overflowX: "auto", flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "9px 18px", borderRadius: "11px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 700, fontFamily: "'Figtree',sans-serif",
                transition: "all .18s", whiteSpace: "nowrap",
                background: tab === t.key ? "#fff" : "transparent",
                color:      tab === t.key ? "#1a1a2e" : "rgba(26,26,46,.45)",
                boxShadow:  tab === t.key ? "0 2px 10px rgba(26,26,46,.1)" : "none",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div style={{ animation: "fadeUp .3s ease both" }}>
          {ActiveComp && <ActiveComp />}
        </div>
      </PageShell>
    </>
  );
}
