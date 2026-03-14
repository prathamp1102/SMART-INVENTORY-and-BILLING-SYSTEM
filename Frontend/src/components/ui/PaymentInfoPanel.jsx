import { useState } from "react";

/**
 * PaymentInfoPanel — Online payment demo panel
 * Props:
 *   method  — "CREDIT_DEBIT" | "UPI" | "BANK_TRANSFER"
 *   amount  — number
 */

const DEMO = {
  upi: { id: "aaru.pvtltd@hdfc", name: "Aaru Pvt Ltd", note: "Invoice Payment" },
  bank: {
    bankName: "HDFC Bank",
    accountName: "Aaru Pvt Ltd",
    accountNumber: "50200098765432",
    ifsc: "HDFC0001234",
    branch: "Valsad Main Branch",
    accountType: "Current",
  },
};

function detectBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MC";
  if (/^6[0-9]/.test(n)) return "RUPAY";
  if (/^3[47]/.test(n)) return "AMEX";
  return null;
}

function BrandBadge({ brand }) {
  const map = { VISA: { label: "VISA", color: "#60a5fa", font: "serif", style: "italic" }, MC: { label: "MC", color: "#ef4444", font: "monospace", style: "normal" }, RUPAY: { label: "RuPay", color: "#34d399", font: "monospace", style: "normal" }, AMEX: { label: "AMEX", color: "#f59e0b", font: "monospace", style: "normal" } };
  if (!brand || !map[brand]) return null;
  const b = map[brand];
  return <span style={{ padding: "2px 8px", borderRadius: "5px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", fontFamily: b.font, fontWeight: 900, fontSize: "11px", color: b.color, fontStyle: b.style }}>{b.label}</span>;
}

function CardInput({ label, value, onChange, placeholder, maxLength, inputMode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "9px", fontFamily: "monospace", color: "rgba(26,26,46,.45)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "5px" }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode}
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", background: "#f8f8fc", color: "#1a1a2e", fontSize: "14px", fontFamily: "monospace", fontWeight: 700, letterSpacing: ".08em", outline: "none" }} />
    </div>
  );
}

/* ── Credit / Debit Card Panel ────────────────────────────── */
function CardPanel({ amount }) {
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardPaid, setCardPaid] = useState(false);
  const [cardPaying, setCardPaying] = useState(false);

  const fmt = v => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
  const brand = detectBrand(cardNum);
  const cardComplete = cardNum.replace(/\s/g, "").length === 16 && cardName.length > 2 && expiry.length === 5 && cvv.length >= 3;

  const handlePay = () => {
    if (!cardComplete) return;
    setCardPaying(true);
    setTimeout(() => { setCardPaying(false); setCardPaid(true); }, 2000);
  };

  if (cardPaid) return (
    <div style={{ marginTop: "14px", background: "linear-gradient(135deg,rgba(5,150,105,.08),rgba(5,150,105,.04))", border: "1.5px solid rgba(5,150,105,.3)", borderRadius: "16px", padding: "24px", textAlign: "center", animation: "fadeIn .3s ease both" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(5,150,105,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 800, color: "#059669", marginBottom: "4px" }}>Payment Successful!</div>
      <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)" }}>₹{amount.toLocaleString("en-IN")} charged to card ending ••{cardNum.replace(/\s/g, "").slice(-2)}</div>
    </div>
  );

  return (
    <div style={{ marginTop: "14px", background: "#fff", border: "1.5px solid rgba(99,102,241,.2)", borderRadius: "16px", padding: "20px", animation: "fadeIn .25s ease both", position: "relative", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", position: "relative" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(99,102,241,.4)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M2 10h20"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e" }}>Pay by Card</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.45)", fontFamily: "monospace" }}>Secure · Encrypted · Instant</div>
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          <div style={{ padding: "3px 7px", borderRadius: "5px", background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)" }}><span style={{ fontFamily: "serif", fontWeight: 900, fontSize: "11px", color: "#1a56ff", fontStyle: "italic" }}>VISA</span></div>
          <div style={{ width: 28, height: 20, borderRadius: "4px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef4444", opacity: .9, position: "absolute", left: "4px" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#f97316", opacity: .9, position: "absolute", right: "4px" }} />
          </div>
          <div style={{ padding: "3px 6px", borderRadius: "5px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.15)" }}><span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "9px", color: "#059669" }}>RuPay</span></div>
        </div>
      </div>

      {/* Card preview */}
      <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08))", border: "1px solid rgba(99,102,241,.15)", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ width: 28, height: 20, borderRadius: "4px", background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }} />
          {brand && <BrandBadge brand={brand} />}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "15px", fontWeight: 700, color: cardNum ? "#1a1a2e" : "rgba(99,102,241,.3)", letterSpacing: ".12em", marginBottom: "10px" }}>{cardNum || "•••• •••• •••• ••••"}</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: cardName ? "#1a1a2e" : "rgba(99,102,241,.3)", textTransform: "uppercase", fontWeight: 700 }}>{cardName || "CARD HOLDER NAME"}</span>
          <span style={{ fontFamily: "monospace", fontSize: "11px", color: expiry ? "#1a1a2e" : "rgba(99,102,241,.3)", fontWeight: 700 }}>{expiry || "MM/YY"}</span>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
        <CardInput label="Card Number" value={cardNum} onChange={e => setCardNum(fmt(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19} inputMode="numeric" />
        <CardInput label="Cardholder Name" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="AS ON CARD" maxLength={26} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <CardInput label="Expiry (MM/YY)" value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5} inputMode="numeric" />
          <CardInput label="CVV" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4} inputMode="numeric" />
        </div>
        {amount > 0 && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.18)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,26,46,.45)", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>Amount to Pay</span>
            <span style={{ fontFamily: "serif", fontSize: "20px", fontWeight: 900, color: "#6366f1" }}>₹{amount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <button onClick={handlePay} disabled={!cardComplete || cardPaying}
          style={{ padding: "12px", borderRadius: "11px", border: "none", background: cardComplete ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(26,26,46,.07)", color: cardComplete ? "#fff" : "rgba(26,26,46,.25)", fontSize: "13px", fontWeight: 800, cursor: cardComplete ? "pointer" : "not-allowed", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {cardPaying ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Processing…</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Pay ₹{amount > 0 ? amount.toLocaleString("en-IN") : "Now"} Securely</>
          )}
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/* ── UPI Panel ──────────────────────────────────────────────── */
function UPIPanel({ amount }) {
  const { id, name, note } = DEMO.upi;
  const upiLink = `upi://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent(name)}&am=${amount > 0 ? amount : ""}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;
  const [copied, setCopied] = useState("");
  const [utrValue, setUtrValue] = useState("");
  const [utrConfirmed, setUtrConfirmed] = useState(false);
  const utrValid = utrValue.trim().length >= 10;
  const copy = (text, key) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2000); }); };

  return (
    <div style={{ marginTop: "14px", background: "linear-gradient(135deg,rgba(124,58,237,.05),rgba(2,132,199,.05))", border: "1.5px solid rgba(124,58,237,.22)", borderRadius: "16px", padding: "18px", animation: "fadeIn .25s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#7c3aed,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2m3 0h.01M14 17h.01M17 17h3M20 14v3"/></svg>
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e" }}>Scan &amp; Pay via UPI</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: "monospace", letterSpacing: ".04em" }}>GPay · PhonePe · Paytm · Any UPI app</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* QR Code */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "8px", border: "1.5px solid rgba(124,58,237,.18)", boxShadow: "0 4px 14px rgba(124,58,237,.1)", flexShrink: 0 }}>
          <img src={qrUrl} width="120" height="120" alt="UPI QR" style={{ display: "block", borderRadius: "5px" }} />
          {amount > 0 && <div style={{ textAlign: "center", marginTop: "6px", fontWeight: 900, fontSize: "14px", color: "#7c3aed", fontFamily: "serif" }}>₹{amount.toLocaleString("en-IN")}</div>}
        </div>

        {/* Details */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ background: "#fff", borderRadius: "10px", border: "1.5px solid rgba(124,58,237,.18)", padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: "4px" }}>Merchant UPI ID</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 800, color: "#7c3aed" }}>{id}</span>
              <button onClick={() => copy(id, "upi")} style={{ padding: "3px 9px", borderRadius: "6px", border: "1px solid rgba(124,58,237,.25)", background: copied === "upi" ? "rgba(124,58,237,.14)" : "rgba(124,58,237,.07)", color: "#7c3aed", fontSize: "9px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied === "upi" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", padding: "9px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,26,46,.45)" }}>Pay to</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a2e" }}>{name}</span>
          </div>
          <div style={{ background: "rgba(5,150,105,.05)", border: "1px solid rgba(5,150,105,.15)", borderRadius: "9px", padding: "8px 11px", fontSize: "10px", color: "#059669", fontFamily: "monospace", lineHeight: 1.6 }}>
            ① Open any UPI app<br/>
            ② Scan QR or enter UPI ID<br/>
            ③ Enter ₹{amount > 0 ? amount.toLocaleString("en-IN") : "amount"} &amp; confirm
          </div>
        </div>
      </div>

      {/* UTR / Transaction ID input */}
      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(124,58,237,.12)", paddingTop: "14px" }}>
        {utrConfirmed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", animation: "fadeIn .25s ease both" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(5,150,105,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#059669" }}>Transaction ID Submitted ✓</div>
              <div style={{ fontSize: "10px", color: "rgba(26,26,46,.45)", fontFamily: "monospace", marginTop: "2px" }}>UTR: {utrValue.trim()}</div>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "rgba(26,26,46,.5)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "7px" }}>
              After paying — enter your UTR / Transaction ID
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={utrValue} onChange={e => setUtrValue(e.target.value)} placeholder="e.g. 425612345678"
                maxLength={22}
                style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1.5px solid rgba(124,58,237,.2)", fontSize: "13px", fontFamily: "monospace", fontWeight: 700, color: "#1a1a2e", outline: "none", background: "#fff", letterSpacing: ".04em" }} />
              <button onClick={() => { if (utrValid) setUtrConfirmed(true); }} disabled={!utrValid}
                style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: utrValid ? "linear-gradient(135deg,#7c3aed,#0284c7)" : "rgba(26,26,46,.08)", color: utrValid ? "#fff" : "rgba(26,26,46,.3)", fontSize: "12px", fontWeight: 800, cursor: utrValid ? "pointer" : "not-allowed", whiteSpace: "nowrap", transition: "all .18s" }}>
                Confirm
              </button>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(26,26,46,.35)", marginTop: "6px", fontFamily: "monospace" }}>
              Find the 12-digit UTR/Ref number in your UPI app after payment
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Bank Transfer Panel ────────────────────────────────────── */
function BankPanel({ amount }) {
  const b = DEMO.bank;
  const [copied, setCopied] = useState("");
  const [utrValue, setUtrValue] = useState("");
  const [utrConfirmed, setUtrConfirmed] = useState(false);
  const utrValid = utrValue.trim().length >= 10;
  const allText = `Bank: ${b.bankName}\nAccount Name: ${b.accountName}\nAccount No: ${b.accountNumber}\nIFSC: ${b.ifsc}\nBranch: ${b.branch}\nType: ${b.accountType}`;
  const copy = (text, key) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2000); }); };

  return (
    <div style={{ marginTop: "14px", background: "linear-gradient(135deg,rgba(2,132,199,.04),rgba(180,83,9,.04))", border: "1.5px solid rgba(2,132,199,.22)", borderRadius: "16px", padding: "18px", animation: "fadeIn .25s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V7m0 0l-4 4m4-4l4 4M3 21h18M3 10.5l9-7.5 9 7.5"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e" }}>Bank Transfer Details</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: "monospace" }}>NEFT · RTGS · IMPS</div>
        </div>
        <button onClick={() => copy(allText, "all")} style={{ padding: "5px 11px", borderRadius: "8px", border: "1px solid rgba(2,132,199,.25)", background: copied === "all" ? "rgba(2,132,199,.12)" : "rgba(2,132,199,.06)", color: "#0284c7", fontSize: "10px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          {copied === "all" ? "✓ Copied" : "Copy All"}
        </button>
      </div>

      {/* Account details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {[
          { label: "Bank Name",      val: b.bankName,      key: "bn",   mono: false, highlight: false },
          { label: "Account Name",   val: b.accountName,   key: "an",   mono: false, highlight: false },
          { label: "Account Number", val: b.accountNumber, key: "num",  mono: true,  highlight: true  },
          { label: "IFSC Code",      val: b.ifsc,          key: "ifsc", mono: true,  highlight: true  },
          { label: "Branch",         val: b.branch,        key: "br",   mono: false, highlight: false },
          { label: "Account Type",   val: b.accountType,   key: "at",   mono: false, highlight: false },
        ].map(row => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: "10px", border: row.highlight ? "1.5px solid rgba(2,132,199,.2)" : "1px solid rgba(26,26,46,.07)", padding: "9px 12px", gap: "8px" }}>
            <span style={{ fontSize: "9px", fontFamily: "monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>{row.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: row.mono ? "monospace" : "inherit", fontSize: row.key === "num" ? "14px" : "13px", fontWeight: row.highlight ? 800 : 600, color: row.highlight ? "#0284c7" : "#1a1a2e", letterSpacing: row.key === "num" ? ".06em" : "normal" }}>
                {row.key === "num" ? row.val.replace(/(.{4})/g, "$1 ").trim() : row.val}
              </span>
              {row.highlight && (
                <button onClick={() => copy(row.val, row.key)} style={{ padding: "2px 7px", borderRadius: "5px", border: "1px solid rgba(2,132,199,.2)", background: copied === row.key ? "rgba(2,132,199,.14)" : "rgba(2,132,199,.06)", color: "#0284c7", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>
                  {copied === row.key ? "✓" : "Copy"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px", padding: "9px 12px", borderRadius: "9px", background: "rgba(5,150,105,.05)", border: "1px solid rgba(5,150,105,.15)", fontSize: "10px", color: "#059669", fontFamily: "monospace", lineHeight: 1.6 }}>
        Transfer ₹{amount > 0 ? amount.toLocaleString("en-IN") : "the amount"} to the above account &amp; share UTR/reference number below.
      </div>

      {/* UTR / Reference Number input */}
      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(2,132,199,.12)", paddingTop: "14px" }}>
        {utrConfirmed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", animation: "fadeIn .25s ease both" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(5,150,105,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#059669" }}>Reference Number Submitted ✓</div>
              <div style={{ fontSize: "10px", color: "rgba(26,26,46,.45)", fontFamily: "monospace", marginTop: "2px" }}>UTR/Ref: {utrValue.trim()}</div>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: "rgba(26,26,46,.5)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "7px" }}>
              After transfer — enter UTR / Reference Number
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={utrValue} onChange={e => setUtrValue(e.target.value)} placeholder="e.g. HDFC000012345678"
                maxLength={22}
                style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: "1.5px solid rgba(2,132,199,.2)", fontSize: "13px", fontFamily: "monospace", fontWeight: 700, color: "#1a1a2e", outline: "none", background: "#fff", letterSpacing: ".04em" }} />
              <button onClick={() => { if (utrValid) setUtrConfirmed(true); }} disabled={!utrValid}
                style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: utrValid ? "linear-gradient(135deg,#0284c7,#0369a1)" : "rgba(26,26,46,.08)", color: utrValid ? "#fff" : "rgba(26,26,46,.3)", fontSize: "12px", fontWeight: 800, cursor: utrValid ? "pointer" : "not-allowed", whiteSpace: "nowrap", transition: "all .18s" }}>
                Confirm
              </button>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(26,26,46,.35)", marginTop: "6px", fontFamily: "monospace" }}>
              Find UTR/Ref number in your bank app or transfer SMS confirmation
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────── */
export default function PaymentInfoPanel({ method, amount = 0 }) {
  if (method === "CREDIT_DEBIT") return <CardPanel amount={amount} />;
  if (method === "UPI")          return <UPIPanel amount={amount} />;
  if (method === "BANK_TRANSFER") return <BankPanel amount={amount} />;
  return null;
}
