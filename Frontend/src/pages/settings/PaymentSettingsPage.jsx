import { useState, useEffect } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";

const V   = "#7c3aed";
const VL  = "rgba(124,58,237,.08)";
const VB  = "rgba(124,58,237,.2)";
const B   = "#0284c7";
const BL  = "rgba(2,132,199,.08)";
const BB  = "rgba(2,132,199,.2)";
const P   = "#059669";
const PL  = "rgba(5,150,105,.08)";
const PB  = "rgba(5,150,105,.2)";

function Section({ title, subtitle, icon, color, colorL, colorB, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "20px",
      border: `1px solid ${colorB}`,
      boxShadow: "0 2px 14px rgba(26,26,46,.05)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: `1px solid ${colorB}`,
        background: colorL,
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{
          width: "42px", height: "42px", borderRadius: "12px",
          background: `linear-gradient(135deg,${color},${color}cc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${colorL}`,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a2e", fontFamily: "'Fraunces',serif" }}>{title}</div>
          <div style={{ fontSize: "11px", color: "rgba(26,26,46,.45)", marginTop: "2px" }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 700,
        fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.5)",
        letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "6px",
      }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.35)", marginTop: "4px" }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: "100%", height: "44px", borderRadius: "11px",
  border: "1.5px solid rgba(26,26,46,.12)", outline: "none",
  padding: "0 14px", fontSize: "14px",
  fontFamily: "'Figtree',sans-serif", color: "#1a1a2e",
  background: "#fafaf9", boxSizing: "border-box",
  transition: "border-color .2s",
};

function Toggle({ checked, onChange, color }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: "44px", height: "24px", borderRadius: "99px",
      background: checked ? color : "rgba(26,26,46,.15)",
      cursor: "pointer", transition: "background .2s", position: "relative",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: "3px",
        left: checked ? "23px" : "3px",
        width: "18px", height: "18px", borderRadius: "50%",
        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        transition: "left .2s",
      }} />
    </div>
  );
}

export default function PaymentSettingsPage() {
  const [upi,      setUpi]      = useState({ enabled: false, upiId: "", upiName: "", upiNote: "" });
  const [bank,     setBank]     = useState({ enabled: false, bankName: "", accountName: "", accountNumber: "", ifscCode: "", branch: "", accountType: "Current" });
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saved,    setSaved]    = useState(false);
  const [preview,  setPreview]  = useState("UPI");

  useEffect(() => {
    axiosInstance.get("/settings/payment")
      .then(r => {
        if (r.data.upi)  setUpi(r.data.upi);
        if (r.data.bank) setBank(r.data.bank);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put("/settings/payment", { upi, bank });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // UPI QR preview
  const upiLink = upi.upiId
    ? `upi://pay?pa=${encodeURIComponent(upi.upiId)}&pn=${encodeURIComponent(upi.upiName || "Business")}&cu=INR`
    : null;
  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=1a1a2e&qzone=1`
    : null;

  if (loading) return (
    <PageShell title="Payment Settings" subtitle="Configure UPI and bank transfer details">
      <div style={{ padding: "80px", textAlign: "center", color: "rgba(26,26,46,.3)" }}>Loading…</div>
    </PageShell>
  );

  return (
    <PageShell title="Payment Settings" subtitle="Configure UPI and bank transfer details shown in Sales Desk">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* ── LEFT: Settings forms ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* UPI Settings */}
          <Section title="UPI / QR Payment" subtitle="Customers can scan and pay instantly" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path strokeLinecap="round" d="M14 14h2m3 0h.01M14 17h.01M17 17h3M20 14v3"/>
            </svg>
          } color={V} colorL={VL} colorB={VB}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>Enable UPI Payment</div>
                <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>Show QR code in Sales Desk when UPI is selected</div>
              </div>
              <Toggle checked={upi.enabled} onChange={v => setUpi(u => ({ ...u, enabled: v }))} color={V} />
            </div>

            <div style={{ opacity: upi.enabled ? 1 : 0.4, pointerEvents: upi.enabled ? "all" : "none", transition: "opacity .2s" }}>
              <Field label="UPI ID" hint="e.g. business@paytm · yourname@upi · 9876543210@hdfc">
                <input value={upi.upiId} onChange={e => setUpi(u => ({ ...u, upiId: e.target.value }))}
                  placeholder="yourname@bank" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = V}
                  onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                />
              </Field>
              <Field label="Display Name" hint="Name shown on the QR code screen">
                <input value={upi.upiName} onChange={e => setUpi(u => ({ ...u, upiName: e.target.value }))}
                  placeholder="Aaru Pvt Ltd" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = V}
                  onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                />
              </Field>
              <Field label="Payment Note (Optional)" hint="Pre-filled note for customer's payment">
                <input value={upi.upiNote} onChange={e => setUpi(u => ({ ...u, upiNote: e.target.value }))}
                  placeholder="Invoice payment" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = V}
                  onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                />
              </Field>
            </div>
          </Section>

          {/* Bank Settings */}
          <Section title="Bank Transfer" subtitle="NEFT · RTGS · IMPS account details" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V7m0 0l-4 4m4-4l4 4M3 21h18M3 10.5l9-7.5 9 7.5"/>
            </svg>
          } color={B} colorL={BL} colorB={BB}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>Enable Bank Transfer</div>
                <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "2px" }}>Show account details in Sales Desk when Bank Transfer is selected</div>
              </div>
              <Toggle checked={bank.enabled} onChange={v => setBank(b => ({ ...b, enabled: v }))} color={B} />
            </div>

            <div style={{ opacity: bank.enabled ? 1 : 0.4, pointerEvents: bank.enabled ? "all" : "none", transition: "opacity .2s" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Field label="Bank Name">
                  <input value={bank.bankName} onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))}
                    placeholder="HDFC Bank" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = B}
                    onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                  />
                </Field>
                <Field label="Account Type">
                  <select value={bank.accountType} onChange={e => setBank(b => ({ ...b, accountType: e.target.value }))}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option>Current</option>
                    <option>Savings</option>
                    <option>OD</option>
                  </select>
                </Field>
              </div>
              <Field label="Account Name" hint="Name as registered with the bank">
                <input value={bank.accountName} onChange={e => setBank(b => ({ ...b, accountName: e.target.value }))}
                  placeholder="Aaru Pvt Ltd" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = B}
                  onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                />
              </Field>
              <Field label="Account Number">
                <input value={bank.accountNumber} onChange={e => setBank(b => ({ ...b, accountNumber: e.target.value }))}
                  placeholder="1234567890123" style={{ ...inputStyle, fontFamily: "'DM Mono',monospace", fontSize: "16px", letterSpacing: ".06em" }}
                  onFocus={e => e.target.style.borderColor = B}
                  onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Field label="IFSC Code">
                  <input value={bank.ifscCode} onChange={e => setBank(b => ({ ...b, ifscCode: e.target.value.toUpperCase() }))}
                    placeholder="HDFC0001234" style={{ ...inputStyle, fontFamily: "'DM Mono',monospace", letterSpacing: ".05em" }}
                    onFocus={e => e.target.style.borderColor = B}
                    onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                  />
                </Field>
                <Field label="Branch Name">
                  <input value={bank.branch} onChange={e => setBank(b => ({ ...b, branch: e.target.value }))}
                    placeholder="Valsad Main" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = B}
                    onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Save Button */}
          <button onClick={handleSave} disabled={saving}
            style={{
              height: "50px", borderRadius: "14px", border: "none",
              cursor: saving ? "wait" : "pointer",
              background: saved
                ? `linear-gradient(135deg,${P},#047857)`
                : "linear-gradient(135deg,#1a1a2e,#2d2d44)",
              color: "#fff", fontSize: "14px", fontWeight: 800,
              fontFamily: "'Figtree',sans-serif",
              boxShadow: "0 4px 20px rgba(26,26,46,.2)",
              transition: "all .25s", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px",
            }}>
            {saving ? (
              <><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} />Saving…</>
            ) : saved ? (
              <>✓ Settings Saved!</>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M17 3v4H7V3M12 12v6m-3-3h6"/></svg>
                Save Payment Settings
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT: Live Preview ──────────────────────────── */}
        <div style={{ position: "sticky", top: "24px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 4px 24px rgba(26,26,46,.08)" }}>
            {/* Preview header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(26,26,46,.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(26,26,46,.02)" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.4)", letterSpacing: ".14em", textTransform: "uppercase" }}>
                Live Preview — Sales Desk
              </div>
              <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(26,26,46,.1)" }}>
                {["UPI", "BANK_TRANSFER"].map(m => (
                  <button key={m} onClick={() => setPreview(m)} style={{
                    padding: "5px 12px", border: "none", cursor: "pointer",
                    fontSize: "10px", fontWeight: 700, fontFamily: "'DM Mono',monospace",
                    background: preview === m ? "#1a1a2e" : "#fff",
                    color: preview === m ? "#fff" : "rgba(26,26,46,.4)",
                    transition: "all .15s",
                  }}>
                    {m === "BANK_TRANSFER" ? "BANK" : m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              {preview === "UPI" ? (
                upi.enabled && upi.upiId ? (
                  <div style={{ background: "linear-gradient(135deg,rgba(124,58,237,.05),rgba(2,132,199,.05))", border: "1.5px solid rgba(124,58,237,.2)", borderRadius: "16px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg,#7c3aed,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2m3 0h.01M14 17h.01M17 17h3M20 14v3"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e" }}>Scan &amp; Pay via UPI</div>
                        <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>GPay · PhonePe · Paytm</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      {qrUrl && (
                        <div style={{ background: "#fff", borderRadius: "12px", padding: "8px", border: "1.5px solid rgba(124,58,237,.15)" }}>
                          <img src={qrUrl} width="100" height="100" alt="QR" style={{ display: "block", borderRadius: "4px" }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ background: "#fff", borderRadius: "10px", border: "1.5px solid rgba(124,58,237,.15)", padding: "10px 12px", marginBottom: "8px" }}>
                          <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "3px" }}>UPI ID</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#7c3aed" }}>{upi.upiId}</div>
                        </div>
                        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid rgba(26,26,46,.08)", padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: "rgba(26,26,46,.4)" }}>Pay to</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a2e" }}>{upi.upiName || "Business"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(26,26,46,.35)", fontSize: "13px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "10px" }}>📱</div>
                    {upi.enabled ? "Enter a UPI ID to see preview" : "Enable UPI to see preview"}
                  </div>
                )
              ) : (
                bank.enabled && (bank.accountNumber || bank.bankName) ? (
                  <div style={{ background: "linear-gradient(135deg,rgba(2,132,199,.04),rgba(180,83,9,.04))", border: "1.5px solid rgba(2,132,199,.2)", borderRadius: "16px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg,#0284c7,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21V7m0 0l-4 4m4-4l4 4M3 21h18M3 10.5l9-7.5 9 7.5"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a1a2e" }}>Bank Transfer Details</div>
                        <div style={{ fontSize: "10px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>NEFT · RTGS · IMPS</div>
                      </div>
                    </div>
                    {[
                      ["Bank", bank.bankName],
                      ["Account Name", bank.accountName],
                      ["Account No.", bank.accountNumber],
                      ["IFSC", bank.ifscCode],
                    ].filter(([,v]) => v).map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", background: "#fff", borderRadius: "9px", border: "1px solid rgba(26,26,46,.07)", padding: "9px 12px", marginBottom: "7px" }}>
                        <span style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".08em" }}>{l}</span>
                        <span style={{ fontFamily: l === "Account No." || l === "IFSC" ? "'DM Mono',monospace" : "'Figtree',sans-serif", fontSize: "13px", fontWeight: 700, color: l === "Account No." || l === "IFSC" ? "#0284c7" : "#1a1a2e" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(26,26,46,.35)", fontSize: "13px" }}>
                    <div style={{ fontSize: "32px", marginBottom: "10px" }}>🏦</div>
                    {bank.enabled ? "Enter bank details to see preview" : "Enable Bank Transfer to see preview"}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Info card */}
          <div style={{ marginTop: "14px", padding: "14px 18px", borderRadius: "14px", background: "rgba(5,150,105,.05)", border: "1px solid rgba(5,150,105,.15)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", marginBottom: "6px", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase" }}>
              ✓ How it works
            </div>
            <div style={{ fontSize: "12px", color: "rgba(26,26,46,.55)", lineHeight: 1.7 }}>
              When a cashier selects <strong>UPI</strong> or <strong>Bank Transfer</strong> in Sales Desk, these details automatically appear — the customer scans the QR or gets the account details to complete payment.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
