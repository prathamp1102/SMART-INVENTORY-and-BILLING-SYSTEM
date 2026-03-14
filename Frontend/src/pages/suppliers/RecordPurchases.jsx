import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import { IS as ISBase } from "../../components/forms/FormStyles";
import { getSuppliers } from "../../services/productService";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";
import PaymentInfoPanel from "../../components/ui/PaymentInfoPanel";
import ExcelExport from "../../components/ui/ExcelExport";

const P = "#059669", PL = "rgba(5,150,105,.08)", PB = "rgba(5,150,105,.2)";
const B = "#0284c7", BL = "rgba(2,132,199,.08)", BB = "rgba(2,132,199,.2)";
const AM = "#b45309", AML = "rgba(180,83,9,.08)", AMB = "rgba(180,83,9,.2)";
const RD = "#dc2626", RDL = "rgba(239,68,68,.08)", RDB = "rgba(239,68,68,.2)";
const V = "#7c3aed", VL = "rgba(124,58,237,.08)", VB = "rgba(124,58,237,.2)";

const IS = { ...ISBase, height: "42px", marginBottom: "0" };

const PAY_MODES = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"];
const thS = { padding: "11px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" };

function PayModeChip({ mode }) {
  const MAP = { CASH: [P, PL, PB], CARD: ["#6366f1","rgba(99,102,241,.08)","rgba(99,102,241,.25)"], BANK_TRANSFER: [B, BL, BB], CHEQUE: [AM, AML, AMB], UPI: [V, VL, VB], OTHER: ["rgba(26,26,46,.5)", "rgba(26,26,46,.06)", "rgba(26,26,46,.15)"] };
  const [color, bg, border] = MAP[mode] || MAP.OTHER;
  return <span style={{ padding: "2px 9px", borderRadius: "99px", background: bg, border: `1px solid ${border}`, color, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{mode?.replace("_", " ")}</span>;
}

/* ── Tab: Record new purchase ──────────────────────────── */
function RecordPurchaseForm({ suppliers, onSuccess }) {
  const [pos, setPOs] = useState([]);
  const [form, setForm] = useState({ supplier: "", purchaseOrder: "", amount: "", paymentMode: "CASH", referenceNo: "", notes: "", paidOn: new Date().toISOString().split("T")[0] });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.supplier) { setPOs([]); return; }
    axiosInstance.get("/purchase-orders").then(r => {
      setPOs(r.data.filter(po => String(po.supplier?._id || po.supplier) === form.supplier && po.status !== "CANCELLED"));
    }).catch(() => {});
  }, [form.supplier]);

  const setF = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: "" })); };
  const selectedPO = useMemo(() => pos.find(p => p._id === form.purchaseOrder), [pos, form.purchaseOrder]);
  const showPanel = form.paymentMode === "UPI" || form.paymentMode === "BANK_TRANSFER" || form.paymentMode === "CARD";

  const validate = () => {
    const e = {};
    if (!form.supplier) e.supplier = "Supplier is required";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      await axiosInstance.post("/supplier-payments", {
        supplier: form.supplier,
        purchaseOrder: form.purchaseOrder || undefined,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo || undefined,
        notes: form.notes || undefined,
        paidOn: form.paidOn,
      });
      setForm({ supplier: "", purchaseOrder: "", amount: "", paymentMode: "CASH", referenceNo: "", notes: "", paidOn: new Date().toISOString().split("T")[0] });
      onSuccess();
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to record purchase.");
    } finally { setLoading(false); }
  };

  const fStyle = {
    width: "100%", height: "46px", borderRadius: "12px",
    border: "1.5px solid rgba(26,26,46,.11)", outline: "none",
    padding: "0 14px", fontSize: "14px", fontFamily: "'Figtree',sans-serif",
    color: "#1a1a2e", background: "#fafaf9", boxSizing: "border-box",
    transition: "border-color .18s, box-shadow .18s",
  };
  const lStyle = {
    display: "block", fontSize: "10px", fontWeight: 700,
    fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.45)",
    letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "6px",
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: showPanel ? "1fr 1fr" : "1fr", gap: "20px", alignItems: "start", maxWidth: showPanel ? "960px" : "560px" }}>

      {/* ── LEFT: Form ──────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.06)" }}>
        {/* Card header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(26,26,46,.06)", background: "linear-gradient(135deg,rgba(5,150,105,.04),rgba(2,132,199,.03))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "11px", background: `linear-gradient(135deg,${P},#047857)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(5,150,105,.25)" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 800, color: "#1a1a2e" }}>Record a Purchase</div>
              <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "1px" }}>Record payment made to a supplier</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "22px 24px" }}>
          {apiError && (
            <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)", color: RD, fontSize: "12.5px", marginBottom: "16px" }}>
              {apiError}
            </div>
          )}

          {/* Supplier + PO row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={lStyle}>Supplier *</label>
              <select value={form.supplier} onChange={setF("supplier")} style={{ ...fStyle, borderColor: errors.supplier ? "rgba(239,68,68,.4)" : undefined, cursor: "pointer" }}>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}{s.companyName ? ` (${s.companyName})` : ""}</option>)}
              </select>
              {errors.supplier && <div style={{ color: RD, fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "4px" }}>{errors.supplier}</div>}
            </div>
            <div>
              <label style={lStyle}>Link PO <span style={{ opacity: .5, fontWeight: 400 }}>(optional)</span></label>
              <select value={form.purchaseOrder} onChange={setF("purchaseOrder")} style={{ ...fStyle, opacity: !form.supplier ? 0.45 : 1, cursor: !form.supplier ? "not-allowed" : "pointer" }} disabled={!form.supplier}>
                <option value="">— No PO linked —</option>
                {pos.map(po => <option key={po._id} value={po._id}>{po.poNumber} · ₹{(po.dueAmount || 0).toLocaleString("en-IN")} due</option>)}
              </select>
            </div>
          </div>

          {/* PO preview strip */}
          {selectedPO && (
            <div style={{ padding: "12px 16px", borderRadius: "12px", background: BL, border: `1.5px solid ${BB}`, marginBottom: "14px", display: "flex", gap: "20px", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: B, letterSpacing: ".12em", textTransform: "uppercase" }}>PO</div>
                <div style={{ fontWeight: 800, color: B, fontSize: "13px", marginTop: "1px" }}>{selectedPO.poNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", letterSpacing: ".1em", textTransform: "uppercase" }}>Total</div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1a1a2e" }}>₹{(selectedPO.totalAmount || 0).toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", letterSpacing: ".1em", textTransform: "uppercase" }}>Due</div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: RD }}>₹{(selectedPO.dueAmount || 0).toLocaleString("en-IN")}</div>
              </div>
              <button onClick={() => setForm(p => ({ ...p, amount: selectedPO.dueAmount || "" }))}
                style={{ marginLeft: "auto", padding: "6px 13px", borderRadius: "9px", border: `1.5px solid ${BB}`, background: "#fff", color: B, fontSize: "11.5px", fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>
                Auto-fill Due
              </button>
            </div>
          )}

          {/* Amount + Payment Mode */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={lStyle}>Amount Paid (₹) *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", fontWeight: 700, color: "rgba(26,26,46,.3)", fontFamily: "'DM Mono',monospace" }}>₹</span>
                <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={setF("amount")}
                  style={{ ...fStyle, paddingLeft: "28px", borderColor: errors.amount ? "rgba(239,68,68,.4)" : undefined, fontFamily: "'DM Mono',monospace", fontSize: "15px", fontWeight: 700 }} />
              </div>
              {errors.amount && <div style={{ color: RD, fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "4px" }}>{errors.amount}</div>}
            </div>
            <div>
              <label style={lStyle}>Payment Mode</label>
              <div style={{ position: "relative" }}>
                <select value={form.paymentMode} onChange={setF("paymentMode")} style={{ ...fStyle, cursor: "pointer", paddingRight: "36px", appearance: "none" }}>
                  {PAY_MODES.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                </select>
                <svg style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.4)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>

          {/* Date + Reference */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={lStyle}>Payment Date</label>
              <input type="date" value={form.paidOn} onChange={setF("paidOn")} style={fStyle} />
            </div>
            <div>
              <label style={lStyle}>Reference / Cheque No. <span style={{ opacity: .5, fontWeight: 400 }}>(optional)</span></label>
              <input placeholder="e.g. TXN123456" value={form.referenceNo} onChange={setF("referenceNo")} style={fStyle} />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "20px" }}>
            <label style={lStyle}>Notes <span style={{ opacity: .5, fontWeight: 400 }}>(optional)</span></label>
            <textarea value={form.notes} onChange={setF("notes")} placeholder="Additional notes…" rows={2}
              style={{ ...fStyle, height: "auto", padding: "11px 14px", resize: "vertical", lineHeight: 1.5 }} />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", height: "50px", borderRadius: "14px", border: "none",
            cursor: loading ? "wait" : "pointer",
            background: loading ? "rgba(26,26,46,.08)" : `linear-gradient(135deg,${P},#047857)`,
            color: loading ? "rgba(26,26,46,.3)" : "#fff",
            fontSize: "14px", fontWeight: 800, fontFamily: "'Figtree',sans-serif",
            boxShadow: loading ? "none" : "0 4px 20px rgba(5,150,105,.28)",
            transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            {loading ? (
              <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(26,26,46,.2)", borderTopColor: P, animation: "spin .7s linear infinite" }} />Processing…</>
            ) : (
              <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Record Purchase</>
            )}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Payment Panel ─────────────────────── */}
      {showPanel && (
        <div style={{ position: "sticky", top: "24px" }}>
          <div style={{ marginBottom: "10px", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase" }}>
            Payment Details
          </div>
          <PaymentInfoPanel method={form.paymentMode} amount={parseFloat(form.amount) || 0} />
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
export default function RecordPurchases() {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("history");

  const loadPayments = () => {
    setLoading(true);
    axiosInstance.get("/supplier-payments").then(r => setPayments(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    getSuppliers().then(s => setSuppliers(s.filter(x => x.status === "ACTIVE"))).catch(() => {});
    loadPayments();
  }, []);

  const onSuccess = () => { setTab("history"); loadPayments(); };

  const filtered = useMemo(() => payments.filter(p => {
    const q = search.toLowerCase();
    return !q || p.supplier?.supplierName?.toLowerCase().includes(q) || p.referenceNo?.toLowerCase().includes(q) || p.purchaseOrder?.poNumber?.toLowerCase().includes(q);
  }), [payments, search]);

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const COLS = ["Date", "Supplier", "Linked PO", "Amount", "Mode", "Reference", "Actions"];

  return (
    <PageShell title="Record Purchases" subtitle="Record payments made to suppliers">
      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", background: "#fff", borderRadius: "12px", border: "1px solid rgba(26,26,46,.08)", padding: "4px", width: "fit-content" }}>
        {[["history", "Payment History"], ["record", "Record New Payment"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 18px", borderRadius: "9px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all .15s", background: tab === k ? `linear-gradient(135deg,${P},#047857)` : "transparent", color: tab === k ? "#fff" : "rgba(26,26,46,.5)" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "record" ? (
        <RecordPurchaseForm suppliers={suppliers} onSuccess={onSuccess} />
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ padding: "9px 17px", borderRadius: "12px", background: PL, border: `1.5px solid ${PB}`, display: "flex", gap: "9px", alignItems: "center" }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 900, color: P }}>{payments.length}</span>
              <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>Payments</span>
            </div>
            <div style={{ padding: "9px 17px", borderRadius: "12px", background: BL, border: `1.5px solid ${BB}`, display: "flex", gap: "9px", alignItems: "center" }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 900, color: B }}>₹{totalPaid.toLocaleString("en-IN")}</span>
              <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>Total Paid</span>
            </div>
          </div>

          {/* Toolbar */}
          <div style={{ background: "#fff", borderRadius: "14px", padding: "13px 18px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input placeholder="Search supplier or reference…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...ISBase, height: "36px", paddingLeft: "32px", width: "220px", marginBottom: 0 }} />
            </div>
            <span style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{filtered.length} payments</span>
            <button onClick={loadPayments} style={{ padding: "7px 11px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", fontSize: "14px", cursor: "pointer" }}>↻</button>
            <div style={{ marginLeft: "auto" }}>
              <ExcelExport data={filtered} filename="supplier_payments" sheetName="Payments" accent={{ color: P, light: PL, border: PB }}
                columns={[
                  { key: "supplier.supplierName", label: "Supplier" },
                  { key: "purchaseOrder.poNumber", label: "PO Number" },
                  { key: "amount", label: "Amount (₹)" },
                  { key: "paymentMode", label: "Mode" },
                  { key: "referenceNo", label: "Reference" },
                  { key: "paidOn", label: "Date" },
                ]} />
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
                    {COLS.map(h => <th key={h} style={thS}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={COLS.length} style={{ padding: "60px", textAlign: "center", color: "rgba(26,26,46,.35)", fontSize: "13px" }}>Loading payments…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={COLS.length} style={{ padding: "60px", textAlign: "center" }}>
                      <div style={{ fontSize: "32px", marginBottom: "10px" }}>💳</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,46,.5)" }}>No payments recorded yet</div>
                    </td></tr>
                  ) : filtered.map(pay => (
                    <tr key={pay._id} style={{ borderBottom: "1px solid rgba(26,26,46,.042)", transition: "background .12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.016)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.5)" }}>
                        {new Date(pay.paidOn).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>{pay.supplier?.supplierName || "—"}</div>
                        {pay.supplier?.companyName && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{pay.supplier.companyName}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {pay.purchaseOrder?.poNumber
                          ? <span style={{ padding: "2px 9px", borderRadius: "99px", background: BL, border: `1px solid ${BB}`, color: B, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{pay.purchaseOrder.poNumber}</span>
                          : <span style={{ color: "rgba(26,26,46,.25)", fontSize: "11px" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: P }}>₹{(pay.amount || 0).toLocaleString("en-IN")}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}><PayModeChip mode={pay.paymentMode} /></td>
                      <td style={{ padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.5)" }}>{pay.referenceNo || "—"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <button onClick={async () => {
                          if (!window.confirm("Delete this payment record?")) return;
                          try { await axiosInstance.delete(`/supplier-payments/${pay._id}`); loadPayments(); } catch (e) { alert(e?.response?.data?.message || "Failed."); }
                        }} style={{ padding: "5px 10px", borderRadius: "8px", border: `1.5px solid ${RDB}`, background: RDL, color: RD, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
