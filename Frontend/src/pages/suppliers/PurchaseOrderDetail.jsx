import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { FormError } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const B = "#0284c7", BL = "rgba(2,132,199,.08)", BB = "rgba(2,132,199,.2)";
const P = "#059669", PL = "rgba(5,150,105,.08)", PB = "rgba(5,150,105,.2)";
const AM = "#b45309", AML = "rgba(180,83,9,.08)", AMB = "rgba(180,83,9,.2)";
const RD = "#dc2626", RDL = "rgba(239,68,68,.08)", RDB = "rgba(239,68,68,.2)";
const V = "#7c3aed", VL = "rgba(124,58,237,.08)", VB = "rgba(124,58,237,.2)";
const GR = "rgba(26,26,46,.08)", GRB = "rgba(26,26,46,.16)";

const STATUS_META = {
  DRAFT:     { color: "rgba(26,26,46,.5)", bg: GR,  border: GRB, label: "Draft" },
  ORDERED:   { color: B,  bg: BL,  border: BB,  label: "Ordered" },
  PARTIAL:   { color: AM, bg: AML, border: AMB, label: "Partial" },
  RECEIVED:  { color: P,  bg: PL,  border: PB,  label: "Received" },
  CANCELLED: { color: RD, bg: RDL, border: RDB, label: "Cancelled" },
};

const FLOW = ["DRAFT","ORDERED","PARTIAL","RECEIVED"];

function StatusChip({ status, large }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <span style={{ padding: large ? "5px 14px" : "3px 10px", borderRadius: "99px", background: m.bg, border: `1px solid ${m.border}`, color: m.color, fontSize: large ? "13px" : "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
      {m.label}
    </span>
  );
}

function InfoField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e", fontFamily: mono ? "'DM Mono',monospace" : "'Figtree',sans-serif" }}>{value || "—"}</div>
    </div>
  );
}

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);

  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);

  const load = () => {
    setLoading(true);
    axiosInstance.get(`/purchase-orders/${id}`).then(r => { setPO(r.data); setNewStatus(r.data.status); }).catch(() => setError("Failed to load PO.")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true); setError("");
    try {
      const r = await axiosInstance.put(`/purchase-orders/${id}`, { status: newStatus });
      setPO(r.data);
      setShowStatusModal(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed.");
    } finally { setUpdating(false); }
  };

  if (loading) return <PageShell title="Purchase Order"><div style={{ padding: "60px", textAlign: "center", background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", color: "rgba(26,26,46,.35)" }}>Loading…</div></PageShell>;
  if (!po) return <PageShell title="Purchase Order"><div style={{ padding: "40px", textAlign: "center", background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", color: RD }}>Purchase order not found.</div></PageShell>;

  const curIdx = FLOW.indexOf(po.status);
  const pct = po.totalAmount > 0 ? Math.min(100, (po.paidAmount / po.totalAmount) * 100) : 0;

  return (
    <PageShell title={po.poNumber} subtitle={`Purchase order · ${new Date(po.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}`}>
      <FormError message={error} />

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/suppliers/purchase-orders")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "9px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", color: "rgba(26,26,46,.6)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back
        </button>
        <StatusChip status={po.status} large />
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {canEdit && po.status !== "CANCELLED" && po.status !== "RECEIVED" && (
            <button onClick={() => setShowStatusModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${B},#0369a1)`, color: "#fff", fontSize: "13px", fontWeight: 700, boxShadow: "0 4px 14px rgba(2,132,199,.3)" }}>
              Update Status
            </button>
          )}
          {canEdit && po.status !== "CANCELLED" && (
            <button onClick={async () => {
              if (!window.confirm("Cancel this purchase order?")) return;
              setUpdating(true);
              try { const r = await axiosInstance.put(`/purchase-orders/${id}`, { status: "CANCELLED" }); setPO(r.data); } catch (e) { setError(e?.response?.data?.message || "Failed."); } finally { setUpdating(false); }
            }} style={{ padding: "8px 14px", borderRadius: "10px", border: `1.5px solid ${RDB}`, background: RDL, color: RD, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              Cancel PO
            </button>
          )}
        </div>
      </div>

      {/* Progress tracker */}
      {po.status !== "CANCELLED" && (
        <Card style={{ marginBottom: "16px", padding: "18px 24px" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "14px" }}>Order Progress</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
            {FLOW.map((s, idx) => {
              const done = idx <= curIdx;
              const m = STATUS_META[s];
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: done ? `linear-gradient(135deg,${m.color},${m.color}cc)` : "rgba(26,26,46,.08)", border: `2px solid ${done ? m.color : "rgba(26,26,46,.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: done ? `0 2px 8px ${m.border}` : "none", transition: "all .3s" }}>
                      {done ? <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(26,26,46,.2)" }} />}
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "10px", fontFamily: "'DM Mono',monospace", color: done ? m.color : "rgba(26,26,46,.3)", fontWeight: done ? 700 : 400, letterSpacing: ".06em" }}>{s}</div>
                  </div>
                  {idx < FLOW.length - 1 && <div style={{ height: "2px", flex: 1, background: idx < curIdx ? B : "rgba(26,26,46,.08)", marginBottom: "18px", transition: "background .3s" }} />}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Items table */}
          <Card>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "14px" }}>Order Items</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(26,26,46,.025)", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
                    {["Product", "Qty", "Unit Cost", "Total"].map(h => <th key={h} style={{ padding: "9px 12px", textAlign: h === "Qty" || h === "Total" ? "center" : "left", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".12em", textTransform: "uppercase" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {po.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(26,26,46,.04)" }}>
                      <td style={{ padding: "11px 12px", fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{item.productName || item.product?.name || "—"}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center" }}>
                        <span style={{ padding: "2px 10px", borderRadius: "99px", background: VL, border: `1px solid ${VB}`, color: V, fontSize: "12px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{item.quantity}</span>
                      </td>
                      <td style={{ padding: "11px 12px", fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "rgba(26,26,46,.6)", textAlign: "right" }}>₹{(item.unitCost || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right" }}>
                        <span style={{ fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 800, color: B }}>₹{(item.totalCost || item.quantity * item.unitCost || 0).toLocaleString("en-IN")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid rgba(26,26,46,.07)", background: "rgba(26,26,46,.02)" }}>
                    <td colSpan={3} style={{ padding: "12px", fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.5)", textAlign: "right" }}>TOTAL</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 900, color: "#1a1a2e" }}>₹{(po.totalAmount || 0).toLocaleString("en-IN")}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Notes */}
          {po.notes && (
            <Card style={{ padding: "16px 20px" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "8px" }}>Notes</div>
              <div style={{ fontSize: "13px", color: "rgba(26,26,46,.7)", lineHeight: 1.6 }}>{po.notes}</div>
            </Card>
          )}
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Supplier */}
          <Card style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "12px" }}>Supplier</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${P},#047857)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{po.supplier?.supplierName?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>{po.supplier?.supplierName}</div>
                {po.supplier?.companyName && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{po.supplier.companyName}</div>}
              </div>
            </div>
            {po.supplier?.phoneNumber && <div style={{ fontSize: "12px", color: "rgba(26,26,46,.5)", fontFamily: "'DM Mono',monospace" }}>{po.supplier.phoneNumber}</div>}
          </Card>

          {/* Payment summary */}
          <Card style={{ padding: "18px 20px" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "14px" }}>Payment Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              {[["Total", po.totalAmount, "#1a1a2e"], ["Paid", po.paidAmount, P], ["Due", po.dueAmount, po.dueAmount > 0 ? RD : P]].map(([label, val, color]) => (
                <div key={label} style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.07)" }}>
                  <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 800, color }}>₹{(val || 0).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
            <div style={{ height: "6px", borderRadius: "99px", background: "rgba(26,26,46,.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? P : AM, borderRadius: "99px", transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", marginTop: "4px", textAlign: "right" }}>{pct.toFixed(0)}% paid</div>
          </Card>

          {/* Dates */}
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "12px" }}>Dates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <InfoField label="Created" value={new Date(po.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} />
              {po.expectedDate && <InfoField label="Expected Delivery" value={new Date(po.expectedDate).toLocaleDateString("en-IN", { dateStyle: "medium" })} />}
              {po.receivedDate && <InfoField label="Received On" value={new Date(po.receivedDate).toLocaleDateString("en-IN", { dateStyle: "medium" })} />}
              {po.branch?.branchName && <InfoField label="Branch" value={po.branch.branchName} />}
            </div>
          </Card>
        </div>
      </div>

      {/* Status update modal */}
      {showStatusModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "18px", padding: "28px", maxWidth: "min(380px, 100%)", width: "100%", boxShadow: "0 20px 60px rgba(26,26,46,.18)" }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "6px" }}>Update PO Status</div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)", marginBottom: "18px" }}>Current: <StatusChip status={po.status} /></div>
            <FormError message={error} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {FLOW.filter(s => FLOW.indexOf(s) > FLOW.indexOf(po.status)).map(s => {
                const m = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setNewStatus(s)} style={{ padding: "12px", borderRadius: "11px", border: `2px solid ${newStatus === s ? m.color : "rgba(26,26,46,.12)"}`, background: newStatus === s ? m.bg : "#fff", color: newStatus === s ? m.color : "rgba(26,26,46,.6)", fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button type="button" onClick={handleStatusUpdate} loading={updating} accent={B} glow="rgba(2,132,199,.25)" fullWidth>Update</Button>
              <Button variant="secondary" onClick={() => setShowStatusModal(false)} fullWidth>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
