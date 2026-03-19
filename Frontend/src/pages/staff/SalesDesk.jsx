/**
 * SalesDesk.jsx
 * Corporate-grade sales desk module.
 * Features: Create Invoice · Add Products to Cart · Generate Bill · Print Invoice · Apply Discount
 */
import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { PageShell } from "../../components/ui/PageShell";
import { BillingContext } from "../../context/BillingContext";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";
import PaymentDetailsPanel from "../../components/ui/PaymentDetailsPanel";

/* ─── Design Tokens ──────────────────────────────────────── */
const C = {
  blue:    "#0284c7",
  blueL:   "rgba(2,132,199,.08)",
  blueBr:  "rgba(2,132,199,.22)",
  green:   "#059669",
  greenL:  "rgba(5,150,105,.08)",
  greenBr: "rgba(5,150,105,.22)",
  purple:  "#7c3aed",
  purpleL: "rgba(124,58,237,.08)",
  purpleBr:"rgba(124,58,237,.2)",
  amber:   "#b45309",
  amberL:  "rgba(180,83,9,.08)",
  amberBr: "rgba(180,83,9,.2)",
  red:     "#dc2626",
  redL:    "rgba(239,68,68,.08)",
  ink:     "#1a1a2e",
  inkA:    (a) => `rgba(26,26,46,${a})`,
  white:   "#fff",
  bg:      "#f8f9fb",
};

const ff = {
  body:  "'Figtree','Inter',sans-serif",
  serif: "'Fraunces',serif",
  mono:  "'DM Mono','Fira Mono',monospace",
};

const PAY_METHODS = [
  { key: "CASH",          label: "Cash",               desc: "Pay at counter / delivery", emoji: "💵", color: "#059669", bg: "rgba(5,150,105,.08)",   border: "rgba(5,150,105,.3)"   },
  { key: "CREDIT_DEBIT",  label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay",   emoji: "💳", color: "#6366f1", bg: "rgba(99,102,241,.08)",  border: "rgba(99,102,241,.3)"  },
  { key: "UPI",           label: "UPI / QR Code",       desc: "GPay, PhonePe, Paytm",      emoji: "📲", color: "#7c3aed", bg: "rgba(124,58,237,.08)",  border: "rgba(124,58,237,.3)"  },
  { key: "BANK_TRANSFER", label: "Bank Transfer",        desc: "NEFT, RTGS, IMPS",          emoji: "🏦", color: "#0284c7", bg: "rgba(2,132,199,.08)",   border: "rgba(2,132,199,.3)"   },
];

/* ─── Tiny helpers ───────────────────────────────────────── */
function Icon({ d, size = 16, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontFamily: ff.mono, fontSize: "9px", color: C.inkA(.38),
      letterSpacing: ".16em", textTransform: "uppercase", marginBottom: "9px" }}>
      {children}
    </div>
  );
}

function Card({ children, style = {}, glow }) {
  return (
    <div style={{
      background: C.white, borderRadius: "18px",
      border: glow ? `1.5px solid ${C.blueBr}` : `1px solid ${C.inkA(.08)}`,
      boxShadow: glow ? `0 0 0 3px ${C.blueL}, 0 4px 20px ${C.inkA(.07)}` : `0 2px 12px ${C.inkA(.05)}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", small, style: sx = {} }) {
  const base = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
    padding: small ? "7px 14px" : "11px 20px",
    borderRadius: small ? "9px" : "12px",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? "12px" : "14px", fontWeight: 700, fontFamily: ff.body,
    transition: "all .18s", ...sx,
  };
  const variants = {
    primary: { background: disabled ? C.inkA(.1) : `linear-gradient(135deg,${C.blue},#0369a1)`, color: disabled ? C.inkA(.3) : C.white, boxShadow: disabled ? "none" : `0 4px 16px rgba(2,132,199,.28)` },
    success: { background: `linear-gradient(135deg,${C.green},#047857)`, color: C.white, boxShadow: `0 4px 16px rgba(5,150,105,.25)` },
    danger:  { background: C.redL, color: C.red, border: `1px solid rgba(239,68,68,.2)` },
    ghost:   { background: "transparent", color: C.inkA(.6), border: `1.5px solid ${C.inkA(.13)}` },
    purple:  { background: `linear-gradient(135deg,${C.purple},#6d28d9)`, color: C.white, boxShadow: `0 4px 16px rgba(124,58,237,.25)` },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

/* ─── Invoice Print View ──────────────────────────────────── */
function InvoicePrint({ inv, onClose, orgName }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const w = window.open("", "_blank", "width=800,height=900");
    w.document.write(`
      <!DOCTYPE html><html><head>
        <title>Invoice #${inv.invoiceNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;padding:0;max-width:700px;margin:auto}
          @media print{button{display:none!important}}
        </style>
      </head><body>${content}</body></html>
    `);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 600);
  };

  const { items, customer, phone, email, subtotal, discountAmt, gst, total, method, invoiceNumber, date, notes } = inv;

  const fmtINR = (n) => "Rs. " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

  return (
    <div style={{ animation: "fadeUp .35s ease both", fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: "10px", background: C.greenL, border: `1px solid ${C.greenBr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={18} color={C.green} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.ink }}>Invoice Generated</div>
            <div style={{ fontSize: "12px", color: C.inkA(.4), marginTop: "1px" }}>#{invoiceNumber}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Btn variant="ghost" small onClick={handlePrint}>
            <Icon d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" size={15} />
            Print Invoice
          </Btn>
          <Btn variant="ghost" small onClick={onClose}>
            <Icon d="M12 4.5v15m7.5-7.5h-15" size={14} style={{ transform: "rotate(45deg)" }} />
            New Invoice
          </Btn>
        </div>
      </div>

      {/* Printable invoice card */}
      <div ref={printRef} style={{ maxWidth: "min(680px, 100%)", background: "#fff", borderRadius: "6px", overflow: "hidden", boxShadow: "0 4px 32px rgba(0,0,0,0.10)", border: "1px solid #e8e8e8" }}>

        {/* ── Dark header bar ── */}
        <div style={{ background: "#1e1b16", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#f5f0e8", letterSpacing: "1px", textTransform: "uppercase" }}>
            {orgName || "EVARA"}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "2px", color: "rgba(245,240,232,0.45)", textTransform: "uppercase", marginBottom: "5px" }}>Invoice</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f5f0e8", letterSpacing: "-0.5px" }}>{invoiceNumber}</div>
            <div style={{ display: "inline-block", marginTop: "8px", padding: "3px 12px", borderRadius: "100px", background: "#22c55e", color: "#fff", fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              PAID
            </div>
          </div>
        </div>

        {/* ── White body ── */}
        <div style={{ padding: "28px 40px", background: "#fff" }}>

          {/* Meta row: Issue Date | Due Date | Payment */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid #ebebeb", borderRadius: "6px", overflow: "hidden", marginBottom: "22px" }}>
            {[
              ["Issue Date", date],
              ["Due Date", "—"],
              ["Payment", method || "CASH"],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "14px 18px", borderRight: "1px solid #ebebeb" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", marginBottom: "5px" }}>{k}</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a1a" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Billed To / Payment Info */}
          {customer && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #ebebeb", borderRadius: "6px", overflow: "hidden", marginBottom: "22px" }}>
              <div style={{ padding: "18px 22px", borderRight: "1px solid #ebebeb" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", marginBottom: "7px" }}>Billed To</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a", marginBottom: "3px" }}>{customer}</div>
                {phone && <div style={{ fontSize: "12px", color: "#666" }}>{phone}</div>}
                {email && <div style={{ fontSize: "12px", color: "#666" }}>{email}</div>}
              </div>
              <div style={{ padding: "18px 22px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", marginBottom: "7px" }}>Payment Info</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "3px" }}>{fmtINR(total)} Received</div>
                <div style={{ fontSize: "12px", color: "#666" }}>via {method || "CASH"}</div>
              </div>
            </div>
          )}

          {/* Items table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e0e0e0" }}>
                {["Item", "Qty", "Unit Price", "Total"].map((h, i) => (
                  <th key={h} style={{ padding: "0 0 10px", textAlign: i === 0 ? "left" : "right", fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "12px 0", verticalAlign: "top" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1a1a", marginBottom: "2px" }}>{item.name}</div>
                    {item.category?.name && <div style={{ fontSize: "11px", color: "#bbb" }}>{item.category.name}</div>}
                  </td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: "13px", color: "#555" }}>{item.qty}</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: "13px", color: "#555" }}>{fmtINR(item.price)}</td>
                  <td style={{ padding: "12px 0", textAlign: "right", fontSize: "13.5px", fontWeight: 600, color: "#1a1a1a" }}>{fmtINR(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: "1.5px solid #e0e0e0", marginBottom: "0" }} />

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <div style={{ width: "260px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "13px", color: "#555" }}>
                <span>Subtotal</span><span style={{ fontWeight: 500, color: "#1a1a1a" }}>{fmtINR(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "13px", color: "#555" }}>
                  <span>Discount</span><span style={{ fontWeight: 600, color: "#ef4444" }}>− {fmtINR(discountAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: "13px", color: "#555" }}>
                <span>Tax (GST)</span><span style={{ fontWeight: 500, color: "#1a1a1a" }}>+ {fmtINR(gst)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1.5px solid #1a1a1a", paddingTop: "12px", marginTop: "6px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>Grand Total</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a" }}>{fmtINR(total)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div style={{ background: "#f9f7f4", borderTop: "1px solid #ebebeb", padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
            {notes || "Thank you for your business!"}
          </div>
          <div style={{ padding: "6px 14px", borderRadius: "100px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={13} color="#16a34a" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a", letterSpacing: "0.5px" }}>PAID · {method}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Cart Item Row ───────────────────────────────────────── */
function CartRow({ item, onQty, onRemove }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.inkA(.05)}` }}>
      <td style={{ padding: "10px 16px" }}>
        <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.ink }}>{item.name}</div>
        <div style={{ fontSize: "11px", color: C.inkA(.4), marginTop: "1px" }}>
          {item.category?.name || "General"} · Stock: {item.stock}
        </div>
      </td>
      <td style={{ padding: "10px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button onClick={() => onQty(item._id, item.qty - 1)}
            style={{ width: 28, height: 28, borderRadius: "8px", border: `1.5px solid ${C.inkA(.14)}`, background: C.white, cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.inkA(.6) }}>−</button>
          <span style={{ fontFamily: ff.mono, fontSize: "14px", fontWeight: 700, color: C.ink, minWidth: "26px", textAlign: "center" }}>{item.qty}</span>
          <button onClick={() => onQty(item._id, item.qty + 1)}
            disabled={item.qty >= item.stock}
            style={{ width: 28, height: 28, borderRadius: "8px", border: `1.5px solid ${C.inkA(.14)}`, background: item.qty >= item.stock ? C.inkA(.04) : C.white, cursor: item.qty >= item.stock ? "not-allowed" : "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: item.qty >= item.stock ? C.inkA(.25) : C.inkA(.6) }}>+</button>
        </div>
      </td>
      <td style={{ padding: "10px 16px", fontFamily: ff.mono, fontSize: "13px", color: C.inkA(.55) }}>₹{item.price?.toLocaleString("en-IN")}</td>
      <td style={{ padding: "10px 16px", fontFamily: ff.mono, fontSize: "14px", fontWeight: 700, color: C.ink }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</td>
      <td style={{ padding: "10px 12px" }}>
        <button onClick={() => onRemove(item._id)}
          style={{ width: 28, height: 28, borderRadius: "8px", border: `1px solid rgba(239,68,68,.2)`, background: C.redL, color: C.red, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d="M6 18L18 6M6 6l12 12" size={12} color={C.red} strokeWidth={2.5} />
        </button>
      </td>
    </tr>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export default function SalesDesk() {
  const { user } = useAuth();
  const { cart, cartTotal, addToCart, updateQty, removeFromCart, clearCart, submitInvoice, loadingBilling } = useContext(BillingContext);

  const [search, setSearch]           = useState("");
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes]                 = useState("");

  const [discountType, setDiscountType] = useState("percent");
  const [discountVal, setDiscountVal]   = useState("");
  const [maxDiscount, setMaxDiscount]   = useState(null);

  const [payMethod, setPayMethod] = useState("CASH");

  const [error, setError]               = useState("");
  const [printInvoice, setPrintInvoice] = useState(null);
  const [orgName, setOrgName]           = useState("");   // ← starts empty; filled from API
  const [step, setStep]                 = useState(1);

  /* ── Load products & org on mount ── */
  useEffect(() => {
    axiosInstance.get("/products").then(r => {
      const arr = Array.isArray(r.data) ? r.data : [];
      setAllProducts(arr.filter(p => p.isActive && p.stock > 0));
    }).catch(() => {});

    axiosInstance.get("/organizations").then(r => {
      // Robustly handle every possible response shape
      let d = null;
      if (Array.isArray(r.data)) {
        d = r.data[0];
      } else if (r.data?.organization) {
        d = r.data.organization;
      } else if (r.data?.data) {
        d = Array.isArray(r.data.data) ? r.data.data[0] : r.data.data;
      } else if (r.data?.organizations) {
        d = Array.isArray(r.data.organizations) ? r.data.organizations[0] : r.data.organizations;
      } else {
        d = r.data;
      }
      if (d?.name) setOrgName(d.name);
      if (d?.maxDiscount != null) setMaxDiscount(d.maxDiscount);
    }).catch(() => {});
  }, []);

  /* Live product search */
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      const q = search.toLowerCase();
      const found = allProducts
        .filter(p => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(q))
        .slice(0, 9);
      setResults(found);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [search, allProducts]);

  /* Discount calculation */
  const discountAmt = (() => {
    const d = parseFloat(discountVal) || 0;
    if (!d) return 0;
    let amt = discountType === "percent" ? Math.round((cartTotal * d) / 100) : Math.min(d, cartTotal);
    if (maxDiscount !== null) {
      const cap = discountType === "percent" ? Math.round((cartTotal * maxDiscount) / 100) : maxDiscount;
      amt = Math.min(amt, cap);
    }
    return amt;
  })();

  const afterDiscount = cartTotal - discountAmt;
  const gst           = Math.round(afterDiscount * 0.18);
  const grandTotal    = afterDiscount + gst;

  const validateDiscount = useCallback(() => {
    if (!discountVal) return true;
    const d = parseFloat(discountVal);
    if (isNaN(d) || d < 0) { setError("Discount must be a positive number."); return false; }
    if (discountType === "percent" && d > 100) { setError("Percentage discount cannot exceed 100%."); return false; }
    if (maxDiscount !== null && discountType === "percent" && d > maxDiscount) {
      setError(`Maximum allowed discount is ${maxDiscount}%. Amount will be capped automatically.`);
    }
    return true;
  }, [discountVal, discountType, maxDiscount]);

  /* Checkout */
  const handleCheckout = async () => {
    setError("");
    if (!cart.length) { setError("Cart is empty. Please add at least one product."); return; }
    if (!validateDiscount()) return;

    const cartSnapshot     = cart.map(i => ({ ...i }));
    const subtotalSnapshot = cartTotal;
    const discountSnapshot = discountAmt;
    const gstSnapshot      = gst;
    const totalSnapshot    = grandTotal;
    const methodSnapshot   = payMethod === "CREDIT_DEBIT" ? "CARD" : payMethod;
    const customerSnapshot = customerName.trim() || null;
    const phoneSnapshot    = customerPhone.trim() || null;
    const emailSnapshot    = customerEmail.trim() || null;
    const notesSnapshot    = notes.trim() || null;
    const dateSnapshot     = new Date().toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    try {
      const data = await submitInvoice({
        paymentMethod: methodSnapshot,
        customerName:  customerSnapshot || "Walk-in Customer",
        customerPhone: phoneSnapshot   || undefined,
        customerEmail: emailSnapshot   || undefined,
        discount:      discountSnapshot,
        taxAmount:     gstSnapshot,
        amountPaid:    totalSnapshot,
        notes:         notesSnapshot,
      });

      const invNum = data?.invoiceNo || data?.invoiceNumber || data?.invoice?.invoiceNo || data?.invoice?.invoiceNumber || ("INV-" + Date.now());

      clearCart();
      setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
      setDiscountVal(""); setNotes(""); setPayMethod("CASH"); setStep(1);

      setPrintInvoice({
        invoiceNumber: invNum,
        items:         cartSnapshot,
        customer:      customerSnapshot,
        phone:         phoneSnapshot,
        email:         emailSnapshot,
        subtotal:      subtotalSnapshot,
        discountAmt:   discountSnapshot,
        gst:           gstSnapshot,
        total:         totalSnapshot,
        method:        methodSnapshot,
        date:          dateSnapshot,
        notes:         notesSnapshot,
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to generate invoice. Please try again.");
    }
  };

  /* ── If invoice printed ─────────────────────────── */
  if (printInvoice) {
    return (
      <PageShell title="Invoice Ready" subtitle="Review, print or share the generated invoice">
        <InvoicePrint inv={printInvoice} onClose={() => setPrintInvoice(null)} orgName={orgName} />
      </PageShell>
    );
  }

  /* ── Main Billing UI ────────────────────────────── */
  const inputStyle = {
    width: "100%", height: "42px", borderRadius: "10px",
    border: `1.5px solid ${C.inkA(.12)}`, outline: "none",
    padding: "0 13px", fontSize: "13.5px", fontFamily: ff.body,
    color: C.ink, background: "#f9f9f8", transition: "border .15s",
  };

  const STEPS = [
    { n: 1, label: "Cart", icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" },
    { n: 2, label: "Customer & Discount", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { n: 3, label: "Payment", icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" },
  ];

  return (
    <PageShell title="Sales Desk" subtitle={`Create invoice · Add products · Apply discount · Generate & print bill`}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .prod-row:hover{background:${C.blueL}!important}
        .inp-focus:focus{border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blueL}!important}
        .step-btn:hover{background:${C.inkA(.04)}!important}
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px", alignItems: "start" }}>

        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Step Tabs */}
          <Card style={{ padding: "6px 8px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {STEPS.map(s => (
                <button key={s.n} className="step-btn"
                  onClick={() => setStep(s.n)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                    padding: "10px 12px", borderRadius: "12px", border: "none", cursor: "pointer",
                    background: step === s.n ? C.blueL : "transparent",
                    color: step === s.n ? C.blue : C.inkA(.45),
                    fontFamily: ff.body, fontSize: "13px", fontWeight: step === s.n ? 700 : 500,
                    transition: "all .15s", borderBottom: step === s.n ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
                  }}>
                  <Icon d={s.icon} size={14} color={step === s.n ? C.blue : C.inkA(.35)} />
                  {s.label}
                  {s.n === 1 && cart.length > 0 && (
                    <span style={{ background: C.blue, color: C.white, borderRadius: "99px", fontSize: "10px", fontFamily: ff.mono, fontWeight: 700, padding: "1px 7px", marginLeft: "2px" }}>{cart.length}</span>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* STEP 1: Cart + Product Search */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "fadeUp .3s ease both" }}>
              <Card style={{ padding: "20px" }}>
                <Label>Search Product / Scan Barcode</Label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.inkA(.35)} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Type product name, barcode or SKU…"
                    className="inp-focus"
                    style={{ ...inputStyle, height: "50px", paddingLeft: "44px", paddingRight: "42px", fontSize: "14px", background: C.white, border: `1.5px solid ${C.inkA(.14)}` }}
                  />
                  {search && (
                    <button onClick={() => { setSearch(""); setResults([]); }}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: C.inkA(.08), border: "none", borderRadius: "6px", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon d="M6 18L18 6M6 6l12 12" size={12} color={C.inkA(.5)} strokeWidth={2.5} />
                    </button>
                  )}
                  {searching && <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, borderRadius: "50%", border: `2px solid ${C.inkA(.15)}`, borderTopColor: C.blue, animation: "spin .6s linear infinite" }} />}
                </div>

                {results.length > 0 && (
                  <div style={{ marginTop: "8px", borderRadius: "14px", border: `1.5px solid ${C.inkA(.1)}`, boxShadow: `0 8px 32px ${C.inkA(.12)}`, overflow: "hidden", animation: "slideIn .2s ease both" }}>
                    {results.map((p, i) => {
                      const inCart = cart.find(c => c._id === p._id);
                      return (
                        <div key={p._id} className="prod-row"
                          onClick={() => { addToCart(p); setSearch(""); setResults([]); }}
                          style={{ display: "flex", alignItems: "center", gap: "13px", padding: "12px 16px", cursor: "pointer", borderBottom: i < results.length - 1 ? `1px solid ${C.inkA(.06)}` : "none", background: C.white, transition: "background .15s" }}>
                          <div style={{ width: 40, height: 40, borderRadius: "11px", background: C.blueL, border: `1px solid ${C.blueBr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m16.5 0l-1.5-4.5H5.25L3.75 7.5m16.5 0H3.75" size={17} color={C.blue} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13.5px", fontWeight: 600, color: C.ink }}>{p.name}</div>
                            <div style={{ fontSize: "11px", color: C.inkA(.42), marginTop: "2px" }}>
                              {p.category?.name || "General"} · SKU: {p.sku || "—"} · Stock: <span style={{ color: p.stock < 5 ? C.amber : C.green, fontWeight: 600 }}>{p.stock}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontFamily: ff.serif, fontSize: "17px", fontWeight: 800, color: C.ink }}>₹{p.price?.toLocaleString("en-IN")}</div>
                            {inCart ? (
                              <div style={{ fontSize: "10px", color: C.green, fontFamily: ff.mono, fontWeight: 700 }}>✓ In cart ({inCart.qty})</div>
                            ) : (
                              <div style={{ fontSize: "10px", color: C.inkA(.3), fontFamily: ff.mono }}>+ Add to cart</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {search.trim() && results.length === 0 && !searching && (
                  <div style={{ marginTop: "8px", padding: "20px", textAlign: "center", color: C.inkA(.35), fontSize: "13px", background: C.inkA(.02), borderRadius: "12px", border: `1px solid ${C.inkA(.06)}` }}>
                    No products found for "<strong>{search}</strong>"
                  </div>
                )}
              </Card>

              {/* Cart Table */}
              <Card>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.inkA(.06)}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" size={16} color={C.blue} />
                    <span style={{ fontFamily: ff.serif, fontSize: "16px", fontWeight: 800, color: C.ink }}>Cart Items</span>
                    <span style={{ fontFamily: ff.mono, fontSize: "10px", color: C.inkA(.38) }}>{cart.length} {cart.length === 1 ? "item" : "items"}</span>
                  </div>
                  {cart.length > 0 && (
                    <Btn variant="danger" small onClick={clearCart}>
                      <Icon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" size={13} />
                      Clear All
                    </Btn>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div style={{ padding: "70px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: "44px", marginBottom: "14px" }}>🛒</div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: C.inkA(.4) }}>Your cart is empty</div>
                    <div style={{ fontSize: "12px", color: C.inkA(.28), marginTop: "5px" }}>Search for a product above to add it to the cart</div>
                  </div>
                ) : (
                  <>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: C.inkA(.025) }}>
                            {["Product", "Quantity", "Unit Price", "Line Total", ""].map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: ff.mono, fontSize: "9px", color: C.inkA(.35), letterSpacing: ".14em", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map(item => (
                            <CartRow key={item._id} item={item} onQty={updateQty} onRemove={removeFromCart} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.inkA(.06)}`, display: "flex", justifyContent: "flex-end" }}>
                      <Btn onClick={() => setStep(2)}>
                        Continue to Customer Details
                        <Icon d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" size={14} color={C.white} />
                      </Btn>
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}

          {/* STEP 2: Customer + Discount */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "fadeUp .3s ease both" }}>
              <Card style={{ padding: "20px 22px" }}>
                <Label>Customer Information</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: C.inkA(.5), marginBottom: "5px" }}>Name <span style={{ color: C.inkA(.3) }}>(optional)</span></div>
                    <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name…" className="inp-focus" style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: C.inkA(.5), marginBottom: "5px" }}>Phone <span style={{ color: C.inkA(.3) }}>(optional)</span></div>
                    <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="inp-focus" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ fontSize: "12px", color: C.inkA(.5), marginBottom: "5px" }}>Email <span style={{ color: C.inkA(.3) }}>(optional)</span></div>
                    <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" type="email" className="inp-focus" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ fontSize: "12px", color: C.inkA(.5), marginBottom: "5px" }}>Invoice Notes <span style={{ color: C.inkA(.3) }}>(optional)</span></div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes for this invoice…" className="inp-focus"
                      style={{ ...inputStyle, height: "80px", padding: "10px 13px", resize: "vertical", lineHeight: "1.5" }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <Label>Apply Discount</Label>
                  {maxDiscount !== null && (
                    <span style={{ fontFamily: ff.mono, fontSize: "10px", padding: "3px 9px", borderRadius: "99px", background: C.amberL, border: `1px solid ${C.amberBr}`, color: C.amber }}>
                      Max allowed: {maxDiscount}%
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", borderRadius: "10px", border: `1.5px solid ${C.inkA(.12)}`, overflow: "hidden", flexShrink: 0 }}>
                    {[["percent", "% Percent"], ["flat", "₹ Flat"]].map(([key, sym]) => (
                      <button key={key} onClick={() => { setDiscountType(key); setDiscountVal(""); }}
                        style={{ padding: "9px 16px", border: "none", cursor: "pointer", fontSize: "12.5px", fontWeight: 700, fontFamily: ff.mono, background: discountType === key ? C.ink : "transparent", color: discountType === key ? C.white : C.inkA(.5), transition: "all .15s" }}>
                        {sym}
                      </button>
                    ))}
                  </div>
                  <input type="number" min="0" max={discountType === "percent" ? 100 : undefined}
                    value={discountVal} onChange={e => { setDiscountVal(e.target.value); setError(""); }}
                    onBlur={validateDiscount}
                    placeholder={discountType === "percent" ? "Enter 0 – 100" : "Enter amount"}
                    className="inp-focus"
                    style={{ ...inputStyle, flex: 1, fontFamily: ff.mono, fontSize: "16px", fontWeight: 700 }}
                  />
                </div>
                {discountAmt > 0 && (
                  <div style={{ padding: "12px 14px", borderRadius: "12px", background: C.greenL, border: `1px solid ${C.greenBr}`, display: "flex", justifyContent: "space-between", alignItems: "center", animation: "slideIn .2s ease both" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon d="M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.625-3.375 2.25-3.375-2.25-4.125 2.625V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" size={16} color={C.green} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: C.green }}>Discount applied</span>
                    </div>
                    <span style={{ fontFamily: ff.mono, fontSize: "16px", fontWeight: 800, color: C.green }}>−₹{discountAmt.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {discountAmt > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      ["Subtotal", `₹${cartTotal.toLocaleString("en-IN")}`, null],
                      ["Discount", `−₹${discountAmt.toLocaleString("en-IN")}`, C.green],
                      ["After Discount", `₹${afterDiscount.toLocaleString("en-IN")}`, C.blue],
                    ].map(([k, v, col]) => (
                      <div key={k} style={{ flex: 1, minWidth: "100px", padding: "10px 12px", borderRadius: "10px", background: C.inkA(.025), border: `1px solid ${C.inkA(.07)}` }}>
                        <div style={{ fontFamily: ff.mono, fontSize: "9px", color: C.inkA(.38), letterSpacing: ".12em", marginBottom: "4px" }}>{k.toUpperCase()}</div>
                        <div style={{ fontFamily: ff.serif, fontSize: "15px", fontWeight: 800, color: col || C.ink }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div style={{ display: "flex", gap: "10px" }}>
                <Btn variant="ghost" onClick={() => setStep(1)}>
                  <Icon d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" size={14} />
                  Back to Cart
                </Btn>
                <Btn onClick={() => setStep(3)} style={{ flex: 1 }}>
                  Continue to Payment
                  <Icon d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" size={14} color={C.white} />
                </Btn>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "fadeUp .3s ease both" }}>
              <Card style={{ padding: "20px 22px" }}>
                <Label>Select Payment Method</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "4px" }}>
                  {PAY_METHODS.map(m => {
                    const sel = payMethod === m.key;
                    return (
                      <button key={m.key} onClick={() => setPayMethod(m.key)}
                        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "13px 14px", borderRadius: "14px", border: sel ? `2px solid ${m.color}` : `1.5px solid ${C.inkA(.1)}`, background: sel ? m.bg : "#fafafa", cursor: "pointer", textAlign: "left", transition: "all .15s", outline: "none", fontFamily: ff.body }}>
                        <span style={{ fontSize: "22px", flexShrink: 0, lineHeight: 1 }}>{m.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: 800, color: sel ? m.color : C.ink, lineHeight: 1.2 }}>{m.label}</div>
                          <div style={{ fontSize: "10px", color: C.inkA(.4), marginTop: "2px" }}>{m.desc}</div>
                        </div>
                        {sel && (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {payMethod === "CASH" && (
                  <div style={{ marginTop: "12px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.18)", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px" }}>🧾</span>
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600, lineHeight: 1.5 }}>Collect cash from customer and generate invoice.</span>
                  </div>
                )}
                {payMethod !== "CASH" && (
                  <PaymentDetailsPanel payMethod={payMethod} amount={grandTotal} />
                )}
              </Card>

              {error && (
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: C.redL, border: `1px solid rgba(239,68,68,.22)`, color: C.red, fontSize: "13px", display: "flex", gap: "9px", alignItems: "flex-start" }}>
                  <Icon d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" size={16} color={C.red} />
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <Btn variant="ghost" onClick={() => setStep(2)}>
                  <Icon d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" size={14} />
                  Back
                </Btn>
                <Btn onClick={handleCheckout} disabled={!cart.length || loadingBilling} style={{ flex: 1 }} variant="success">
                  {loadingBilling ? (
                    <>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid rgba(255,255,255,.3)`, borderTopColor: C.white, animation: "spin .7s linear infinite" }} />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={16} color={C.white} />
                      Generate Invoice · ₹{grandTotal.toLocaleString("en-IN")}
                    </>
                  )}
                </Btn>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Bill Summary ────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "sticky", top: "20px" }}>

          <Card style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${C.purple},#6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "15px", fontWeight: 800, color: C.white }}>
                {user?.name?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "Staff"}</div>
                <div style={{ fontSize: "11px", color: C.inkA(.4), fontFamily: ff.mono }}>{user?.role || "STAFF"}</div>
              </div>
              <div style={{ fontFamily: ff.mono, fontSize: "10px", color: C.inkA(.35) }}>
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
            </div>
          </Card>

          <Card style={{ padding: "20px" }}>
            <Label>Bill Summary</Label>
            {cart.length > 0 && (
              <div style={{ marginBottom: "16px", maxHeight: "200px", overflowY: "auto" }}>
                {cart.map((item, i) => (
                  <div key={item._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < cart.length - 1 ? `1px solid ${C.inkA(.05)}` : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontSize: "10.5px", color: C.inkA(.4), fontFamily: ff.mono }}>×{item.qty} @ ₹{item.price?.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ fontFamily: ff.mono, fontSize: "12.5px", fontWeight: 700, color: C.ink, marginLeft: "10px", flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { k: "Subtotal", v: `₹${cartTotal.toLocaleString("en-IN")}`, col: null },
                discountAmt > 0 ? { k: "Discount", v: `−₹${discountAmt.toLocaleString("en-IN")}`, col: C.green } : null,
                { k: "GST (18%)", v: `₹${gst.toLocaleString("en-IN")}`, col: null },
              ].filter(Boolean).map(row => (
                <div key={row.k} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: C.inkA(.5) }}>{row.k}</span>
                  <span style={{ fontFamily: ff.mono, fontSize: "13px", color: row.col || C.inkA(.7), fontWeight: row.col ? 700 : 500 }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `2px solid ${C.inkA(.08)}`, paddingTop: "14px", marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: ff.serif, fontSize: "15px", fontWeight: 700, color: C.ink }}>Grand Total</span>
              <span style={{ fontFamily: ff.serif, fontSize: "26px", fontWeight: 900, color: C.ink, letterSpacing: "-.03em" }}>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: C.inkA(.025), border: `1px solid ${C.inkA(.07)}`, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{PAY_METHODS.find(m => m.key === payMethod)?.emoji}</span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: C.inkA(.55) }}>{PAY_METHODS.find(m => m.key === payMethod)?.label}</span>
            </div>
          </Card>

          {cart.length > 0 && (
            <Card style={{ padding: "16px" }}>
              <Label>Quick Actions</Label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {step !== 3 && (
                  <Btn variant="success" onClick={() => setStep(3)} disabled={!cart.length} style={{ width: "100%" }}>
                    <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={15} color={C.white} />
                    Generate Invoice
                  </Btn>
                )}
                <Btn variant="ghost" onClick={clearCart} style={{ width: "100%" }}>
                  <Icon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" size={13} />
                  Clear Cart
                </Btn>
              </div>
            </Card>
          )}

          {cart.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", background: C.inkA(.02), borderRadius: "14px", border: `1px dashed ${C.inkA(.1)}` }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛒</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.inkA(.35) }}>Cart is empty</div>
              <div style={{ fontSize: "11px", color: C.inkA(.25), marginTop: "3px" }}>Search products to build an invoice</div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
