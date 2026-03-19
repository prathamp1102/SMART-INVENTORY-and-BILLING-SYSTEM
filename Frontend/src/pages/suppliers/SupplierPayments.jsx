import { useState, useEffect, useMemo } from "react";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS as ISBase, SS, FieldLabel, FormError, FormDivider } from "../../components/forms/FormStyles";
import { getSuppliers } from "../../services/productService";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const P = "#059669", PL = "rgba(5,150,105,.08)", PB = "rgba(5,150,105,.2)";
const B = "#0284c7", BL = "rgba(2,132,199,.08)", BB = "rgba(2,132,199,.2)";
const AM = "#b45309", AML = "rgba(180,83,9,.08)", AMB = "rgba(180,83,9,.2)";
const RD = "#dc2626", RDL = "rgba(239,68,68,.08)", RDB = "rgba(239,68,68,.2)";
const V = "#7c3aed", VL = "rgba(124,58,237,.08)", VB = "rgba(124,58,237,.2)";

const PAY_MODES = ["CASH", "BANK_TRANSFER", "CHEQUE", "UPI", "OTHER"];
const thS = { padding: "11px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap" };
const IS = { ...ISBase, height: "42px", marginBottom: "0" };

const MODE_MAP = {
  CASH: [P, PL, PB], BANK_TRANSFER: [B, BL, BB],
  CHEQUE: [AM, AML, AMB], UPI: [V, VL, VB],
  OTHER: ["rgba(26,26,46,.5)", "rgba(26,26,46,.06)", "rgba(26,26,46,.15)"],
};

function PayModeChip({ mode }) {
  const [color, bg, border] = MODE_MAP[mode] || MODE_MAP.OTHER;
  return <span style={{ padding: "3px 10px", borderRadius: "99px", background: bg, border: `1px solid ${border}`, color, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{mode?.replace("_", " ")}</span>;
}

function SupplierLedger({ supplier, payments, pos }) {
  const [open, setOpen] = useState(false);
  const supPayments = payments.filter(p => String(p.supplier?._id || p.supplier) === supplier._id);
  const totalPaid = supPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const supPOs = pos.filter(p => String(p.supplier?._id || p.supplier) === supplier._id);
  const totalOrdered = supPOs.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalDue = supPOs.reduce((s, p) => s + (p.dueAmount || 0), 0);
  const balance = supplier.openingBalance || 0;
  const netDue = totalDue + balance;

  return (
    <div style={{ border: `1px solid ${BB}`, borderRadius: "13px", overflow: "hidden" }}>
      <div onClick={() => setOpen(v => !v)} style={{ padding: "14px 18px", background: `linear-gradient(135deg,${BL},rgba(2,132,199,.02))`, display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${P},#047857)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{supplier.supplierName?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>{supplier.supplierName}</div>
          {supplier.companyName && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{supplier.companyName}</div>}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: "8px", background: BL, border: `1px solid ${BB}` }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: "13px", fontWeight: 800, color: B }}>₹{totalOrdered.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "8.5px", fontFamily: "'DM Mono',monospace", color: B, letterSpacing: ".08em" }}>ORDERED</div>
          </div>
          <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: "8px", background: PL, border: `1px solid ${PB}` }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: "13px", fontWeight: 800, color: P }}>₹{totalPaid.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "8.5px", fontFamily: "'DM Mono',monospace", color: P, letterSpacing: ".08em" }}>PAID</div>
          </div>
          <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: "8px", background: netDue > 0 ? RDL : PL, border: `1px solid ${netDue > 0 ? RDB : PB}` }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: "13px", fontWeight: 800, color: netDue > 0 ? RD : P }}>₹{netDue.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "8.5px", fontFamily: "'DM Mono',monospace", color: netDue > 0 ? RD : P, letterSpacing: ".08em" }}>NET DUE</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="14" height="14" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </div>
      </div>
      {open && (
        <div style={{ padding: "14px 18px" }}>
          {/* Opening balance */}
          {balance > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "9px", background: AML, border: `1px solid ${AMB}`, marginBottom: "10px" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={AM} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              <span style={{ fontSize: "12px", color: AM, fontWeight: 600 }}>Opening Balance: <strong>₹{balance.toLocaleString("en-IN")}</strong></span>
            </div>
          )}
          {/* Payment history */}
          {supPayments.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "rgba(26,26,46,.35)", fontSize: "12px" }}>No payments recorded for this supplier</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(26,26,46,.025)" }}>
                  {["Date", "Amount", "Mode", "Reference", "Linked PO", ""].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {supPayments.map(pay => (
                  <tr key={pay._id} style={{ borderBottom: "1px solid rgba(26,26,46,.04)" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.5)" }}>{new Date(pay.paidOn).toLocaleDateString("en-IN")}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 800, color: P }}>₹{(pay.amount || 0).toLocaleString("en-IN")}</span></td>
                    <td style={{ padding: "10px 14px" }}><PayModeChip mode={pay.paymentMode} /></td>
                    <td style={{ padding: "10px 14px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.5)" }}>{pay.referenceNo || "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {pay.purchaseOrder?.poNumber
                        ? <span style={{ padding: "2px 9px", borderRadius: "99px", background: BL, border: `1px solid ${BB}`, color: B, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{pay.purchaseOrder.poNumber}</span>
                        : <span style={{ color: "rgba(26,26,46,.25)", fontSize: "11px" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={async () => {
                        if (!window.confirm("Delete this payment?")) return;
                        try { await axiosInstance.delete(`/supplier-payments/${pay._id}`); window.location.reload(); } catch (e) { alert("Failed."); }
                      }} style={{ padding: "3px 9px", borderRadius: "7px", border: `1px solid ${RDB}`, background: RDL, color: RD, fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupplierPayments() {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: "", purchaseOrder: "", amount: "", paymentMode: "CASH", referenceNo: "", notes: "", paidOn: new Date().toISOString().split("T")[0] });
  const [formPOs, setFormPOs] = useState([]);
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const loadAll = () => {
    setLoading(true);
    Promise.all([getSuppliers(), axiosInstance.get("/supplier-payments"), axiosInstance.get("/purchase-orders")])
      .then(([s, pay, po]) => { setSuppliers(s); setPayments(pay.data); setPOs(po.data); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (!form.supplier) { setFormPOs([]); return; }
    setFormPOs(pos.filter(po => String(po.supplier?._id || po.supplier) === form.supplier && po.status !== "CANCELLED" && (po.dueAmount || 0) > 0));
  }, [form.supplier, pos]);

  const setF = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.supplier) e.supplier = "Required";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter valid amount";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true); setApiError("");
    try {
      await axiosInstance.post("/supplier-payments", { ...form, amount: Number(form.amount), purchaseOrder: form.purchaseOrder || undefined });
      setForm({ supplier: "", purchaseOrder: "", amount: "", paymentMode: "CASH", referenceNo: "", notes: "", paidOn: new Date().toISOString().split("T")[0] });
      setShowForm(false); loadAll();
    } catch (err) { setApiError(err?.response?.data?.message || "Failed."); } finally { setSaving(false); }
  };

  const activeSuppliers = useMemo(() => suppliers.filter(s => s.status === "ACTIVE"), [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase();
    return activeSuppliers.filter(s => !q || s.supplierName?.toLowerCase().includes(q) || s.companyName?.toLowerCase().includes(q));
  }, [activeSuppliers, search]);

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalDue = pos.reduce((s, p) => s + (p.dueAmount || 0), 0);

  return (
    <PageShell title="Supplier Payments" subtitle="Track all payment ledgers and outstanding dues">
      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: PL, border: `1.5px solid ${PB}`, display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", fontWeight: 900, color: P }}>₹{totalPaid.toLocaleString("en-IN")}</span>
          <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>Total Paid</span>
        </div>
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: RDL, border: `1.5px solid ${RDB}`, display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", fontWeight: 900, color: RD }}>₹{totalDue.toLocaleString("en-IN")}</span>
          <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>Total Due</span>
        </div>
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: BL, border: `1.5px solid ${BB}`, display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", fontWeight: 900, color: B }}>{payments.length}</span>
          <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>Transactions</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: "14px", padding: "13px 18px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search supplier…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...ISBase, height: "36px", paddingLeft: "32px", width: "200px", marginBottom: 0 }} />
        </div>
        <span style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{filteredSuppliers.length} suppliers</span>
        <button onClick={loadAll} style={{ padding: "7px 11px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", fontSize: "14px", cursor: "pointer" }}>↻</button>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setShowForm(v => !v)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", background: showForm ? RD : `linear-gradient(135deg,${P},#047857)`, color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: showForm ? "0 4px 14px rgba(220,38,38,.3)" : "0 4px 14px rgba(5,150,105,.3)" }}>
            {showForm ? "✕ Cancel" : (<><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Record Payment</>)}
          </button>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <Card style={{ marginBottom: "16px", maxWidth: "min(640px, 100%)" }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 800, color: "#1a1a2e", marginBottom: "14px" }}>New Payment</div>
          <FormError message={apiError} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(200px, 100%), 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <FieldLabel>Supplier *</FieldLabel>
              <select value={form.supplier} onChange={setF("supplier")} style={{ ...SS, height: "42px", marginBottom: 0, borderColor: errors.supplier ? "rgba(239,68,68,.5)" : undefined }}>
                <option value="">— Select —</option>
                {activeSuppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
              </select>
              {errors.supplier && <div style={{ color: RD, fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "3px" }}>{errors.supplier}</div>}
            </div>
            <div>
              <FieldLabel>Link PO (Optional)</FieldLabel>
              <select value={form.purchaseOrder} onChange={setF("purchaseOrder")} style={{ ...SS, height: "42px", marginBottom: 0, opacity: !form.supplier ? 0.5 : 1 }} disabled={!form.supplier}>
                <option value="">— None —</option>
                {formPOs.map(po => <option key={po._id} value={po._id}>{po.poNumber} (₹{(po.dueAmount || 0).toLocaleString("en-IN")} due)</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Amount (₹) *</FieldLabel>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={setF("amount")} style={{ ...IS, borderColor: errors.amount ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.amount && <div style={{ color: RD, fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "3px" }}>{errors.amount}</div>}
            </div>
            <div>
              <FieldLabel>Payment Mode</FieldLabel>
              <select value={form.paymentMode} onChange={setF("paymentMode")} style={{ ...SS, height: "42px", marginBottom: 0 }}>
                {PAY_MODES.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input type="date" value={form.paidOn} onChange={setF("paidOn")} style={{ ...IS }} />
            </div>
            <div>
              <FieldLabel>Reference No.</FieldLabel>
              <input placeholder="e.g. TXN123" value={form.referenceNo} onChange={setF("referenceNo")} style={{ ...IS }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" onClick={handleSubmit} loading={saving} accent={P} glow="rgba(5,150,105,.25)">Save Payment</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Supplier ledgers */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", color: "rgba(26,26,46,.35)" }}>Loading…</div>
      ) : filteredSuppliers.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>💰</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,46,.5)" }}>No suppliers found</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredSuppliers.map(s => <SupplierLedger key={s._id} supplier={s} payments={payments} pos={pos} />)}
        </div>
      )}
    </PageShell>
  );
}
