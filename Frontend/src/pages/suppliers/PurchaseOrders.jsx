import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

/* ── Palette ─────────────────────────────── */
const P = "#059669", PL = "rgba(5,150,105,.08)", PB = "rgba(5,150,105,.2)";
const V = "#7c3aed", VL = "rgba(124,58,237,.08)", VB = "rgba(124,58,237,.2)";
const B = "#0284c7", BL = "rgba(2,132,199,.08)", BB = "rgba(2,132,199,.2)";
const AM = "#b45309", AML = "rgba(180,83,9,.08)", AMB = "rgba(180,83,9,.2)";
const RD = "#dc2626", RDL = "rgba(239,68,68,.08)", RDB = "rgba(239,68,68,.2)";
const GR = "rgba(26,26,46,.08)", GRB = "rgba(26,26,46,.16)";

const IS = {
  height: "38px", borderRadius: "9px", border: "1.5px solid rgba(26,26,46,.14)",
  outline: "none", padding: "0 12px", fontSize: "13px", fontFamily: "'Poppins',sans-serif",
  color: "#1a1a2e", background: "#fff", width: "100%",
};
const thS = {
  padding: "11px 14px", textAlign: "left", fontFamily: "'DM Mono',monospace",
  fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em",
  textTransform: "uppercase", fontWeight: 500, whiteSpace: "nowrap",
};

const STATUS_META = {
  DRAFT:     { color: "rgba(26,26,46,.5)", bg: GR,   border: GRB,    label: "Draft" },
  ORDERED:   { color: B,                  bg: BL,   border: BB,     label: "Ordered" },
  PARTIAL:   { color: AM,                 bg: AML,  border: AMB,    label: "Partial" },
  RECEIVED:  { color: P,                  bg: PL,   border: PB,     label: "Received" },
  CANCELLED: { color: RD,                 bg: RDL,  border: RDB,    label: "Cancelled" },
};

function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "99px", background: m.bg, border: `1px solid ${m.border}`, color: m.color, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700, whiteSpace: "nowrap" }}>
      {m.label}
    </span>
  );
}

function PayBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const color = pct >= 100 ? P : pct > 0 ? AM : RD;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.5)" }}>
        <span style={{ color, fontWeight: 700 }}>₹{(paid || 0).toLocaleString("en-IN")}</span>
        <span>/ ₹{(total || 0).toLocaleString("en-IN")}</span>
      </div>
      <div style={{ height: "4px", borderRadius: "99px", background: "rgba(26,26,46,.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "99px", transition: "width .4s" }} />
      </div>
    </div>
  );
}

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    axiosInstance.get("/purchase-orders").then(r => setPOs(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => pos.filter(po => {
    const q = search.toLowerCase();
    const mS = !q || po.poNumber?.toLowerCase().includes(q) || po.supplier?.supplierName?.toLowerCase().includes(q) || po.supplier?.companyName?.toLowerCase().includes(q);
    const mF = statusFilter === "all" || po.status === statusFilter;
    return mS && mF;
  }), [pos, search, statusFilter]);

  const stats = useMemo(() => ({
    total: pos.length,
    ordered: pos.filter(p => p.status === "ORDERED").length,
    partial: pos.filter(p => p.status === "PARTIAL").length,
    received: pos.filter(p => p.status === "RECEIVED").length,
    totalValue: pos.reduce((s, p) => s + (p.totalAmount || 0), 0),
    dueValue: pos.reduce((s, p) => s + (p.dueAmount || 0), 0),
  }), [pos]);

  const COLS = ["PO Number", "Supplier", "Items", "Total Amount", "Payment", "Status", "Expected", "Actions"];

  return (
    <PageShell title="Purchase Orders" subtitle="Create and track supplier purchase orders">
      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          ["All POs", stats.total, GR, GRB, "rgba(26,26,46,.7)", "all"],
          ["Ordered", stats.ordered, BL, BB, B, "ORDERED"],
          ["Partial", stats.partial, AML, AMB, AM, "PARTIAL"],
          ["Received", stats.received, PL, PB, P, "RECEIVED"],
        ].map(([label, count, bg, border, color, key]) => (
          <div key={key} onClick={() => setStatusFilter(key)} style={{ padding: "9px 17px", borderRadius: "12px", background: statusFilter === key ? border : bg, border: `1.5px solid ${border}`, cursor: "pointer", transition: "all .18s", display: "flex", gap: "9px", alignItems: "center" }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 900, color }}>{count}</span>
            <span style={{ fontSize: "11.5px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.55)", letterSpacing: ".06em" }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <div style={{ textAlign: "center", padding: "6px 14px", borderRadius: "10px", background: VL, border: `1px solid ${VB}` }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: V, fontFamily: "'Fraunces',serif" }}>₹{stats.totalValue.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "9px", color: V, fontFamily: "'DM Mono',monospace", letterSpacing: ".08em" }}>TOTAL VALUE</div>
          </div>
          <div style={{ textAlign: "center", padding: "6px 14px", borderRadius: "10px", background: RDL, border: `1px solid ${RDB}` }}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: RD, fontFamily: "'Fraunces',serif" }}>₹{stats.dueValue.toLocaleString("en-IN")}</div>
            <div style={{ fontSize: "9px", color: RD, fontFamily: "'DM Mono',monospace", letterSpacing: ".08em" }}>TOTAL DUE</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: "#fff", borderRadius: "14px", padding: "13px 18px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search PO number or supplier…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...IS, paddingLeft: "32px", width: "230px" }} />
        </div>
        <span style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{filtered.length} orders</span>
        <button onClick={load} style={{ padding: "7px 11px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", fontSize: "14px", cursor: "pointer" }}>↻</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <ExcelExport data={filtered} filename="purchase_orders" sheetName="POs" accent={{ color: B, light: BL, border: BB }}
            columns={[
              { key: "poNumber", label: "PO Number" },
              { key: "supplier.supplierName", label: "Supplier" },
              { key: "totalAmount", label: "Total Amount" },
              { key: "paidAmount", label: "Paid" },
              { key: "dueAmount", label: "Due" },
              { key: "status", label: "Status" },
            ]} />
          <button onClick={() => navigate("/suppliers/purchase-orders/create")} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${B},#0369a1)`, color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Poppins',sans-serif", boxShadow: "0 4px 14px rgba(2,132,199,.3)", whiteSpace: "nowrap" }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create PO
          </button>
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
                <tr><td colSpan={COLS.length} style={{ padding: "60px", textAlign: "center", color: "rgba(26,26,46,.35)", fontSize: "13px" }}>Loading purchase orders…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={COLS.length} style={{ padding: "60px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>📦</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "rgba(26,26,46,.5)" }}>No purchase orders found</div>
                  <div style={{ fontSize: "12px", color: "rgba(26,26,46,.3)", marginTop: "4px" }}>Create your first PO to get started</div>
                </td></tr>
              ) : filtered.map(po => (
                <tr key={po._id} style={{ borderBottom: "1px solid rgba(26,26,46,.042)", transition: "background .12s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.016)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 700, color: B }}>{po.poNumber}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>{po.supplier?.supplierName || "—"}</div>
                    {po.supplier?.companyName && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>{po.supplier.companyName}</div>}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ padding: "2px 9px", borderRadius: "99px", background: VL, border: `1px solid ${VB}`, color: V, fontSize: "11px", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{po.items?.length || 0} items</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 800, color: "#1a1a2e" }}>₹{(po.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <PayBar paid={po.paidAmount} total={po.totalAmount} />
                  </td>
                  <td style={{ padding: "12px 14px" }}><StatusChip status={po.status} /></td>
                  <td style={{ padding: "12px 14px", fontSize: "12px", color: "rgba(26,26,46,.5)", fontFamily: "'DM Mono',monospace" }}>
                    {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => navigate(`/suppliers/purchase-orders/${po._id}`)}
                        style={{ padding: "5px 12px", borderRadius: "8px", border: "1.5px solid rgba(26,26,46,.14)", background: "#fff", color: "rgba(26,26,46,.7)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = BB; e.currentTarget.style.color = B; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,26,46,.14)"; e.currentTarget.style.color = "rgba(26,26,46,.7)"; }}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </PageShell>
  );
}
