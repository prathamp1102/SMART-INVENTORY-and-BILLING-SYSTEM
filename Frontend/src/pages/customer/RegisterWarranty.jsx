import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const STATUS_STYLE = {
  ACTIVE:  { bg: "rgba(5,150,105,.1)",   color: "#059669", label: "Active" },
  EXPIRED: { bg: "rgba(239,68,68,.1)",   color: "#dc2626", label: "Expired" },
  VOID:    { bg: "rgba(26,26,46,.08)",   color: "rgba(26,26,46,.4)", label: "Void" },
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(26,26,46,.5)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: ".07em" }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1.5px solid rgba(26,26,46,.12)", fontSize: "14px",
  background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color .15s",
};

export default function RegisterWarranty() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [warranties, setWarranties] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productName: "", serialNumber: "", purchaseDate: "",
    warrantyYears: "1", invoiceNo: "", notes: "",
  });

  useEffect(() => { fetchWarranties(); }, []);

  const fetchWarranties = async () => {
    setLoadingList(true);
    try {
      const res = await axiosInstance.get("/service/warranty");
      setWarranties(Array.isArray(res.data) ? res.data : []);
    } catch { setWarranties([]); }
    finally { setLoadingList(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.productName.trim()) return setError("Product name is required.");
    if (!form.serialNumber.trim()) return setError("Serial number is required.");
    if (!form.purchaseDate) return setError("Purchase date is required.");
    setSubmitting(true);
    try {
      await axiosInstance.post("/service/warranty", form);
      setSuccess("Warranty registered successfully!");
      setForm({ productName: "", serialNumber: "", purchaseDate: "", warrantyYears: "1", invoiceNo: "", notes: "" });
      setShowForm(false);
      fetchWarranties();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to register warranty.");
    } finally { setSubmitting(false); }
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Warranty Registration</h1>
          </div>
          <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", margin: 0 }}>Register your Smart Inverter & UPS warranties for service coverage</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${ac},#92400e)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 18px rgba(180,83,9,.3)` }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Register New
        </button>
      </div>

      {success && (
        <div style={{ background: "rgba(5,150,105,.08)", border: "1.5px solid rgba(5,150,105,.2)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: "#059669", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {success}
        </div>
      )}

      {/* Registration Form Modal */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.45)", zIndex: 400 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "540px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "20px", zIndex: 401, boxShadow: "0 24px 80px rgba(26,26,46,.2)", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>Register Warranty</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.4)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Product Name" required>
                  <input value={form.productName} onChange={e => set("productName", e.target.value)} placeholder="e.g. Smart Inverter 1500VA" style={inputStyle} />
                </Field>
                <Field label="Serial Number" required>
                  <input value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} placeholder="e.g. INV-2024-001234" style={inputStyle} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <Field label="Purchase Date" required>
                  <input type="date" value={form.purchaseDate} onChange={e => set("purchaseDate", e.target.value)} style={inputStyle} max={new Date().toISOString().split("T")[0]} />
                </Field>
                <Field label="Warranty Period">
                  <select value={form.warrantyYears} onChange={e => set("warrantyYears", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} Year{y > 1 ? "s" : ""}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Invoice / Bill Number">
                <input value={form.invoiceNo} onChange={e => set("invoiceNo", e.target.value)} placeholder="e.g. INV-00123 (optional)" style={inputStyle} />
              </Field>
              <Field label="Notes">
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional details..." rows={3}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </Field>
            </div>

            {error && <div style={{ marginTop: "14px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "13.5px" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px", marginTop: "22px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "13px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", color: "#1a1a2e" }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: "13px", borderRadius: "12px", border: "none", background: submitting ? "rgba(26,26,46,.1)" : `linear-gradient(135deg,${ac},#92400e)`, color: submitting ? "rgba(26,26,46,.3)" : "#fff", fontSize: "14px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Registering..." : "Register Warranty"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Warranties List */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>My Warranties ({warranties.length})</span>
        </div>

        {loadingList ? (
          <div style={{ textAlign: "center", padding: "50px", color: "rgba(26,26,46,.4)" }}>Loading...</div>
        ) : warranties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: acLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <p style={{ color: "rgba(26,26,46,.4)", fontSize: "14px", marginBottom: "16px" }}>No warranties registered yet</p>
            <button onClick={() => setShowForm(true)} style={{ padding: "10px 20px", borderRadius: "10px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Register Your First Product</button>
          </div>
        ) : (
          <div style={{ padding: "8px 0" }}>
            {warranties.map((w, i) => {
              const st = STATUS_STYLE[w.status] || STATUS_STYLE.ACTIVE;
              const isExpiringSoon = w.status === "ACTIVE" && w.daysLeft > 0 && w.daysLeft <= 30;
              return (
                <div key={w._id} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 22px", borderBottom: i < warranties.length - 1 ? "1px solid rgba(26,26,46,.05)" : "none", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e", marginBottom: "3px" }}>{w.productName}</div>
                    <div style={{ fontSize: "12px", color: "rgba(26,26,46,.45)", fontFamily: "'DM Mono',monospace" }}>S/N: {w.serialNumber}</div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "5px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "rgba(26,26,46,.5)" }}>Purchased: {formatDate(w.purchaseDate)}</span>
                      <span style={{ fontSize: "12px", color: "rgba(26,26,46,.5)" }}>Expires: {formatDate(w.expiryDate)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color }}>{st.label}</span>
                    {w.status === "ACTIVE" && (
                      <span style={{ fontSize: "11px", color: isExpiringSoon ? "#d97706" : "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>
                        {isExpiringSoon ? `⚠ ${w.daysLeft}d left` : `${w.daysLeft}d remaining`}
                      </span>
                    )}
                    <button onClick={() => navigate(`/customer/service-request?warrantyId=${w._id}&product=${encodeURIComponent(w.productName)}&serial=${encodeURIComponent(w.serialNumber)}`)}
                      style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "7px", border: `1px solid ${acBorder}`, background: acLight, color: ac, cursor: "pointer", fontWeight: 700 }}>
                      Raise Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
