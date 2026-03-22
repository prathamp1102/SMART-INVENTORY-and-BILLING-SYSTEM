/**
 * StaffLimitedReports.jsx
 * 📊 Limited Reports for STAFF role
 * Correctly wired to backend:
 *   - GET /invoices?cashier=<uid>   → own sales
 *   - GET /invoices?cashier=<uid>&from=<date>&to=<date>  → daily filter
 *
 * Backend field names used:
 *   inv.invoiceNo       (not invoiceNumber)
 *   inv.grandTotal      (not totalAmount)
 *   inv.paymentMode     (not paymentMethod)
 *   inv.cashier._id     (not createdBy)
 */
import { useState, useEffect, useMemo } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";
import ExcelExport from "../../components/ui/ExcelExport";

/* ── Design tokens ────────────────────────────────────────── */
const P  = "#059669", PL = "rgba(5,150,105,.08)",  PB = "rgba(5,150,105,.2)";
const B  = "#0284c7", BL = "rgba(2,132,199,.08)",  BB = "rgba(2,132,199,.2)";
const V  = "#7c3aed", VL = "rgba(124,58,237,.08)", VB = "rgba(124,58,237,.2)";
const AM = "#b45309", AML= "rgba(180,83,9,.08)",   AMB= "rgba(180,83,9,.2)";
const RD = "#dc2626", RDL= "rgba(239,68,68,.08)",  RDB= "rgba(239,68,68,.2)";
const INK = "#1a1a2e";
const inkA = a => `rgba(26,26,46,${a})`;

const MONO  = "'DM Mono','Fira Mono',monospace";
const SERIF = "'Fraunces',serif";
const BODY  = "'Poppins','Inter',sans-serif";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Tiny helpers ─────────────────────────────────────────── */
function fmt(n) { return (n || 0).toLocaleString("en-IN"); }
function fmtShort(n) {
  if (n >= 100000) return (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return (n / 1000).toFixed(1) + "k";
  return String(Math.round(n));
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:80, gap:14 }}>
      <div style={{ width:32, height:32, borderRadius:"50%",
        border:`3px solid ${inkA(.1)}`, borderTopColor:B,
        animation:"spin .7s linear infinite" }} />
      <div style={{ fontSize:13, color:inkA(.38), fontFamily:MONO }}>Loading your data…</div>
    </div>
  );
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px",
      borderRadius:"99px", background:bg, border:`1px solid ${border}`,
      color, fontSize:"9px", fontFamily:MONO, fontWeight:700,
      letterSpacing:".1em", textTransform:"uppercase" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:"currentColor" }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color, bg, border, loading }) {
  return (
    <div style={{ background:"#fff", borderRadius:"14px", border:`1px solid ${border}`,
      padding:"16px 18px", boxShadow:"0 2px 10px rgba(26,26,46,.04)",
      position:"relative", overflow:"hidden" }}>
      {loading ? (
        <div style={{ height:40, background:`linear-gradient(90deg,${inkA(.05)} 25%,${inkA(.1)} 50%,${inkA(.05)} 75%)`,
          borderRadius:8, animation:"shimmer 1.4s infinite", backgroundSize:"200% 100%" }} />
      ) : (
        <>
          <div style={{ fontFamily:SERIF, fontSize:"24px", fontWeight:900, color, letterSpacing:"-.02em" }}>
            {value}
          </div>
          {sub && <div style={{ fontFamily:MONO, fontSize:"9.5px", color, letterSpacing:".06em", marginTop:1 }}>{sub}</div>}
        </>
      )}
      <div style={{ fontFamily:MONO, fontSize:"9px", color:inkA(.4),
        letterSpacing:".12em", textTransform:"uppercase", marginTop:6 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
      <div style={{ width:40, height:40, borderRadius:"12px", background:BL, border:`1.5px solid ${BB}`,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:SERIF, fontSize:"16px", fontWeight:800, color:INK }}>{title}</div>
        {subtitle && <div style={{ fontSize:"12px", color:inkA(.42), marginTop:1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ padding:"64px 20px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:14, fontWeight:700, color:inkA(.4), marginBottom:5 }}>{title}</div>
      <div style={{ fontSize:12, color:inkA(.28) }}>{sub}</div>
    </div>
  );
}

const thS = {
  padding:"10px 14px", textAlign:"left", fontFamily:MONO,
  fontSize:"9px", color:inkA(.38), letterSpacing:".14em", textTransform:"uppercase",
};
const selS = {
  padding:"7px 12px", borderRadius:"9px", border:`1.5px solid ${inkA(.12)}`,
  outline:"none", fontSize:"13px", background:"#fff", cursor:"pointer", fontFamily:BODY,
};

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function StaffLimitedReports() {
  const { user } = useAuth();
  const [tab, setTab] = useState("own-sales");

  /* ── Own Sales ── */
  const [invoices, setInvoices]         = useState([]);
  const [invLoading, setInvLoading]     = useState(true);
  const [invError, setInvError]         = useState("");
  const [invSearch, setInvSearch]       = useState("");
  const [invMonth, setInvMonth]         = useState("ALL");
  const [invYear, setInvYear]           = useState(String(new Date().getFullYear()));
  const [expandedInv, setExpandedInv]   = useState(null);

  /* ── Daily Summary ── */
  const [dailyDate, setDailyDate]       = useState(new Date().toISOString().split("T")[0]);
  const [dailyInvoices, setDailyInvoices] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError]     = useState("");

  const uid = user?._id || user?.id;

  /* ── Fetch own invoices (all time) ── */
  useEffect(() => {
    if (!uid) return;
    setInvLoading(true);
    setInvError("");

    // Use cashier query param so backend only returns THIS user's invoices
    axiosInstance.get(`/invoices?cashier=${uid}`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setInvoices(data);
      })
      .catch(err => {
        setInvError(err?.response?.data?.message || "Failed to load invoices. Please try again.");
        setInvoices([]);
      })
      .finally(() => setInvLoading(false));
  }, [uid]);

  /* ── Fetch daily invoices when date changes ── */
  useEffect(() => {
    if (!uid) return;
    setDailyLoading(true);
    setDailyError("");

    // Pass from/to for the selected date
    const from = dailyDate;
    const to   = dailyDate;
    axiosInstance.get(`/invoices?cashier=${uid}&from=${from}&to=${to}`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setDailyInvoices(data);
      })
      .catch(err => {
        setDailyError(err?.response?.data?.message || "Failed to load daily data.");
        setDailyInvoices([]);
      })
      .finally(() => setDailyLoading(false));
  }, [uid, dailyDate]);

  /* ── Own Sales: client-side filter by year / month / search ── */
  const filteredInvoices = useMemo(() => {
    let rows = invoices;
    if (invYear !== "ALL") {
      rows = rows.filter(inv => new Date(inv.createdAt).getFullYear() === Number(invYear));
    }
    if (invMonth !== "ALL") {
      rows = rows.filter(inv => new Date(inv.createdAt).getMonth() === Number(invMonth));
    }
    if (invSearch.trim()) {
      const q = invSearch.toLowerCase();
      rows = rows.filter(inv =>
        (inv.invoiceNo || "").toLowerCase().includes(q) ||
        (inv.customerName || "").toLowerCase().includes(q) ||
        (inv.customerPhone || "").includes(q)
      );
    }
    return rows;
  }, [invoices, invYear, invMonth, invSearch]);

  /* ── Own Sales stats (use grandTotal + paymentMode) ── */
  const ownTotal    = filteredInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const ownAvg      = filteredInvoices.length ? Math.round(ownTotal / filteredInvoices.length) : 0;
  const ownCash     = filteredInvoices
    .filter(i => i.paymentMode === "CASH")
    .reduce((s, i) => s + (i.grandTotal || 0), 0);
  const ownCancelled = filteredInvoices.filter(i => i.status === "CANCELLED").length;

  /* ── Daily stats ── */
  const dailyTotal   = dailyInvoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const dailyCount   = dailyInvoices.length;
  const dailyAvg     = dailyCount ? Math.round(dailyTotal / dailyCount) : 0;
  const dailyMethods = dailyInvoices.reduce((acc, inv) => {
    const m = inv.paymentMode || "OTHER";
    acc[m] = (acc[m] || 0) + (inv.grandTotal || 0);
    return acc;
  }, {});

  /* ── Available years from own invoices ── */
  const years = useMemo(() => {
    const ys = [...new Set(invoices.map(i => new Date(i.createdAt).getFullYear()))].sort((a, b) => b - a);
    return ys.length ? ys : [new Date().getFullYear()];
  }, [invoices]);

  /* ── Excel export data ── */
  const exportSalesData = filteredInvoices.map(inv => ({
    "Invoice #":   inv.invoiceNo || "—",
    "Date":        new Date(inv.createdAt).toLocaleDateString("en-IN"),
    "Customer":    inv.customerName || "Walk-in",
    "Items":       inv.items?.length || 0,
    "Subtotal (₹)":inv.subtotal || 0,
    "Discount (₹)":inv.discountAmount || 0,
    "Tax (₹)":     inv.taxAmount || 0,
    "Grand Total (₹)": inv.grandTotal || 0,
    "Payment":     inv.paymentMode || "—",
    "Status":      inv.status || "—",
  }));

  const exportDailyData = dailyInvoices.map(inv => ({
    "Invoice #":      inv.invoiceNo || "—",
    "Time":           new Date(inv.createdAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }),
    "Customer":       inv.customerName || "Walk-in",
    "Grand Total (₹)":inv.grandTotal || 0,
    "Payment":        inv.paymentMode || "—",
    "Status":         inv.status || "—",
  }));

  const isToday = dailyDate === new Date().toISOString().split("T")[0];

  /* ── Monthly breakdown helper ── */
  function monthlyTotal(monthIdx) {
    return invoices
      .filter(inv => {
        const d = new Date(inv.createdAt);
        return d.getMonth() === monthIdx &&
               (invYear === "ALL" || d.getFullYear() === Number(invYear));
      })
      .reduce((s, inv) => s + (inv.grandTotal || 0), 0);
  }
  const maxMonthly = Math.max(...MONTHS.map((_, i) => monthlyTotal(i)), 1);

  /* ── Payment method colours ── */
  function methodColor(m) {
    return m === "CASH" ? [P, PL, PB]
         : m === "UPI"  ? [B, BL, BB]
         : m === "CARD" ? [V, VL, VB]
         : [AM, AML, AMB];
  }
  function methodEmoji(m) {
    return m === "CASH" ? "💵" : m === "UPI" ? "📲" : m === "CARD" ? "💳" : "💰";
  }

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <PageShell
      title="My Reports"
      subtitle="View your own sales performance and daily billing summary"
    >
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes shimmer { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
        .inv-row:hover td  { background:${BL}!important }
      `}</style>

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        borderRadius: 20, padding: "24px 32px", marginBottom: 24,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:16, boxShadow:"0 8px 32px rgba(26,26,46,.18)",
      }}>
        <div>
          <div style={{ fontFamily:SERIF, fontSize:20, fontWeight:900, color:"#fff",
            letterSpacing:"-.02em", marginBottom:5 }}>Staff Reports Centre</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", fontFamily:MONO, letterSpacing:".04em" }}>
            2 REPORT TYPES · MY DATA ONLY · EXCEL EXPORT
          </div>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {[["💰","Own Sales"],["📅","Daily"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
              <div style={{ fontFamily:MONO, fontSize:8, color:"rgba(255,255,255,.4)",
                letterSpacing:".12em", textTransform:"uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, padding:4, background:inkA(.06),
        borderRadius:12, width:"fit-content", marginBottom:20 }}>
        {[["own-sales","💰 Own Sales"],["daily","📅 Daily Summary"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} type="button" style={{
            padding:"9px 22px", borderRadius:9, border:"none", cursor:"pointer",
            fontSize:13, fontWeight:600, transition:"all .18s", fontFamily:BODY,
            background: tab === key ? "#fff" : "transparent",
            color:      tab === key ? INK   : inkA(.45),
            boxShadow:  tab === key ? "0 1px 6px rgba(26,26,46,.1)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
          TAB 1 — OWN SALES
      ════════════════════════════════════════════════ */}
      {tab === "own-sales" && (
        <div style={{ animation:"fadeUp .3s ease both" }}>
          <SectionTitle icon="💰" title="My Sales"
            subtitle="All invoices you have raised, filtered by period" />

          {/* Error banner */}
          {invError && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:RDL,
              border:`1px solid ${RDB}`, color:RD, fontSize:13, marginBottom:14,
              display:"flex", alignItems:"center", gap:8 }}>
              ⚠️ {invError}
            </div>
          )}

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px, 100%), 1fr))",
            gap:10, marginBottom:18 }}>
            <StatCard loading={invLoading} label="Total Invoices"
              value={filteredInvoices.length} color={INK} bg={inkA(.04)} border={inkA(.12)} />
            <StatCard loading={invLoading} label="Total Sales"
              value={"₹" + fmtShort(ownTotal)} sub={"₹" + fmt(ownTotal)}
              color={P} bg={PL} border={PB} />
            <StatCard loading={invLoading} label="Avg Invoice"
              value={"₹" + fmtShort(ownAvg)} color={B} bg={BL} border={BB} />
            <StatCard loading={invLoading} label="Cash Collected"
              value={"₹" + fmtShort(ownCash)} color={V} bg={VL} border={VB} />
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}
                width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke={inkA(.3)} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input placeholder="Search invoice #, customer…" value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                style={{ ...selS, paddingLeft:32, width:240 }} />
            </div>

            <select value={invYear} onChange={e => setInvYear(e.target.value)} style={selS}>
              <option value="ALL">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select value={invMonth} onChange={e => setInvMonth(e.target.value)} style={selS}>
              <option value="ALL">All Months</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>

            {!invLoading && (
              <span style={{ fontSize:11, color:inkA(.38), fontFamily:MONO }}>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}
                {ownCancelled > 0 && ` · ${ownCancelled} cancelled`}
              </span>
            )}

            <div style={{ marginLeft:"auto" }}>
              <ExcelExport
                data={exportSalesData}
                filename={`my-sales-${invYear}-${invMonth === "ALL" ? "all" : MONTHS[invMonth]}`}
                sheetName="My Sales"
              />
            </div>
          </div>

          {/* Invoice table */}
          <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${inkA(.08)}`,
            overflow:"hidden", boxShadow:"0 2px 14px rgba(26,26,46,.05)" }}>
            {invLoading ? <Spinner /> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:inkA(.03), borderBottom:`1px solid ${inkA(.07)}` }}>
                      {["","Invoice #","Date & Time","Customer","Items","Amount","Payment","Status"]
                        .map(h => <th key={h} style={thS}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr><td colSpan={8}>
                        <EmptyState icon="🧾"
                          title={invoices.length === 0 ? "No invoices found" : "No invoices match your filters"}
                          sub={invoices.length === 0
                            ? "Start creating invoices from Sales Desk — they'll appear here"
                            : "Try clearing your search or changing the date filter"}
                        />
                      </td></tr>
                    ) : (
                      filteredInvoices.flatMap((inv, i) => {
                        const isExp = expandedInv === inv._id;
                        const isCancelled = inv.status === "CANCELLED";
                        const rows = [
                          <tr key={inv._id} className="inv-row"
                            style={{ borderBottom: isExp ? "none" : `1px solid ${inkA(.042)}`,
                              background: i % 2 === 0 ? "#fff" : inkA(.012) }}>
                            <td style={{ padding:"8px 8px 8px 14px" }}>
                              <button type="button"
                                onClick={() => setExpandedInv(isExp ? null : inv._id)}
                                style={{ width:22, height:22, borderRadius:6,
                                  border:`1px solid ${inkA(.12)}`, background:"transparent",
                                  cursor:"pointer", fontSize:10, color:inkA(.4),
                                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {isExp ? "▲" : "▼"}
                              </button>
                            </td>
                            <td style={{ padding:"11px 14px" }}>
                              <span style={{ fontFamily:MONO, fontSize:12, fontWeight:700, color:B }}>
                                {inv.invoiceNo || "—"}
                              </span>
                            </td>
                            <td style={{ padding:"11px 14px", fontSize:12, color:inkA(.5) }}>
                              <div>{new Date(inv.createdAt).toLocaleDateString("en-IN",
                                { day:"numeric", month:"short", year:"numeric" })}</div>
                              <div style={{ fontFamily:MONO, fontSize:10, color:inkA(.35), marginTop:1 }}>
                                {new Date(inv.createdAt).toLocaleTimeString("en-IN",
                                  { hour:"2-digit", minute:"2-digit" })}
                              </div>
                            </td>
                            <td style={{ padding:"11px 14px" }}>
                              <div style={{ fontSize:13, fontWeight:600, color:INK }}>
                                {inv.customerName || "Walk-in"}
                              </div>
                              {inv.customerPhone && (
                                <div style={{ fontSize:11, color:inkA(.38), marginTop:1, fontFamily:MONO }}>
                                  {inv.customerPhone}
                                </div>
                              )}
                            </td>
                            <td style={{ padding:"11px 14px", fontSize:12, color:inkA(.55) }}>
                              {inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}
                            </td>
                            <td style={{ padding:"11px 14px" }}>
                              <div style={{ fontFamily:SERIF, fontSize:13, fontWeight:700,
                                color: isCancelled ? inkA(.35) : INK,
                                textDecoration: isCancelled ? "line-through" : "none" }}>
                                ₹{fmt(inv.grandTotal)}
                              </div>
                              {inv.discountAmount > 0 && (
                                <div style={{ fontSize:10, color:P, fontFamily:MONO, marginTop:1 }}>
                                  −₹{fmt(inv.discountAmount)} off
                                </div>
                              )}
                            </td>
                            <td style={{ padding:"11px 14px" }}>
                              <span style={{ padding:"2px 8px", borderRadius:99,
                                background: methodColor(inv.paymentMode)[1],
                                color: methodColor(inv.paymentMode)[0],
                                fontSize:"9.5px", fontFamily:MONO, fontWeight:700 }}>
                                {methodEmoji(inv.paymentMode)} {inv.paymentMode || "—"}
                              </span>
                            </td>
                            <td style={{ padding:"11px 14px" }}>
                              <Badge
                                label={isCancelled ? "Cancelled" : inv.status === "PENDING" ? "Pending" : "Paid"}
                                color={isCancelled ? RD : inv.status === "PENDING" ? AM : P}
                                bg={isCancelled ? RDL : inv.status === "PENDING" ? AML : PL}
                                border={isCancelled ? RDB : inv.status === "PENDING" ? AMB : PB}
                              />
                            </td>
                          </tr>,
                        ];

                        if (isExp) rows.push(
                          <tr key={inv._id + "_exp"} style={{ borderBottom:`1px solid ${inkA(.042)}` }}>
                            <td colSpan={8} style={{ padding:"0 14px 16px", background:inkA(.012) }}>
                              <div style={{ borderRadius:10, border:`1px solid ${inkA(.08)}`,
                                overflow:"hidden", background:"#fff" }}>
                                <div style={{ padding:"10px 14px", borderBottom:`1px solid ${inkA(.06)}`,
                                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontFamily:MONO, fontSize:"9.5px", color:inkA(.4),
                                    letterSpacing:".1em", textTransform:"uppercase" }}>Items in this invoice</span>
                                  {inv.notes && (
                                    <span style={{ fontSize:11, color:inkA(.45) }}>📝 {inv.notes}</span>
                                  )}
                                </div>
                                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                  <thead>
                                    <tr style={{ background:inkA(.02) }}>
                                      {["Product","Qty","Unit Price","Discount","Line Total"].map(h =>
                                        <th key={h} style={{ ...thS, fontSize:"8.5px" }}>{h}</th>)}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(inv.items || []).map((item, ii) => (
                                      <tr key={ii} style={{ borderTop:`1px solid ${inkA(.042)}` }}>
                                        <td style={{ padding:"9px 14px", fontSize:12,
                                          fontWeight:600, color:INK }}>
                                          {item.productName || item.name || "—"}
                                          {item.barcode && (
                                            <div style={{ fontSize:10, color:inkA(.35),
                                              fontFamily:MONO, marginTop:1 }}>{item.barcode}</div>
                                          )}
                                        </td>
                                        <td style={{ padding:"9px 14px", fontSize:12, color:inkA(.6) }}>
                                          {item.qty}
                                        </td>
                                        <td style={{ padding:"9px 14px", fontSize:12,
                                          color:inkA(.6), fontFamily:MONO }}>
                                          ₹{fmt(item.unitPrice || 0)}
                                        </td>
                                        <td style={{ padding:"9px 14px", fontSize:12, color:P, fontFamily:MONO }}>
                                          {item.discount > 0 ? `${item.discount}%` : "—"}
                                        </td>
                                        <td style={{ padding:"9px 14px", fontSize:13,
                                          fontWeight:700, color:P, fontFamily:MONO }}>
                                          ₹{fmt(item.total || (item.qty * (item.unitPrice || 0)))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {/* Totals footer */}
                                <div style={{ padding:"10px 14px", borderTop:`1px solid ${inkA(.06)}`,
                                  display:"flex", justifyContent:"flex-end", gap:20,
                                  background:inkA(.02), flexWrap:"wrap" }}>
                                  {[
                                    ["Subtotal", "₹" + fmt(inv.subtotal)],
                                    inv.discountAmount > 0 ? ["Discount", "−₹" + fmt(inv.discountAmount)] : null,
                                    inv.taxAmount > 0 ? ["Tax", "₹" + fmt(inv.taxAmount)] : null,
                                    ["Grand Total", "₹" + fmt(inv.grandTotal)],
                                  ].filter(Boolean).map(([k, v]) => (
                                    <div key={k} style={{ display:"flex", gap:8, alignItems:"center" }}>
                                      <span style={{ fontSize:11, color:inkA(.45) }}>{k}:</span>
                                      <span style={{ fontFamily:MONO, fontSize:13,
                                        fontWeight:700, color:INK }}>{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                        return rows;
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly bar chart */}
          {!invLoading && invoices.length > 0 && (
            <div style={{ marginTop:18, background:"#fff", borderRadius:18,
              border:`1px solid ${inkA(.08)}`, padding:"20px 24px",
              boxShadow:"0 2px 14px rgba(26,26,46,.05)" }}>
              <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:800,
                color:INK, marginBottom:16 }}>
                Monthly Breakdown {invYear !== "ALL" ? invYear : "— All Years"}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"flex-end",
                overflowX:"auto", paddingBottom:4 }}>
                {MONTHS.map((m, mi) => {
                  const val  = monthlyTotal(mi);
                  const pct  = Math.round((val / maxMonthly) * 100);
                  const isNow= mi === new Date().getMonth() &&
                    (invYear === "ALL" || Number(invYear) === new Date().getFullYear());
                  return (
                    <div key={m} style={{ flex:1, minWidth:32, display:"flex",
                      flexDirection:"column", alignItems:"center", gap:4 }}>
                      {val > 0 && (
                        <div style={{ fontFamily:MONO, fontSize:8, color:inkA(.4), whiteSpace:"nowrap" }}>
                          ₹{fmtShort(val)}
                        </div>
                      )}
                      <div style={{ width:"100%", height:80, display:"flex", alignItems:"flex-end" }}>
                        <div style={{
                          width:"100%", height:`${Math.max(pct, 3)}%`, minHeight:3,
                          borderRadius:"6px 6px 3px 3px", transition:"height .5s ease",
                          background: isNow ? `linear-gradient(180deg,${B},#0369a1)`
                                    : val > 0 ? `linear-gradient(180deg,${P},#047857)`
                                    : inkA(.07),
                          boxShadow: isNow ? `0 2px 8px ${BB}` : val > 0 ? `0 2px 8px ${PB}` : "none",
                        }} />
                      </div>
                      <div style={{ fontFamily:MONO, fontSize:8,
                        color: isNow ? B : inkA(.38),
                        fontWeight: isNow ? 700 : 500 }}>{m}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          TAB 2 — DAILY SUMMARY
      ════════════════════════════════════════════════ */}
      {tab === "daily" && (
        <div style={{ animation:"fadeUp .3s ease both" }}>
          <SectionTitle icon="📅" title="Daily Summary"
            subtitle="Your billing performance for any selected date" />

          {/* Date picker */}
          <div style={{ display:"flex", gap:10, alignItems:"center",
            marginBottom:18, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:MONO, fontSize:11, color:inkA(.4), letterSpacing:".08em" }}>DATE</span>
              <input type="date" value={dailyDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={e => setDailyDate(e.target.value)}
                style={{ ...selS, fontFamily:MONO, fontSize:13 }} />
            </div>
            {isToday && <Badge label="Today" color={P} bg={PL} border={PB} />}
            <div style={{ marginLeft:"auto" }}>
              <ExcelExport
                data={exportDailyData}
                filename={`daily-summary-${dailyDate}`}
                sheetName="Daily Summary"
              />
            </div>
          </div>

          {dailyError && (
            <div style={{ padding:"12px 16px", borderRadius:12, background:RDL,
              border:`1px solid ${RDB}`, color:RD, fontSize:13, marginBottom:14 }}>
              ⚠️ {dailyError}
            </div>
          )}

          {/* Day stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(160px, 100%), 1fr))",
            gap:10, marginBottom:18 }}>
            <StatCard loading={dailyLoading} label="Invoices Raised"
              value={dailyCount} color={INK} bg={inkA(.04)} border={inkA(.12)} />
            <StatCard loading={dailyLoading} label="Total Billed"
              value={"₹" + fmtShort(dailyTotal)} sub={"₹" + fmt(dailyTotal)}
              color={P} bg={PL} border={PB} />
            <StatCard loading={dailyLoading} label="Avg Invoice"
              value={"₹" + fmtShort(dailyAvg)} color={B} bg={BL} border={BB} />
            <StatCard loading={dailyLoading} label="Top Payment"
              value={Object.keys(dailyMethods).length
                ? Object.entries(dailyMethods).sort((a, b) => b[1] - a[1])[0][0]
                : "—"}
              color={V} bg={VL} border={VB} />
          </div>

          {/* Payment breakdown */}
          {!dailyLoading && Object.keys(dailyMethods).length > 0 && (
            <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${inkA(.08)}`,
              padding:"20px 24px", marginBottom:16,
              boxShadow:"0 2px 14px rgba(26,26,46,.05)" }}>
              <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:800,
                color:INK, marginBottom:14 }}>Payment Method Breakdown</div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {Object.entries(dailyMethods).sort((a, b) => b[1] - a[1])
                  .map(([method, amount]) => {
                    const pct = dailyTotal > 0 ? Math.round((amount / dailyTotal) * 100) : 0;
                    const [color, bg, border] = methodColor(method);
                    return (
                      <div key={method}>
                        <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:16 }}>{methodEmoji(method)}</span>
                            <span style={{ fontSize:13, fontWeight:600, color:INK }}>{method}</span>
                            <span style={{ fontFamily:MONO, fontSize:10, color:inkA(.38) }}>{pct}%</span>
                          </div>
                          <span style={{ fontFamily:SERIF, fontSize:15,
                            fontWeight:800, color }}>₹{fmt(amount)}</span>
                        </div>
                        <div style={{ height:6, borderRadius:99,
                          background:inkA(.06), overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`,
                            borderRadius:99, background:color,
                            transition:"width .6s ease",
                            boxShadow:`0 1px 4px ${border}` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Day invoice list */}
          <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${inkA(.08)}`,
            overflow:"hidden", boxShadow:"0 2px 14px rgba(26,26,46,.05)" }}>
            <div style={{ padding:"14px 20px", borderBottom:`1px solid ${inkA(.06)}`,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:SERIF, fontSize:14, fontWeight:800, color:INK }}>
                Invoices — {new Date(dailyDate + "T00:00:00").toLocaleDateString("en-IN",
                  { day:"numeric", month:"long", year:"numeric" })}
              </div>
              <span style={{ fontFamily:MONO, fontSize:11, color:inkA(.38) }}>
                {dailyCount} invoice{dailyCount !== 1 ? "s" : ""}
              </span>
            </div>

            {dailyLoading ? <Spinner /> : dailyInvoices.length === 0 ? (
              <EmptyState icon="📭"
                title="No invoices on this date"
                sub={isToday
                  ? "You haven't raised any invoices yet today."
                  : "No billing activity found for this date."} />
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:inkA(.03), borderBottom:`1px solid ${inkA(.07)}` }}>
                      {["Invoice #","Time","Customer","Items","Amount","Payment","Status"]
                        .map(h => <th key={h} style={thS}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyInvoices.map((inv, i) => {
                      const isCancelled = inv.status === "CANCELLED";
                      return (
                        <tr key={inv._id} className="inv-row"
                          style={{ borderBottom:`1px solid ${inkA(.042)}`,
                            background: i % 2 === 0 ? "#fff" : inkA(.012) }}>
                          <td style={{ padding:"11px 14px", fontFamily:MONO,
                            fontSize:12, fontWeight:700, color:B }}>
                            {inv.invoiceNo || "—"}
                          </td>
                          <td style={{ padding:"11px 14px", fontFamily:MONO,
                            fontSize:11, color:inkA(.45) }}>
                            {new Date(inv.createdAt).toLocaleTimeString("en-IN",
                              { hour:"2-digit", minute:"2-digit" })}
                          </td>
                          <td style={{ padding:"11px 14px", fontSize:13,
                            fontWeight:600, color:INK }}>
                            {inv.customerName || "Walk-in"}
                            {inv.customerPhone && (
                              <div style={{ fontSize:10, color:inkA(.38),
                                fontFamily:MONO, marginTop:1 }}>{inv.customerPhone}</div>
                            )}
                          </td>
                          <td style={{ padding:"11px 14px", fontSize:12, color:inkA(.55) }}>
                            {inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}
                          </td>
                          <td style={{ padding:"11px 14px", fontFamily:SERIF,
                            fontSize:13, fontWeight:700,
                            color: isCancelled ? inkA(.35) : INK,
                            textDecoration: isCancelled ? "line-through" : "none" }}>
                            ₹{fmt(inv.grandTotal)}
                          </td>
                          <td style={{ padding:"11px 14px" }}>
                            <span style={{ padding:"2px 8px", borderRadius:99,
                              background: methodColor(inv.paymentMode)[1],
                              color: methodColor(inv.paymentMode)[0],
                              fontSize:"9.5px", fontFamily:MONO, fontWeight:700 }}>
                              {methodEmoji(inv.paymentMode)} {inv.paymentMode || "—"}
                            </span>
                          </td>
                          <td style={{ padding:"11px 14px" }}>
                            <Badge
                              label={isCancelled ? "Cancelled" : inv.status === "PENDING" ? "Pending" : "Paid"}
                              color={isCancelled ? RD : inv.status === "PENDING" ? AM : P}
                              bg={isCancelled ? RDL : inv.status === "PENDING" ? AML : PL}
                              border={isCancelled ? RDB : inv.status === "PENDING" ? AMB : PB}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Day total row */}
                <div style={{ padding:"14px 20px", borderTop:`2px solid ${inkA(.07)}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  background:inkA(.02) }}>
                  <div>
                    <div style={{ fontFamily:MONO, fontSize:9, color:inkA(.38),
                      letterSpacing:".12em", textTransform:"uppercase" }}>Day Total</div>
                    <div style={{ fontSize:12, color:inkA(.45), marginTop:2 }}>
                      {dailyCount} invoice{dailyCount !== 1 ? "s" : ""} raised
                    </div>
                  </div>
                  <span style={{ fontFamily:SERIF, fontSize:26,
                    fontWeight:900, color:P, letterSpacing:"-.03em" }}>
                    ₹{fmt(dailyTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
