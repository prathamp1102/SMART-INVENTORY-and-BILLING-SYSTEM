import { useState } from "react";
import { sendInvoiceEmail } from "../../services/billingService";

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLE_INVOICE = {
  invoiceNumber: "INV-00015",
  status: "PAID",
  createdAt: new Date("2026-03-11T14:30:00"),
  dueDate: null,
  organization: {
    name: "EVARA",
    gstNumber: "GST27ABCDE1234F1Z5",
    address: "12, Commerce Park, Surat, Gujarat 395003",
    phone: "+91 98765 43210",
    email: "billing@smartinventory.in",
  },
  branch: { branchName: "Main Branch", city: "Surat" },
  cashier: { name: "Pratham Patel", email: "pratham.jala@gmail.com" },
  customerName: "Pratham",
  customerPhone: "9874565412",
  paymentMode: "CASH",
  notes: "Thank you for your business!",
  items: [
    { productName: "Home UPS", barcode: "BAR003", qty: 1, unitPrice: 2000, discount: 0, taxRate: 18, total: 2000 },
  ],
  subtotal: 2000,
  discountAmount: 200,
  taxAmount: 324,
  grandTotal: 2124,
  amountPaid: 2124,
  change: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  "Rs. " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  if (isNaN(parsed)) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_STYLES = {
  PAID:      { bg: "#22c55e", color: "#fff", label: "PAID" },
  PENDING:   { bg: "#eab308", color: "#fff", label: "PENDING" },
  CANCELLED: { bg: "#ef4444", color: "#fff", label: "CANCELLED" },
};

const PRINT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  @media print {
    body * { visibility: hidden !important; }
    #invoice-root, #invoice-root * { visibility: visible !important; }
    #invoice-root { position: fixed; inset: 0; background: white; }
    .no-print { display: none !important; }
  }
`;

export default function Invoice({ data = SAMPLE_INVOICE, onBack }) {
  const [printing, setPrinting]             = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput]         = useState("");
  const [emailStatus, setEmailStatus]       = useState(null);
  const [emailMsg, setEmailMsg]             = useState("");

  const inv    = data;
  const status = STATUS_STYLES[inv.status] || STATUS_STYLES.PAID;
  const org    = inv.branch?.organization || inv.organization || {};

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const handleOpenEmailModal = () => {
    setEmailInput(""); setEmailStatus(null); setEmailMsg("");
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    const emailToSend = emailInput.trim();
    if (!emailToSend || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToSend)) {
      setEmailStatus("error"); setEmailMsg("Please enter a valid email address."); return;
    }
    setEmailStatus("sending");
    try {
      const invoiceId = inv._id || inv.id;
      if (!invoiceId) throw new Error("Invoice ID not available in preview mode.");
      const result = await sendInvoiceEmail(invoiceId, emailToSend);
      setEmailStatus("sent");
      setEmailMsg(result.message || `Invoice sent to ${emailToSend}`);
    } catch (err) {
      setEmailStatus("error");
      setEmailMsg(err.response?.data?.message || "Failed to send email. Please try again.");
    }
  };

  return (
    <>
      <style>{PRINT_STYLE}</style>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0ece4; font-family: 'Inter', sans-serif; }
        .page-wrap { min-height: 100vh; background: #f0ece4; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }

        /* Toolbar */
        .toolbar { width: 100%; max-width: 700px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .toolbar-left { display: flex; align-items: center; gap: 14px; }
        .toolbar-right { display: flex; align-items: center; gap: 10px; }
        .toolbar-title { font-size: 18px; font-weight: 600; color: #2d2416; }
        .btn-back { display: flex; align-items: center; gap: 6px; background: transparent; color: #7a6a55; border: 1.5px solid #d6cfc4; border-radius: 8px; padding: 8px 16px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn-back:hover { border-color: #a09280; color: #2d2416; }
        .btn-email { display: flex; align-items: center; gap: 8px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn-email:hover { background: #4338ca; }
        .btn-print { display: flex; align-items: center; gap: 8px; background: #1f1f1f; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn-print:hover { background: #333; }

        /* Email Modal */
        .email-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .email-modal { background: #fff; border-radius: 16px; padding: 36px 32px; max-width: 420px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .email-modal h3 { font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; }
        .email-modal p { font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.6; }
        .email-modal input { width: 100%; padding: 11px 16px; border: 1.5px solid #e0e0e0; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 14px; color: #1a1a1a; outline: none; transition: border-color 0.2s; margin-bottom: 14px; }
        .email-modal input:focus { border-color: #4f46e5; }
        .email-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel-modal { padding: 9px 20px; border-radius: 8px; border: 1.5px solid #e0e0e0; background: transparent; color: #666; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; }
        .btn-send-email { padding: 9px 22px; border-radius: 8px; border: none; background: #4f46e5; color: #fff; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-send-email:disabled { background: #a5b4fc; cursor: not-allowed; }
        .email-feedback { font-size: 13px; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; }
        .email-feedback.success { background: #dcfce7; color: #16a34a; }
        .email-feedback.error   { background: #fee2e2; color: #dc2626; }

        /* Invoice Card */
        #invoice-root { width: 100%; max-width: 700px; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.10); }

        /* Dark top header bar */
        .inv-header { background: #1e1b16; padding: 36px 44px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
        .org-name { font-size: 26px; font-weight: 700; color: #f5f0e8; letter-spacing: 1px; text-transform: uppercase; }
        .inv-id-block { text-align: right; }
        .inv-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; color: rgba(245,240,232,0.45); text-transform: uppercase; margin-bottom: 6px; }
        .inv-number { font-size: 28px; font-weight: 700; color: #f5f0e8; letter-spacing: -0.5px; }
        .status-badge { display: inline-block; margin-top: 10px; padding: 4px 14px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

        /* White body */
        .inv-body { padding: 32px 44px; background: #fff; }

        /* Meta row */
        .inv-meta-row { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #ebebeb; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
        .meta-cell { padding: 16px 20px; border-right: 1px solid #ebebeb; }
        .meta-cell:last-child { border-right: none; }
        .meta-key { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999; margin-bottom: 6px; }
        .meta-val { font-size: 13px; color: #1a1a1a; font-weight: 600; }

        /* Parties */
        .inv-parties { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ebebeb; border-radius: 6px; overflow: hidden; margin-bottom: 28px; }
        .party-block { padding: 20px 24px; border-right: 1px solid #ebebeb; }
        .party-block:last-child { border-right: none; }
        .section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
        .party-name { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
        .party-detail { font-size: 12.5px; color: #666; }
        .payment-received { font-size: 15px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }

        /* Table */
        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table thead tr { border-bottom: 1.5px solid #e0e0e0; }
        .inv-table th { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #999; padding: 0 0 10px; text-align: left; }
        .inv-table th:not(:first-child) { text-align: right; }
        .inv-table tbody tr { border-bottom: 1px solid #f5f5f5; }
        .inv-table tbody tr:last-child { border-bottom: none; }
        .inv-table td { padding: 12px 0; font-size: 13px; color: #1a1a1a; vertical-align: top; }
        .inv-table td:not(:first-child) { text-align: right; }
        .item-name { font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .item-barcode { font-size: 11px; color: #bbb; letter-spacing: 0.5px; }
        .disc-tag { display: inline-block; background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
        .inv-divider { border: none; border-top: 1.5px solid #e0e0e0; margin: 4px 0 0; }

        /* Totals */
        .inv-totals-row { display: flex; justify-content: flex-end; margin-top: 16px; }
        .totals-box { width: 260px; }
        .total-line { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; color: #555; }
        .total-line.grand { padding: 12px 0 0; margin-top: 6px; border-top: 1.5px solid #1a1a1a; }
        .total-line.grand .tl-label { font-size: 15px; font-weight: 700; color: #1a1a1a; }
        .total-line.grand .tl-val { font-size: 18px; font-weight: 700; color: #1a1a1a; }
        .tl-label { color: #555; }
        .tl-val { font-weight: 500; color: #1a1a1a; }
        .tl-val.discount { color: #ef4444; font-weight: 600; }

        /* Footer */
        .inv-footer { background: #f9f7f4; border-top: 1px solid #ebebeb; padding: 20px 44px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; }
        .footer-note { font-size: 12.5px; color: #999; font-style: italic; }
        .cashier-block { text-align: right; }
        .cashier-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #bbb; margin-bottom: 3px; }
        .cashier-name  { font-size: 14px; color: #1a1a1a; font-weight: 600; }
        .cashier-email { font-size: 11.5px; color: #999; }

        @media (max-width: 600px) {
          .inv-header { padding: 28px 24px; flex-direction: column; gap: 16px; }
          .inv-id-block { text-align: left; }
          .inv-body { padding: 24px 20px; }
          .inv-meta-row { grid-template-columns: 1fr 1fr; }
          .meta-cell:nth-child(3) { grid-column: span 2; border-top: 1px solid #ebebeb; }
          .inv-parties { grid-template-columns: 1fr; }
          .party-block { border-right: none; border-bottom: 1px solid #ebebeb; }
          .party-block:last-child { border-bottom: none; }
          .inv-footer { padding: 20px; flex-direction: column; gap: 12px; align-items: flex-start; }
          .cashier-block { text-align: left; }
        }
      `}</style>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEmailModal(false); }}>
          <div className="email-modal">
            <h3>📧 Email Invoice</h3>
            <p>Send this invoice as a PDF to the customer's email address.</p>
            {emailStatus === "sent" ? (
              <>
                <div className="email-feedback success">✅ {emailMsg}</div>
                <div className="email-modal-actions">
                  <button className="btn-cancel-modal" onClick={() => setShowEmailModal(false)}>Close</button>
                </div>
              </>
            ) : (
              <>
                {emailStatus === "error" && <div className="email-feedback error">⚠️ {emailMsg}</div>}
                <input type="email" placeholder="customer@email.com" value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendEmail()} autoFocus />
                <div className="email-modal-actions">
                  <button className="btn-cancel-modal" onClick={() => setShowEmailModal(false)}>Cancel</button>
                  <button className="btn-send-email" onClick={handleSendEmail} disabled={emailStatus === "sending"}>
                    {emailStatus === "sending" ? "Sending…" : "Send PDF"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="page-wrap">
        {/* Toolbar */}
        <div className="toolbar no-print">
          <div className="toolbar-left">
            {onBack && <button className="btn-back" onClick={onBack}>← Back</button>}
            <span className="toolbar-title">Invoice Preview</span>
          </div>
          <div className="toolbar-right">
            <button className="btn-email" onClick={handleOpenEmailModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Email to Customer
            </button>
            <button className="btn-print" onClick={handlePrint}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              {printing ? "Printing…" : "Print / Save PDF"}
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div id="invoice-root">

          {/* Dark Header */}
          <div className="inv-header">
            <div className="org-name">{org.name || "EVARA"}</div>
            <div className="inv-id-block">
              <div className="inv-label">Invoice</div>
              <div className="inv-number">{inv.invoiceNo || inv.invoiceNumber || "—"}</div>
              <div className="status-badge" style={{ background: status.bg, color: status.color }}>
                {status.label}
              </div>
            </div>
          </div>

          {/* White Body */}
          <div className="inv-body">

            {/* Meta row */}
            <div className="inv-meta-row">
              <div className="meta-cell">
                <div className="meta-key">Issue Date</div>
                <div className="meta-val">{fmtDate(inv.createdAt)}</div>
              </div>
              <div className="meta-cell">
                <div className="meta-key">Due Date</div>
                <div className="meta-val">{inv.dueDate ? fmtDate(inv.dueDate) : "—"}</div>
              </div>
              <div className="meta-cell">
                <div className="meta-key">Payment</div>
                <div className="meta-val">{inv.paymentMode || "—"}</div>
              </div>
            </div>

            {/* Billed To / Payment Info */}
            <div className="inv-parties">
              <div className="party-block">
                <div className="section-label">Billed To</div>
                <div className="party-name">{inv.customerName || "Walk-in Customer"}</div>
                <div className="party-detail">{inv.customerPhone || "—"}</div>
              </div>
              <div className="party-block">
                <div className="section-label">Payment Info</div>
                <div className="payment-received">{fmt(inv.amountPaid)} Received</div>
                <div className="party-detail">via {inv.paymentMode || "—"}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: "38%" }}>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className="item-name">{item.productName || "—"}</div>
                      {item.barcode && <div className="item-barcode">{item.barcode}</div>}
                    </td>
                    <td>{item.qty}</td>
                    <td>{fmt(item.unitPrice)}</td>
                    <td>
                      {item.discount > 0
                        ? <span className="disc-tag">{item.discount}%</span>
                        : <span style={{ color: "#ccc" }}>—</span>}
                    </td>
                    <td>{item.taxRate > 0 ? `${item.taxRate}%` : <span style={{ color: "#ccc" }}>—</span>}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="inv-divider" />

            {/* Totals */}
            <div className="inv-totals-row">
              <div className="totals-box">
                <div className="total-line">
                  <span className="tl-label">Subtotal</span>
                  <span className="tl-val">{fmt(inv.subtotal)}</span>
                </div>
                {inv.discountAmount > 0 && (
                  <div className="total-line">
                    <span className="tl-label">Discount</span>
                    <span className="tl-val discount">− {fmt(inv.discountAmount)}</span>
                  </div>
                )}
                {inv.taxAmount > 0 && (
                  <div className="total-line">
                    <span className="tl-label">Tax (GST)</span>
                    <span className="tl-val">+ {fmt(inv.taxAmount)}</span>
                  </div>
                )}
                <div className="total-line grand">
                  <span className="tl-label">Grand Total</span>
                  <span className="tl-val">{fmt(inv.grandTotal)}</span>
                </div>
                {inv.change > 0 && (
                  <div className="total-line" style={{ paddingTop: 8 }}>
                    <span className="tl-label">Change Returned</span>
                    <span className="tl-val" style={{ color: "#16a34a", fontWeight: 600 }}>{fmt(inv.change)}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="inv-footer">
            <div className="footer-note">{inv.notes || "Thank you for your business!"}</div>
            <div className="cashier-block">
              <div className="cashier-label">Served By</div>
              <div className="cashier-name">{inv.cashier?.name || "—"}</div>
              <div className="cashier-email">{inv.cashier?.email || ""}</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
