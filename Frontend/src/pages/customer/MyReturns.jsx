import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const ac  = "#b45309";
const acL = "rgba(180,83,9,.08)";
const acB = "rgba(180,83,9,.2)";
const G   = "#059669";
const GL  = "rgba(5,150,105,.08)";
const GB  = "rgba(5,150,105,.2)";
const B   = "#0284c7";
const BL  = "rgba(2,132,199,.08)";
const BB  = "rgba(2,132,199,.2)";
const RD  = "#dc2626";
const RDL = "rgba(239,68,68,.08)";
const RDB = "rgba(239,68,68,.2)";
const V   = "#7c3aed";
const VL  = "rgba(124,58,237,.08)";

const STATUS_STYLE = {
  PENDING:   { color: ac, bg: acL, border: acB,  label: "Pending",  icon: "⏳" },
  APPROVED:  { color: G,  bg: GL,  border: GB,   label: "Approved", icon: "✓"  },
  COMPLETED: { color: B,  bg: BL,  border: BB,   label: "Refunded", icon: "💵" },
  REJECTED:  { color: RD, bg: RDL, border: RDB,  label: "Rejected", icon: "✕"  },
};

const REFUND_ICONS = { CASH: "💵", CARD: "💳", UPI: "📲", STORE_CREDIT: "🏷️", OTHER: "💰" };

const REASONS = [
  "Defective product","Wrong item delivered","Excess order",
  "Customer changed mind","Damaged in transit","Expired / near expiry",
  "Quality issue","Size/spec mismatch","Other",
];

/* ── helpers ── */
function Label({ children, required }) {
  return (
    <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "rgba(26,26,46,.45)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: ".07em" }}>
      {children}{required && <span style={{ color: RD, marginLeft: 2 }}>*</span>}
    </label>
  );
}
const inp = { width: "100%", padding: "11px 14px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", fontSize: "13.5px", background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit", color: "#1a1a2e" };
const sel = { ...inp, cursor: "pointer" };

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 12px", borderRadius: "99px", background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: "11px", fontWeight: 700 }}>
      {s.icon} {s.label}
    </span>
  );
}

/* ── Print Receipt ── */
function PrintReceipt({ ret, onClose }) {
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=650");
    w.document.write(`<html><head><title>Return Receipt</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto;}
      h2{text-align:center;font-size:14px;margin:0 0 4px;}.center{text-align:center;}
      .line{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:3px 0;}
      .bold{font-weight:bold;}.green{color:#059669;}table{width:100%;border-collapse:collapse;}td{padding:3px 0;font-size:11px;}
      .stamp{text-align:center;border:2px solid #059669;border-radius:6px;padding:6px;margin:10px 0;color:#059669;font-weight:bold;font-size:13px;}
      .stamp-pending{border-color:#b45309;color:#b45309;}
    </style></head><body>
      <h2>RETURN RECEIPT</h2>
      <div class="center" style="font-size:11px;color:#555">EVARA · Customer Portal</div>
      <div class="line"></div>
      <div class="row"><span>Return #</span><span class="bold">${ret.returnNo}</span></div>
      <div class="row"><span>Date</span><span>${new Date(ret.createdAt).toLocaleString("en-IN")}</span></div>
      <div class="row"><span>Customer</span><span>${ret.customerName || "—"}</span></div>
      ${ret.invoiceNo ? `<div class="row"><span>Invoice #</span><span>${ret.invoiceNo}</span></div>` : ""}
      <div class="row"><span>Reason</span><span>${ret.reason || "—"}</span></div>
      <div class="line"></div>
      <table>
        <tr><td class="bold">Item</td><td class="bold" style="text-align:center">Qty</td><td class="bold" style="text-align:right">Amount</td></tr>
        ${(ret.items || []).map(i => `<tr><td>${i.productName}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">&#8377;${(i.total || 0).toLocaleString("en-IN")}</td></tr>`).join("")}
      </table>
      <div class="line"></div>
      <div class="row bold"><span>Total Refund</span><span class="green">&#8377;${(ret.returnAmount || 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span>Refund Method</span><span>${ret.refundMethod}</span></div>
      <div class="line"></div>
      ${ret.status === "COMPLETED" ? `<div class="stamp">&#10003; REFUND ISSUED</div>` : `<div class="stamp stamp-pending">&#9203; ${STATUS_STYLE[ret.status]?.label || ret.status}</div>`}
      <div class="line"></div>
      <div class="center" style="font-size:10px;color:#888">Thank you for shopping with us.<br/>Keep this receipt for your records.</div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", maxWidth: "min(400px, 100%)", width: "100%", boxShadow: "0 24px 80px rgba(26,26,46,.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "17px", fontWeight: 800, color: "#1a1a2e", marginBottom: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
          🧾 Return Receipt
          <span style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{ret.returnNo}</span>
        </div>
        {/* Receipt Preview */}
        <div style={{ background: "rgba(26,26,46,.02)", borderRadius: "12px", border: "1px dashed rgba(26,26,46,.15)", padding: "16px", fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontWeight: 800, fontSize: "13px" }}>RETURN RECEIPT</div>
            <div style={{ color: "rgba(26,26,46,.4)", fontSize: "10px" }}>EVARA · Customer Portal</div>
          </div>
          <div style={{ borderTop: "1px dashed rgba(26,26,46,.2)", margin: "8px 0" }} />
          {[[`Return #`, ret.returnNo], [`Date`, new Date(ret.createdAt).toLocaleDateString("en-IN")], [`Customer`, ret.customerName || "—"], ret.invoiceNo && [`Invoice #`, ret.invoiceNo], [`Reason`, ret.reason || "—"]].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span style={{ color: "rgba(26,26,46,.45)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed rgba(26,26,46,.2)", margin: "8px 0" }} />
          {(ret.items || []).map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px", fontSize: "11px" }}>
              <span>{item.productName} ×{item.qty}</span>
              <span style={{ fontWeight: 600 }}>₹{(item.total || 0).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed rgba(26,26,46,.2)", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
            <span>Total Refund</span>
            <span style={{ color: G }}>₹{(ret.returnAmount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ textAlign: "center", marginTop: "10px", padding: "7px", borderRadius: "7px", border: `2px solid ${ret.status === "COMPLETED" ? G : ac}`, color: ret.status === "COMPLETED" ? G : ac, fontWeight: 800 }}>
            {ret.status === "COMPLETED" ? "✓ REFUND ISSUED" : "⏳ " + (STATUS_STYLE[ret.status]?.label || ret.status)}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
          <button onClick={handlePrint} style={{ flex: 1, padding: "10px", borderRadius: "11px", border: `1.5px solid ${BB}`, background: BL, color: B, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>🖨️ Print Receipt</button>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: "11px", border: "1.5px solid rgba(26,26,46,.13)", background: "transparent", color: "rgba(26,26,46,.5)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function MyReturns() {
  const { user } = useAuth();

  const [tab, setTab]           = useState("list");
  const [returns, setReturns]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expanded, setExpanded] = useState(null);
  const [printRet, setPrintRet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess]   = useState("");
  const [errors, setErrors]     = useState({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError]     = useState("");

  const [form, setForm] = useState({
    invoiceLookup: "", invoiceNo: "",
    items: [{ productName: "", qty: "1", unitPrice: "", reason: "" }],
    refundMethod: "CASH", reason: "", notes: "",
  });

  /* ── data ── */
  const load = () => {
    setLoading(true);
    axiosInstance.get("/returns")
      .then(r => setReturns(Array.isArray(r.data) ? r.data : []))
      .catch(() => setReturns([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  /* ── form helpers ── */
  const set  = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: "" })); };
  const setItem = (idx, k, v) => setForm(p => { const items = [...p.items]; items[idx] = { ...items[idx], [k]: v }; return { ...p, items }; });
  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { productName: "", qty: "1", unitPrice: "", reason: "" }] }));
  const removeItem = idx => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  /* ── invoice lookup ── */
  const handleLookup = async () => {
    if (!form.invoiceLookup.trim()) { setLookupError("Enter an invoice number"); return; }
    setLookupLoading(true); setLookupError("");
    try {
      const r = await axiosInstance.get("/invoices", { params: { invoiceNo: form.invoiceLookup.trim() } });
      const list = Array.isArray(r.data) ? r.data : (r.data?.invoices || []);
      const inv  = list.find(i => (i.invoiceNo || "").toLowerCase() === form.invoiceLookup.trim().toLowerCase()) || list[0];
      if (!inv) { setLookupError("Invoice not found. Fill in details manually."); return; }
      const items = (inv.items || []).map(i => ({ productName: i.productName || i.product?.name || "", qty: "1", unitPrice: String(i.unitPrice || i.price || 0), reason: "" }));
      setForm(p => ({ ...p, invoiceNo: inv.invoiceNo || p.invoiceLookup, items: items.length ? items : p.items }));
    } catch { setLookupError("Could not load invoice. Fill details manually."); }
    finally   { setLookupLoading(false); }
  };

  /* ── submit ── */
  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.items[0]?.productName.trim()) errs.product = "At least one product required";
    if (!form.reason.trim()) errs.reason = "Return reason required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true); setApiError("");
    try {
      const payload = {
        customerName:  user?.name  || "Customer",
        customerPhone: user?.phone || undefined,
        customerEmail: user?.email || undefined,
        invoiceNo:     form.invoiceNo || undefined,
        refundMethod:  form.refundMethod,
        reason:        form.reason,
        notes:         form.notes,
        items: form.items.filter(i => i.productName.trim()).map(i => ({
          productName: i.productName,
          qty:         Number(i.qty) || 1,
          unitPrice:   Number(i.unitPrice) || 0,
          total:       (Number(i.qty) || 1) * (Number(i.unitPrice) || 0),
          reason:      i.reason || form.reason,
        })),
      };
      const res = await axiosInstance.post("/returns", payload);
      setSuccess("Return request submitted! Our team will review it shortly.");
      setForm({ invoiceLookup: "", invoiceNo: "", items: [{ productName: "", qty: "1", unitPrice: "", reason: "" }], refundMethod: "CASH", reason: "", notes: "" });
      setTimeout(() => setSuccess(""), 5000);
      setTab("list"); load();
      if (res.data) setTimeout(() => setPrintRet(res.data), 600);
    } catch (err) { setApiError(err?.response?.data?.message || "Failed to submit return request."); }
    finally       { setSubmitting(false); }
  };

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    let rows = returns;
    if (statusFilter !== "ALL") rows = rows.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.returnNo || "").toLowerCase().includes(q) ||
        (r.invoiceNo || "").toLowerCase().includes(q) ||
        (r.reason    || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [returns, search, statusFilter]);

  const totalRefunded = returns.filter(r => r.status === "COMPLETED").reduce((s, r) => s + (r.returnAmount || 0), 0);

  const stats = [
    { label: "Total Returns",  value: returns.length,                                                    color: "#1a1a2e", bg: "rgba(26,26,46,.06)",  border: "rgba(26,26,46,.14)" },
    { label: "Pending Review", value: returns.filter(r => r.status === "PENDING").length,                color: ac,       bg: acL,                    border: acB },
    { label: "Approved",       value: returns.filter(r => r.status === "APPROVED").length,               color: G,        bg: GL,                     border: GB  },
    { label: "Refunded",       value: returns.filter(r => r.status === "COMPLETED").length,              color: B,        bg: BL,                     border: BB  },
    { label: "Total Refunded", value: `₹${totalRefunded.toLocaleString("en-IN")}`,                      color: V,        bg: VL,                     border: "rgba(124,58,237,.2)" },
  ];

  /* ══ render ══ */
  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

      {printRet && <PrintReceipt ret={printRet} onClose={() => setPrintRet(null)} />}

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>My Returns</h1>
        <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", marginTop: "5px" }}>Submit return requests and track your refund status</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(140px, 100%), 1fr))", gap: "12px", marginBottom: "22px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: `1px solid ${s.border}`, padding: "16px 18px", boxShadow: "0 2px 10px rgba(26,26,46,.04)" }}>
            <div style={{ fontSize: "24px", fontWeight: 900, color: s.color, fontFamily: "'Fraunces',serif" }}>{s.value}</div>
            <div style={{ fontSize: "9.5px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: "5px", fontFamily: "'DM Mono',monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "12px", width: "fit-content", marginBottom: "20px" }}>
        {[["list", "📋 My Returns"], ["new", "➕ Request Return"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} type="button"
            style={{ padding: "8px 20px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all .18s", background: tab === key ? "#fff" : "transparent", color: tab === key ? "#1a1a2e" : "rgba(26,26,46,.45)", boxShadow: tab === key ? "0 1px 6px rgba(26,26,46,.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── LIST TAB ─── */}
      {tab === "list" && (
        <>
          {/* Search & Filter */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input placeholder="Search by return #, invoice, reason…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inp, paddingLeft: "32px", width: "270px", padding: "8px 12px 8px 32px" }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ ...sel, padding: "8px 12px", width: "auto" }}>
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={load} style={{ padding: "8px 14px", borderRadius: "9px", border: "1.5px solid rgba(26,26,46,.13)", background: "#fff", cursor: "pointer", fontSize: "13px", color: "rgba(26,26,46,.6)" }}>↻ Refresh</button>
            <span style={{ fontSize: "11px", color: "rgba(26,26,46,.38)", fontFamily: "'DM Mono',monospace" }}>{filtered.length} records</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.32)", fontSize: "13px" }}>Loading your returns…</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", padding: "60px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "rgba(26,26,46,.45)", marginBottom: "8px" }}>No returns found</div>
              <div style={{ fontSize: "13px", color: "rgba(26,26,46,.32)", marginBottom: "20px" }}>Need to return something? Submit a new request.</div>
              <button onClick={() => setTab("new")} style={{ padding: "10px 22px", borderRadius: "11px", border: `1.5px solid ${acB}`, background: acL, color: ac, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                ➕ Request a Return
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filtered.map(r => {
                const isExp = expanded === r._id;
                const s = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                return (
                  <div key={r._id} style={{ background: "#fff", borderRadius: "16px", border: `1px solid ${isExp ? s.border : "rgba(26,26,46,.08)"}`, boxShadow: "0 2px 12px rgba(26,26,46,.05)", overflow: "hidden", transition: "border-color .2s" }}>
                    {/* Card Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : r._id)}>
                      {/* Return # */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: RD }}>{r.returnNo}</span>
                          <StatusBadge status={r.status} />
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)", marginTop: "4px" }}>
                          {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {r.invoiceNo && <> · Invoice <span style={{ fontFamily: "'DM Mono',monospace" }}>{r.invoiceNo}</span></>}
                        </div>
                      </div>
                      {/* Amount */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: r.status === "COMPLETED" ? G : "#1a1a2e", fontFamily: "'Fraunces',serif" }}>₹{(r.returnAmount || 0).toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: "10px", color: "rgba(26,26,46,.38)", marginTop: "2px" }}>{REFUND_ICONS[r.refundMethod]} {r.refundMethod}</div>
                      </div>
                      {/* Expand toggle */}
                      <div style={{ fontSize: "12px", color: "rgba(26,26,46,.35)", marginLeft: "4px" }}>{isExp ? "▲" : "▼"}</div>
                    </div>

                    {/* Expanded Details */}
                    {isExp && (
                      <div style={{ borderTop: "1px solid rgba(26,26,46,.07)", padding: "16px 20px", background: "rgba(26,26,46,.012)" }}>
                        {/* Reason + status message */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                          <div style={{ flex: 1, minWidth: "180px", background: "#fff", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", padding: "12px 14px" }}>
                            <div style={{ fontSize: "10px", color: "rgba(26,26,46,.38)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "5px" }}>Reason</div>
                            <div style={{ fontSize: "13px", color: "#1a1a2e", fontWeight: 500 }}>{r.reason || "—"}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: "180px", background: s.bg, borderRadius: "10px", border: `1px solid ${s.border}`, padding: "12px 14px" }}>
                            <div style={{ fontSize: "10px", color: s.color, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "5px", fontWeight: 700 }}>Status</div>
                            <div style={{ fontSize: "13px", color: s.color, fontWeight: 700 }}>
                              {r.status === "PENDING"   && "Your return is under review by our team."}
                              {r.status === "APPROVED"  && "Return approved! Refund is being processed."}
                              {r.status === "COMPLETED" && "Refund has been issued successfully."}
                              {r.status === "REJECTED"  && "This return request was not approved."}
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", marginBottom: "12px" }}>
                          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(26,26,46,.06)", fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em" }}>Items Returned</div>
                          {(r.items || []).map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderTop: i > 0 ? "1px solid rgba(26,26,46,.05)" : "none" }}>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{item.productName}</div>
                                <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>Qty: {item.qty} · ₹{(item.unitPrice || 0).toLocaleString("en-IN")} each</div>
                              </div>
                              <div style={{ fontWeight: 700, color: G, fontFamily: "'DM Mono',monospace" }}>₹{(item.total || 0).toLocaleString("en-IN")}</div>
                            </div>
                          ))}
                        </div>

                        {r.notes && (
                          <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)", padding: "8px 12px", background: "#fff", borderRadius: "8px", border: "1px solid rgba(26,26,46,.07)", marginBottom: "12px" }}>
                            📝 {r.notes}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => setPrintRet(r)} style={{ padding: "8px 16px", borderRadius: "9px", border: `1.5px solid ${BB}`, background: BL, color: B, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                            🧾 View Receipt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── NEW RETURN TAB ─── */}
      {tab === "new" && (
        <div style={{ maxWidth: "min(640px, 100%)" }}>
          {success && (
            <div style={{ padding: "14px 18px", borderRadius: "12px", background: GL, border: `1px solid ${GB}`, color: G, fontSize: "13px", fontWeight: 600, marginBottom: "18px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "3px" }}>Return request submitted!</div>
                <div style={{ fontWeight: 400, opacity: 0.8 }}>Our team will review and get back to you soon. You'll see it in the returns list.</div>
              </div>
            </div>
          )}
          {apiError && (
            <div style={{ padding: "12px 16px", borderRadius: "10px", background: RDL, border: `1px solid ${RDB}`, color: RD, fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* Info box */}
          <div style={{ padding: "14px 18px", borderRadius: "12px", background: acL, border: `1px solid ${acB}`, marginBottom: "22px", fontSize: "13px", color: ac }}>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>📋 How returns work</div>
            <div style={{ opacity: 0.8, lineHeight: 1.6 }}>Submit your return request below. Our staff will review it within 1–2 business days. Once approved, your refund will be processed via your chosen method.</div>
          </div>

          <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", padding: "24px", boxShadow: "0 2px 14px rgba(26,26,46,.05)" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a2e", marginBottom: "20px" }}>New Return Request</div>

            {/* Invoice Lookup */}
            <div style={{ background: BL, border: `1px solid ${BB}`, borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: B, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "10px", fontFamily: "'DM Mono',monospace" }}>🔍 Auto-fill from Invoice</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input placeholder="Enter Invoice # (e.g. INV-0042)" value={form.invoiceLookup}
                  onChange={e => { setForm(p => ({ ...p, invoiceLookup: e.target.value })); setLookupError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLookup()}
                  style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={handleLookup} disabled={lookupLoading}
                  style={{ padding: "10px 16px", borderRadius: "10px", border: `1.5px solid ${BB}`, background: "#fff", color: B, fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {lookupLoading ? "Searching…" : "Load Invoice"}
                </button>
              </div>
              {lookupError && <div style={{ color: ac, fontSize: "11px", marginTop: "6px" }}>⚠ {lookupError}</div>}
              <div style={{ fontSize: "11px", color: "rgba(26,26,46,.38)", marginTop: "6px" }}>Enter your invoice number to auto-fill product details</div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Invoice # */}
              <div style={{ marginBottom: "14px" }}>
                <Label>Invoice # (reference)</Label>
                <input placeholder="INV-XXXX (leave blank if unknown)" value={form.invoiceNo} onChange={set("invoiceNo")} style={inp} />
              </div>

              {/* Reason */}
              <div style={{ marginBottom: "14px" }}>
                <Label required>Return Reason</Label>
                <select value={form.reason} onChange={set("reason")}
                  style={{ ...sel, borderColor: errors.reason ? "rgba(239,68,68,.5)" : undefined }}>
                  <option value="">— Select a reason —</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.reason && <div style={{ color: RD, fontSize: "11px", marginTop: "5px" }}>{errors.reason}</div>}
              </div>

              {/* Items */}
              <div style={{ marginBottom: "14px" }}>
                <Label required>Items to Return</Label>
                {errors.product && <div style={{ color: RD, fontSize: "11px", marginBottom: "8px" }}>{errors.product}</div>}
                <div style={{ background: "rgba(26,26,46,.02)", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", padding: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "6px", marginBottom: "6px" }}>
                    {["Product Name", "Qty", "Unit Price (₹)", ""].map((h, i) => (
                      <div key={i} style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.35)", textTransform: "uppercase", letterSpacing: ".1em" }}>{h}</div>
                    ))}
                  </div>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "6px", marginBottom: "6px", alignItems: "start" }}>
                      <input placeholder="Product name" value={item.productName} onChange={e => setItem(idx, "productName", e.target.value)} style={{ ...inp, fontSize: "13px" }} />
                      <input type="number" placeholder="Qty" min="1" value={item.qty} onChange={e => setItem(idx, "qty", e.target.value)} style={{ ...inp, fontSize: "13px" }} />
                      <input type="number" placeholder="0.00" min="0" value={item.unitPrice} onChange={e => setItem(idx, "unitPrice", e.target.value)} style={{ ...inp, fontSize: "13px" }} />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)}
                          style={{ height: "44px", padding: "0 10px", borderRadius: "9px", border: `1px solid ${RDB}`, background: RDL, color: RD, cursor: "pointer", fontSize: "16px" }}>×</button>
                      )}
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <button type="button" onClick={addItem}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: "1.5px dashed rgba(26,26,46,.18)", background: "transparent", color: "rgba(26,26,46,.5)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      + Add Item
                    </button>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a2e" }}>
                      Total: <span style={{ color: G }}>₹{form.items.reduce((s, i) => s + ((Number(i.qty) || 0) * (Number(i.unitPrice) || 0)), 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Method */}
              <div style={{ marginBottom: "14px" }}>
                <Label>Preferred Refund Method</Label>
                <select value={form.refundMethod} onChange={set("refundMethod")} style={sel}>
                  <option value="CASH">💵 Cash Refund</option>
                  <option value="UPI">📲 UPI / Bank Transfer</option>
                  <option value="CARD">💳 Card Refund</option>
                  <option value="STORE_CREDIT">🏷️ Store Credit</option>
                  <option value="OTHER">💰 Other</option>
                </select>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px" }}>
                <Label>Additional Notes</Label>
                <textarea placeholder="Any additional details about the return…" value={form.notes} onChange={set("notes")}
                  style={{ ...inp, minHeight: "80px", resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: submitting ? "rgba(26,26,46,.2)" : `linear-gradient(135deg, ${ac}, #92400e)`, color: submitting ? "rgba(26,26,46,.4)" : "#fff", fontSize: "14px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", transition: "all .2s", boxShadow: submitting ? "none" : `0 4px 16px ${acB}` }}>
                  {submitting ? "Submitting…" : "📤 Submit Return Request"}
                </button>
                <button type="button" onClick={() => setTab("list")}
                  style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.13)", background: "transparent", color: "rgba(26,26,46,.5)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
