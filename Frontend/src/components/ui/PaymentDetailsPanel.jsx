import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";

/**
 * PaymentDetailsPanel
 * Staff-side payment details panel.
 * Props:
 *   payMethod  — "UPI" | "BANK_TRANSFER" | "CREDIT_DEBIT"
 *   amount     — number
 */

const ff = { mono: "'DM Mono','Fira Mono',monospace", body: "'Figtree','Inter',sans-serif", serif: "'Fraunces',serif" };

function detectBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return "VISA";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "MC";
  if (/^6[0-9]/.test(n)) return "RUPAY";
  if (/^3[47]/.test(n)) return "AMEX";
  return null;
}

function BrandBadge({ brand }) {
  const map = { VISA: { label: "VISA", color: "#1a56ff", font: "serif", style: "italic" }, MC: { label: "MC", color: "#ef4444", font: "monospace", style: "normal" }, RUPAY: { label: "RuPay", color: "#059669", font: "monospace", style: "normal" }, AMEX: { label: "AMEX", color: "#f59e0b", font: "monospace", style: "normal" } };
  if (!brand || !map[brand]) return null;
  const b = map[brand];
  return <span style={{ padding: "2px 7px", borderRadius: "5px", background: "rgba(26,26,46,.06)", border: "1px solid rgba(26,26,46,.1)", fontFamily: b.font, fontWeight: 900, fontSize: "11px", color: b.color, fontStyle: b.style }}>{b.label}</span>;
}

function CInput({ label, value, onChange, placeholder, maxLength, inputMode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "9px", fontFamily: ff.mono, color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "5px" }}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength} inputMode={inputMode}
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "10px", border: "1.5px solid rgba(26,26,46,.12)", background: "#f9f9f8", color: "#1a1a2e", fontSize: "14px", fontFamily: ff.mono, fontWeight: 700, letterSpacing: ".06em", outline: "none", transition: "border .15s" }}
        onFocus={e => e.target.style.borderColor = "#6366f1"}
        onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
      />
    </div>
  );
}

/* ── Card Panel ───────────────────────────────────────────── */
function CardPanel({ amount }) {
  const [cardNum, setCardNum]   = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry]     = useState("");
  const [cvv, setCvv]           = useState("");
  const [paid, setPaid]         = useState(false);
  const [paying, setPaying]     = useState(false);

  const fmt    = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp = v => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2) : d; };
  const brand  = detectBrand(cardNum);
  const done   = cardNum.replace(/\s/g,"").length === 16 && cardName.length > 2 && expiry.length === 5 && cvv.length >= 3;

  const handlePay = () => { if (!done) return; setPaying(true); setTimeout(() => { setPaying(false); setPaid(true); }, 1800); };

  if (paid) return (
    <div style={{ marginTop: "14px", background: "rgba(5,150,105,.06)", border: "1.5px solid rgba(5,150,105,.25)", borderRadius: "14px", padding: "20px", textAlign: "center", animation: "fadeUp .3s ease both" }}>
      <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div style={{ fontSize: "14px", fontWeight: 800, color: "#059669", fontFamily: ff.body }}>Card Payment Successful</div>
      <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono, marginTop: "4px" }}>₹{amount.toLocaleString("en-IN")} · ••{cardNum.replace(/\s/g,"").slice(-2)}</div>
    </div>
  );

  return (
    <div style={{ marginTop: "14px", background: "#fff", border: "1.5px solid rgba(99,102,241,.2)", borderRadius: "16px", padding: "18px", animation: "fadeUp .3s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 10px rgba(99,102,241,.3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M2 10h20"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e", fontFamily: ff.body }}>Pay by Card</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono }}>Secure · Encrypted · Instant</div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <span style={{ padding: "2px 7px", borderRadius: "5px", background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.15)", fontFamily: "serif", fontWeight: 900, fontSize: "11px", color: "#1a56ff", fontStyle: "italic" }}>VISA</span>
          <div style={{ width: 28, height: 18, borderRadius: "4px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", position: "absolute", left: "4px" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316", position: "absolute", right: "4px" }} />
          </div>
          <span style={{ padding: "2px 6px", borderRadius: "5px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.15)", fontFamily: ff.mono, fontWeight: 800, fontSize: "9px", color: "#059669" }}>RuPay</span>
        </div>
      </div>

      {/* Card preview */}
      <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.07))", border: "1px solid rgba(99,102,241,.15)", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ width: 26, height: 18, borderRadius: "4px", background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }} />
          {brand && <BrandBadge brand={brand} />}
        </div>
        <div style={{ fontFamily: ff.mono, fontSize: "14px", fontWeight: 700, color: cardNum ? "#1a1a2e" : "rgba(99,102,241,.3)", letterSpacing: ".12em", marginBottom: "8px" }}>
          {cardNum || "•••• •••• •••• ••••"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: ff.mono, fontSize: "10px", fontWeight: 700, color: cardName ? "#1a1a2e" : "rgba(99,102,241,.3)", textTransform: "uppercase" }}>{cardName || "CARD HOLDER NAME"}</span>
          <span style={{ fontFamily: ff.mono, fontSize: "10px", fontWeight: 700, color: expiry ? "#1a1a2e" : "rgba(99,102,241,.3)" }}>{expiry || "MM/YY"}</span>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <CInput label="Card Number" value={cardNum} onChange={e => setCardNum(fmt(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19} inputMode="numeric" />
        <CInput label="Cardholder Name" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} placeholder="AS ON CARD" maxLength={26} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <CInput label="Expiry (MM/YY)" value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5} inputMode="numeric" />
          <CInput label="CVV" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,"").slice(0,4))} placeholder="•••" maxLength={4} inputMode="numeric" />
        </div>

        {amount > 0 && (
          <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.18)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: "rgba(26,26,46,.45)", fontFamily: ff.mono, textTransform: "uppercase", letterSpacing: ".08em" }}>Amount to Pay</span>
            <span style={{ fontFamily: ff.serif, fontSize: "20px", fontWeight: 900, color: "#6366f1" }}>₹{amount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <button onClick={handlePay} disabled={!done || paying}
          style={{ padding: "11px", borderRadius: "10px", border: "none", background: done ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(26,26,46,.07)", color: done ? "#fff" : "rgba(26,26,46,.25)", fontSize: "13px", fontWeight: 800, fontFamily: ff.body, cursor: done ? "pointer" : "not-allowed", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          {paying ? (
            <><div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} />Processing…</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Pay ₹{amount > 0 ? amount.toLocaleString("en-IN") : "Now"} Securely</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── UPI Panel ────────────────────────────────────────────── */
function UPIPanel({ amount, cfg }) {
  const [copied, setCopied]           = useState("");
  const [utrValue, setUtrValue]       = useState("");
  const [utrConfirmed, setUtrConfirmed] = useState(false);
  const utrValid = utrValue.trim().length >= 10;
  const copy = (text, key) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2000); }); };

  const upiId   = cfg?.upi?.upiId   || "aaru.pvtltd@hdfc";
  const upiName = cfg?.upi?.upiName || "Aaru Pvt Ltd";
  const note    = cfg?.upi?.upiNote || "Invoice Payment";
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount > 0 ? amount : ""}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=1a1a2e&qzone=2`;

  return (
    <div style={{ marginTop: "14px", background: "linear-gradient(135deg,rgba(124,58,237,.05),rgba(2,132,199,.05))", border: "1.5px solid rgba(124,58,237,.22)", borderRadius: "16px", padding: "18px", animation: "fadeUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#7c3aed,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2m3 0h.01M14 17h.01M17 17h3M20 14v3"/></svg>
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e", fontFamily: ff.body }}>Scan &amp; Pay via UPI</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono }}>GPay · PhonePe · Paytm · Any UPI app</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "8px", border: "1.5px solid rgba(124,58,237,.18)", boxShadow: "0 4px 14px rgba(124,58,237,.1)", flexShrink: 0 }}>
          <img src={qrUrl} width="110" height="110" alt="UPI QR" style={{ display: "block", borderRadius: "5px" }} onError={e => e.target.style.display="none"} />
          {amount > 0 && <div style={{ textAlign: "center", marginTop: "6px", fontWeight: 900, fontSize: "13px", color: "#7c3aed", fontFamily: ff.serif }}>₹{amount.toLocaleString("en-IN")}</div>}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "7px" }}>
          <div style={{ background: "#fff", borderRadius: "10px", border: "1.5px solid rgba(124,58,237,.18)", padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", fontFamily: ff.mono, color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: "4px" }}>Merchant UPI ID</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <span style={{ fontFamily: ff.mono, fontSize: "12px", fontWeight: 800, color: "#7c3aed" }}>{upiId}</span>
              <button onClick={() => copy(upiId, "upi")} style={{ padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(124,58,237,.25)", background: copied === "upi" ? "rgba(124,58,237,.14)" : "rgba(124,58,237,.07)", color: "#7c3aed", fontSize: "9px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: ff.mono }}>
                {copied === "upi" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "rgba(26,26,46,.45)" }}>Pay to</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a2e" }}>{upiName}</span>
          </div>
          <div style={{ background: "rgba(5,150,105,.05)", border: "1px solid rgba(5,150,105,.15)", borderRadius: "9px", padding: "7px 10px", fontSize: "10px", color: "#059669", fontFamily: ff.mono, lineHeight: 1.6 }}>
            ① Open any UPI app<br/>② Scan QR or enter UPI ID<br/>③ Enter ₹{amount > 0 ? amount.toLocaleString("en-IN") : "amount"} &amp; confirm
          </div>
        </div>
      </div>

      {/* UTR input */}
      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(124,58,237,.12)", paddingTop: "14px" }}>
        {utrConfirmed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 13px", borderRadius: "11px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.2)" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#059669", fontFamily: ff.body }}>Transaction ID Submitted ✓</div>
              <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono, marginTop: "1px" }}>UTR: {utrValue.trim()}</div>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: "10px", fontFamily: ff.mono, fontWeight: 700, color: "rgba(26,26,46,.45)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "7px" }}>
              Enter UTR / Transaction ID after payment
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={utrValue} onChange={e => setUtrValue(e.target.value)} placeholder="e.g. 425612345678" maxLength={22}
                style={{ flex: 1, padding: "9px 12px", borderRadius: "9px", border: "1.5px solid rgba(124,58,237,.2)", fontSize: "13px", fontFamily: ff.mono, fontWeight: 700, color: "#1a1a2e", outline: "none", background: "#fff" }} />
              <button onClick={() => { if (utrValid) setUtrConfirmed(true); }} disabled={!utrValid}
                style={{ padding: "9px 14px", borderRadius: "9px", border: "none", background: utrValid ? "linear-gradient(135deg,#7c3aed,#0284c7)" : "rgba(26,26,46,.07)", color: utrValid ? "#fff" : "rgba(26,26,46,.25)", fontSize: "12px", fontWeight: 800, fontFamily: ff.body, cursor: utrValid ? "pointer" : "not-allowed", transition: "all .18s", whiteSpace: "nowrap" }}>
                Confirm
              </button>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(26,26,46,.3)", marginTop: "5px", fontFamily: ff.mono }}>Find the 12-digit UTR in your UPI app after payment</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Bank Transfer Panel ──────────────────────────────────── */
function BankPanel({ amount, cfg }) {
  const [copied, setCopied]             = useState("");
  const [utrValue, setUtrValue]         = useState("");
  const [utrConfirmed, setUtrConfirmed] = useState(false);
  const utrValid = utrValue.trim().length >= 10;
  const copy = (text, key) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 2000); }); };

  const b = cfg?.bank || {};
  const fields = [
    { label: "Bank Name",      value: b.bankName      || "HDFC Bank",          key: "bn",   hl: false },
    { label: "Account Name",   value: b.accountName   || "Aaru Pvt Ltd",       key: "an",   hl: false },
    { label: "Account Number", value: b.accountNumber || "50200098765432",      key: "num",  hl: true  },
    { label: "IFSC Code",      value: b.ifscCode      || "HDFC0001234",         key: "ifsc", hl: true  },
    { label: "Branch",         value: b.branch        || "Valsad Main Branch",  key: "br",   hl: false },
    { label: "Account Type",   value: b.accountType   || "Current",             key: "at",   hl: false },
  ].filter(f => f.value);

  const allText = fields.map(f => `${f.label}: ${f.value}`).join("\n");

  return (
    <div style={{ marginTop: "14px", background: "linear-gradient(135deg,rgba(2,132,199,.04),rgba(180,83,9,.04))", border: "1.5px solid rgba(2,132,199,.2)", borderRadius: "16px", padding: "18px", animation: "fadeUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V7m0 0l-4 4m4-4l4 4M3 21h18M3 10.5l9-7.5 9 7.5"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e", fontFamily: ff.body }}>Bank Transfer Details</div>
          <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono }}>NEFT · RTGS · IMPS</div>
        </div>
        <button onClick={() => copy(allText, "all")} style={{ padding: "5px 11px", borderRadius: "7px", border: "1px solid rgba(2,132,199,.25)", background: copied === "all" ? "rgba(2,132,199,.12)" : "rgba(2,132,199,.06)", color: "#0284c7", fontSize: "10px", fontWeight: 700, fontFamily: ff.mono, cursor: "pointer", whiteSpace: "nowrap" }}>
          {copied === "all" ? "✓ Copied" : "Copy All"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {fields.map(row => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: "10px", border: row.hl ? "1.5px solid rgba(2,132,199,.2)" : "1px solid rgba(26,26,46,.07)", padding: "9px 12px", gap: "8px" }}>
            <span style={{ fontSize: "9px", fontFamily: ff.mono, color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", whiteSpace: "nowrap" }}>{row.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: row.hl ? ff.mono : ff.body, fontSize: row.key === "num" ? "14px" : "13px", fontWeight: row.hl ? 800 : 600, color: row.hl ? "#0284c7" : "#1a1a2e", letterSpacing: row.key === "num" ? ".06em" : "normal" }}>
                {row.key === "num" ? row.value.replace(/(.{4})/g,"$1 ").trim() : row.value}
              </span>
              {row.hl && (
                <button onClick={() => copy(row.value, row.key)} style={{ padding: "2px 7px", borderRadius: "5px", border: "1px solid rgba(2,132,199,.2)", background: copied === row.key ? "rgba(2,132,199,.14)" : "rgba(2,132,199,.06)", color: "#0284c7", fontSize: "9px", fontWeight: 700, fontFamily: ff.mono, cursor: "pointer" }}>
                  {copied === row.key ? "✓" : "Copy"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px", padding: "9px 12px", borderRadius: "9px", background: "rgba(5,150,105,.05)", border: "1px solid rgba(5,150,105,.15)", fontSize: "10px", color: "#059669", fontFamily: ff.mono, lineHeight: 1.6 }}>
        Transfer ₹{amount > 0 ? amount.toLocaleString("en-IN") : "the amount"} to the above account &amp; enter UTR below.
      </div>

      {/* UTR input */}
      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(2,132,199,.12)", paddingTop: "14px" }}>
        {utrConfirmed ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 13px", borderRadius: "11px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.2)" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#059669", fontFamily: ff.body }}>Reference Number Submitted ✓</div>
              <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: ff.mono, marginTop: "1px" }}>UTR/Ref: {utrValue.trim()}</div>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: "10px", fontFamily: ff.mono, fontWeight: 700, color: "rgba(26,26,46,.45)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "7px" }}>
              Enter UTR / Reference Number after transfer
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input value={utrValue} onChange={e => setUtrValue(e.target.value)} placeholder="e.g. HDFC000012345678" maxLength={22}
                style={{ flex: 1, padding: "9px 12px", borderRadius: "9px", border: "1.5px solid rgba(2,132,199,.2)", fontSize: "13px", fontFamily: ff.mono, fontWeight: 700, color: "#1a1a2e", outline: "none", background: "#fff" }} />
              <button onClick={() => { if (utrValid) setUtrConfirmed(true); }} disabled={!utrValid}
                style={{ padding: "9px 14px", borderRadius: "9px", border: "none", background: utrValid ? "linear-gradient(135deg,#0284c7,#0369a1)" : "rgba(26,26,46,.07)", color: utrValid ? "#fff" : "rgba(26,26,46,.25)", fontSize: "12px", fontWeight: 800, fontFamily: ff.body, cursor: utrValid ? "pointer" : "not-allowed", transition: "all .18s", whiteSpace: "nowrap" }}>
                Confirm
              </button>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(26,26,46,.3)", marginTop: "5px", fontFamily: ff.mono }}>Find UTR/Ref in your bank app or transfer SMS</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────── */
export default function PaymentDetailsPanel({ payMethod, amount = 0 }) {
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    // Payment settings page removed — use empty config (no UPI/bank details configured)
    setCfg({});
  }, []);

  if (payMethod === "CREDIT_DEBIT") return <CardPanel amount={amount} />;
  if (payMethod === "UPI")          return <UPIPanel amount={amount} cfg={cfg} />;
  if (payMethod === "BANK_TRANSFER") return <BankPanel amount={amount} cfg={cfg} />;
  return null;
}
