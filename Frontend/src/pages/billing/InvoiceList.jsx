import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import { BillingContext } from "../../context/BillingContext";
import useAuth from "../../hooks/useAuth";
import { markInvoicePaid } from "../../services/billingService";
import ConfirmModal from "../../components/ui/ConfirmModal";

// ── Print a single invoice in a clean popup window ───────────────────────────
function printInvoice(inv) {
  const org      = inv.branch?.organization || inv.organization || {};
  const orgName  = org.name      || "EVARA";
  const orgGst   = org.gstNumber || "";
  const orgAddr  = org.address   || "";
  const orgPhone = org.phone     || "";
  const orgEmail = org.email     || "";

  const fmt = (n) =>
    "Rs. " + Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const STATUS_COLOR = { PAID: "#16a34a", PENDING: "#d97706", CANCELLED: "#dc2626" };
  const statusColor  = STATUS_COLOR[inv.status] || "#16a34a";
  const statusLabel  = inv.status || "PAID";

  const itemRows = (inv.items || []).map(item => `
    <tr>
      <td style="padding:8px 10px;font-size:12px;color:#1a1a2e;border-bottom:1px solid #f0ece4;">${item.productName || item.name || "—"}</td>
      <td style="padding:8px 10px;font-size:11px;color:#5c4e3a;text-align:center;border-bottom:1px solid #f0ece4;">${item.barcode || item.sku || "—"}</td>
      <td style="padding:8px 10px;font-size:12px;color:#5c4e3a;text-align:center;border-bottom:1px solid #f0ece4;">${item.qty || 1}</td>
      <td style="padding:8px 10px;font-size:12px;color:#5c4e3a;text-align:right;border-bottom:1px solid #f0ece4;">${fmt(item.unitPrice || item.price || 0)}</td>
      <td style="padding:8px 10px;font-size:12px;color:#5c4e3a;text-align:center;border-bottom:1px solid #f0ece4;">${item.discount || 0}%</td>
      <td style="padding:8px 10px;font-size:12px;font-weight:700;color:#1a1a2e;text-align:right;border-bottom:1px solid #f0ece4;">${fmt(item.total || 0)}</td>
    </tr>
  `).join("");

  const subtotal    = inv.subtotal      || (inv.items || []).reduce((s, i) => s + (i.total || 0), 0);
  const discountAmt = inv.discountAmount || 0;
  const taxAmt      = inv.taxAmount     || 0;
  const grandTotal  = inv.grandTotal    || inv.total || 0;
  const amountPaid  = inv.amountPaid    || grandTotal;
  const change      = inv.change        || 0;
  const invoiceNo   = inv.invoiceNo || inv.invoiceNumber || ("#" + (inv._id || "").slice(-8).toUpperCase());

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoiceNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:#f0ece4; padding:20px; }
    .page { max-width:680px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 16px rgba(45,36,22,.12); }
    .header { background:#2d2416; padding:28px 36px; display:flex; justify-content:space-between; align-items:flex-start; }
    .org-name { font-size:22px; font-weight:800; color:#f5f0e8; letter-spacing:-.3px; }
    .org-meta { font-size:10px; color:rgba(245,240,232,.45); margin-top:4px; line-height:1.6; }
    .inv-label { text-align:right; }
    .inv-tag { font-size:9px; color:rgba(245,240,232,.45); letter-spacing:1px; text-transform:uppercase; }
    .inv-num { font-size:20px; font-weight:800; color:#f5f0e8; margin-top:4px; }
    .status-badge { display:inline-block; background:${statusColor}; color:#fff; font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:3px 12px; border-radius:99px; margin-top:6px; }
    .meta-row { display:grid; grid-template-columns:repeat(3,1fr); border-bottom:1px solid #e8e0d4; }
    .meta-cell { padding:14px 18px; border-right:1px solid #e8e0d4; }
    .meta-cell:last-child { border-right:none; }
    .meta-label { font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9e8c77; margin-bottom:4px; }
    .meta-val { font-size:12px; font-weight:700; color:#2d2416; }
    .party-row { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid #e8e0d4; }
    .party-cell { padding:16px 20px; border-right:1px solid #e8e0d4; }
    .party-cell:last-child { border-right:none; }
    .party-label { font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#b45309; margin-bottom:5px; }
    .party-name { font-size:15px; font-weight:800; color:#2d2416; }
    .party-sub { font-size:11px; color:#9e8c77; margin-top:3px; }
    .items-wrap { padding:16px 20px 0; }
    .items-title { font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#9e8c77; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; }
    thead th { font-size:9px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; color:#9e8c77; padding:6px 10px; border-bottom:2px solid #2d2416; }
    thead th { text-align:center; }
    thead th:first-child { text-align:left; }
    thead th:nth-child(4), thead th:last-child { text-align:right; }
    .totals { padding:12px 20px 16px; display:flex; justify-content:flex-end; }
    .totals-box { width:250px; }
    .tot-row { display:flex; justify-content:space-between; padding:5px 0; font-size:12px; color:#5c4e3a; border-bottom:1px solid #f0ece4; }
    .tot-grand { display:flex; justify-content:space-between; padding:8px 0 5px; font-size:15px; font-weight:800; color:#2d2416; border-top:2px solid #2d2416; margin-top:4px; }
    .tot-grand span:last-child { color:#059669; }
    .footer { background:#f7f4ef; border-top:1px solid #e8e0d4; padding:14px 20px; display:flex; justify-content:space-between; align-items:center; }
    .footer-note { font-size:10px; color:#b0a090; font-style:italic; }
    .footer-gst { font-size:10px; color:#b0a090; }
    @media print {
      body { background:#fff; padding:0; }
      .page { box-shadow:none; border-radius:0; max-width:100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="org-name">${orgName}</div>
        <div class="org-meta">${[orgAddr, orgPhone, orgEmail].filter(Boolean).join("  ·  ")}</div>
      </div>
      <div class="inv-label">
        <div class="inv-tag">Invoice</div>
        <div class="inv-num">${invoiceNo}</div>
        <span class="status-badge">${statusLabel}</span>
      </div>
    </div>
    <div class="meta-row">
      <div class="meta-cell">
        <div class="meta-label">Date</div>
        <div class="meta-val">${fmtDate(inv.createdAt)}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Payment Method</div>
        <div class="meta-val">${inv.paymentMethod || inv.paymentMode || "—"}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-label">Branch</div>
        <div class="meta-val">${inv.branch?.branchName || "—"}</div>
      </div>
    </div>
    <div class="party-row">
      <div class="party-cell">
        <div class="party-label">Customer</div>
        <div class="party-name">${inv.customerName || "Walk-in Customer"}</div>
        ${inv.customerPhone ? `<div class="party-sub">${inv.customerPhone}</div>` : ""}
        ${inv.customerEmail ? `<div class="party-sub">${inv.customerEmail}</div>` : ""}
      </div>
      <div class="party-cell">
        <div class="party-label">Cashier / Staff</div>
        <div class="party-name">${inv.cashier?.name || inv.createdBy?.name || "—"}</div>
        ${inv.cashier?.email ? `<div class="party-sub">${inv.cashier.email}</div>` : ""}
      </div>
    </div>
    <div class="items-wrap">
      <div class="items-title">Items (${(inv.items || []).length})</div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Product</th>
            <th>Barcode</th>
            <th>Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th>Disc %</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <div class="totals">
      <div class="totals-box">
        <div class="tot-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${discountAmt > 0 ? `<div class="tot-row"><span>Discount</span><span style="color:#dc2626">− ${fmt(discountAmt)}</span></div>` : ""}
        ${taxAmt > 0 ? `<div class="tot-row"><span>Tax / GST</span><span>${fmt(taxAmt)}</span></div>` : ""}
        <div class="tot-grand"><span>Grand Total</span><span>${fmt(grandTotal)}</span></div>
        <div class="tot-row" style="padding-top:6px"><span style="font-weight:700;color:#2d2416">Amount Paid</span><span style="font-weight:700;color:#2d2416">${fmt(amountPaid)}</span></div>
        ${change > 0 ? `<div class="tot-row"><span>Change</span><span style="color:#b45309;font-weight:700">${fmt(change)}</span></div>` : ""}
      </div>
    </div>
    ${inv.notes ? `<div style="padding:0 20px 14px;font-size:11px;color:#9e8c77;font-style:italic;">Note: ${inv.notes}</div>` : ""}
    <div class="footer">
      <div class="footer-note">Thank you for your business!</div>
      <div class="footer-gst">${orgGst ? "GST: " + orgGst + "  ·  " : ""}Computer-generated invoice.</div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=750,height=900");
  w.document.write(html);
  w.document.close();
  w.focus();
}

export default function InvoiceList() {
  const { invoices, fetchInvoices } = useContext(BillingContext);
  const { user } = useAuth();
  const isCustomer = user?.role === "CUSTOMER";
  const canConfirmPayment = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user?.role);
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [payModal, setPayModal] = useState(null); // { id, grandTotal, customerName }
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const navigate = useNavigate();

  const handleConfirmPayment = async () => {
    if (!payModal) return;
    setPaying(true); setPayError(null);
    try {
      await markInvoicePaid(payModal.id);
      setData(prev => prev.map(inv =>
        inv._id === payModal.id ? { ...inv, status: "PAID", amountPaid: inv.grandTotal } : inv
      ));
      setPayModal(null);
    } catch (err) {
      setPayError(err?.response?.data?.message || "Failed to confirm payment.");
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchInvoices().then(() => {}).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (invoices && invoices.length > 0) setData(invoices);
    else setData([]);
  }, [invoices]);

  const filtered = data.filter(inv =>
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv._id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = data.reduce((s, i) => s + (i.grandTotal || i.total || 0), 0);

  return (
    <PageShell title={isCustomer ? "My Invoices" : "Invoice List"} subtitle={isCustomer ? "Your purchase invoices and receipts" : "All sales invoices and billing records"}>
      {payModal && (
        <ConfirmModal
          title="Confirm Cash Payment"
          message={`Confirm that cash payment of ₹${payModal.grandTotal?.toLocaleString("en-IN")} has been received from`}
          itemName={payModal.customerName}
          variant="info"
          confirmLabel="Mark as Paid"
          loading={paying}
          error={payError}
          onConfirm={handleConfirmPayment}
          onCancel={() => { setPayModal(null); setPayError(null); }}
        />
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(170px, 100%), 1fr))", gap:"12px", marginBottom:"22px" }}>
        {[
          ["Total Invoices", data.length, "#0284c7", "rgba(2,132,199,.08)", "rgba(2,132,199,.2)"],
          ["Total Revenue", `₹${totalRevenue.toLocaleString("en-IN")}`, "#059669", "rgba(5,150,105,.08)", "rgba(5,150,105,.2)"],
          ["Cash", data.filter(i=>i.paymentMethod==="CASH").length, "#1a1a2e", "rgba(26,26,46,.06)", "rgba(26,26,46,.14)"],
          ["UPI / Card", data.filter(i=>i.paymentMethod!=="CASH").length, "#7c3aed", "rgba(124,58,237,.08)", "rgba(124,58,237,.2)"],
        ].map(([label,val,color,bg,border]) => (
          <div key={label} style={{ background:"#fff", borderRadius:"16px", border:`1px solid ${border}`, padding:"18px 20px" }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:"24px", fontWeight:900, color, letterSpacing:"-.03em" }}>{val}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(26,26,46,.38)", letterSpacing:".14em", textTransform:"uppercase", marginTop:"6px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
        <div style={{ position:"relative", flex:1, minWidth:"220px" }}>
          <svg style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)" }} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search by customer name or invoice ID…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", height:"40px", borderRadius:"10px", border:"1.5px solid rgba(26,26,46,.12)", outline:"none", paddingLeft:"34px", paddingRight:"12px", fontSize:"13px", fontFamily:"'Poppins',sans-serif", color:"#1a1a2e", background:"#fff" }}/>
        </div>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(26,26,46,.35)" }}>{filtered.length} invoices</span>
        {isCustomer
          ? <button onClick={() => navigate("/customer/products")} style={{ padding:"9px 18px", borderRadius:"11px", border:"none", background:"linear-gradient(135deg,#b45309,#92400e)", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 14px rgba(180,83,9,.25)" }}>+ New Order</button>
          : <button onClick={() => navigate("/sales/desk")} style={{ padding:"9px 18px", borderRadius:"11px", border:"none", background:"linear-gradient(135deg,#0284c7,#0369a1)", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", boxShadow:"0 4px 14px rgba(2,132,199,.25)" }}>+ New Invoice</button>
        }
      </div>

      {/* Table */}
      <div style={{ background:"#fff", borderRadius:"18px", border:"1px solid rgba(26,26,46,.08)", overflow:"hidden", boxShadow:"0 2px 14px rgba(26,26,46,.05)" }}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"rgba(26,26,46,.03)", borderBottom:"1px solid rgba(26,26,46,.07)" }}>
              {["Invoice ID","Customer","Items","Amount","Payment","Status","Date","Actions"].map(h => (
                <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(26,26,46,.35)", letterSpacing:".14em", textTransform:"uppercase", fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ padding:"60px", textAlign:"center", color:"rgba(26,26,46,.3)" }}>Loading invoices…</td></tr>
              : filtered.length === 0
              ? <tr><td colSpan={7} style={{ padding:"60px", textAlign:"center" }}>
                  <div style={{ fontSize:"32px", marginBottom:"10px" }}>🧾</div>
                  <div style={{ fontSize:"14px", fontWeight:600, color:"rgba(26,26,46,.4)" }}>No invoices found</div>
                </td></tr>
              : filtered.map((inv, i) => {
                const d = new Date(inv.createdAt);
                const payColors = { CASH:["#059669","rgba(5,150,105,.08)","rgba(5,150,105,.2)"], UPI:["#0284c7","rgba(2,132,199,.08)","rgba(2,132,199,.2)"], CARD:["#7c3aed","rgba(124,58,237,.08)","rgba(124,58,237,.2)"] };
                const pc = payColors[inv.paymentMethod] || payColors.CASH;
                return (
                  <tr key={inv._id} style={{ borderBottom: i < filtered.length-1 ? "1px solid rgba(26,26,46,.05)" : "none", cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.018)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"14px 16px", fontFamily:"'DM Mono',monospace", fontSize:"12px", fontWeight:700, color:"#0284c7" }}>#{inv._id.slice(-8).toUpperCase()}</td>
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ fontSize:"13.5px", fontWeight:600, color:"#1a1a2e" }}>{inv.customerName || "Walk-in"}</div>
                    </td>
                    <td style={{ padding:"14px 16px", fontSize:"13px", color:"rgba(26,26,46,.55)" }}>{inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}</td>
                    <td style={{ padding:"14px 16px", fontFamily:"'Fraunces',serif", fontSize:"18px", fontWeight:900, color:"#1a1a2e", letterSpacing:"-.02em" }}>₹{(inv.grandTotal || inv.total || 0)?.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"14px 16px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"99px", background:pc[1], border:`1px solid ${pc[2]}`, color:pc[0], fontSize:"10.5px", fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
                        <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"currentColor" }}/>{inv.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      {(() => {
                        const s = inv.status || "PAID";
                        const sc = { PAID:["#059669","rgba(5,150,105,.08)","rgba(5,150,105,.2)"], PENDING:["#d97706","rgba(217,119,6,.08)","rgba(217,119,6,.25)"], CANCELLED:["#dc2626","rgba(239,68,68,.08)","rgba(239,68,68,.2)"] }[s] || ["#059669","rgba(5,150,105,.08)","rgba(5,150,105,.2)"];
                        return (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"99px", background:sc[1], border:`1px solid ${sc[2]}`, color:sc[0], fontSize:"10.5px", fontFamily:"'DM Mono',monospace", fontWeight:700 }}>
                            <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:"currentColor" }}/>{s}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding:"14px 16px", fontSize:"12px", color:"rgba(26,26,46,.5)" }}>
                      {isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                      <div style={{ fontSize:"10.5px", color:"rgba(26,26,46,.3)", fontFamily:"'DM Mono',monospace", marginTop:"2px" }}>{isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                    </td>
                    <td style={{ padding:"14px 16px" }}>
                      <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                        <button onClick={() => navigate(`/billing/invoice/${inv._id}`)} style={{ padding:"5px 12px", borderRadius:"8px", border:"1.5px solid rgba(2,132,199,.25)", background:"rgba(2,132,199,.08)", color:"#0284c7", fontSize:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }}>View</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); printInvoice(inv); }}
                          style={{ padding:"5px 12px", borderRadius:"8px", border:"1.5px solid rgba(26,46,26,.14)", background:"#fff", color:"rgba(26,26,46,.6)", fontSize:"11px", fontWeight:600, cursor:"pointer", fontFamily:"'Poppins',sans-serif" }}>
                          🖨️ Print
                        </button>
                        {canConfirmPayment && inv.status === "PENDING" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setPayError(null); setPayModal({ id: inv._id, grandTotal: inv.grandTotal || inv.total || 0, customerName: inv.customerName || "Customer" }); }}
                            style={{ padding:"5px 12px", borderRadius:"8px", border:"1.5px solid rgba(5,150,105,.3)", background:"rgba(5,150,105,.1)", color:"#059669", fontSize:"11px", fontWeight:700, cursor:"pointer", fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:"4px" }}>
                            ✓ Confirm Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        </div>
      </div>
    </PageShell>
  );
}