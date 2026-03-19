import { validateRequired, validatePhone, validateMinLength } from "../../utils/validators";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const ISSUE_TYPES = [
  { value: "NOT_STARTING",      label: "Not Starting / No Power" },
  { value: "BATTERY_ISSUE",     label: "Battery Problem" },
  { value: "CHARGING_PROBLEM",  label: "Charging Issue" },
  { value: "DISPLAY_ERROR",     label: "Display / Error Code" },
  { value: "NOISE_VIBRATION",   label: "Unusual Noise / Vibration" },
  { value: "REMOTE_ISSUE",      label: "Remote / Control Issue" },
  { value: "INSTALLATION",      label: "Installation Required" },
  { value: "OTHER",             label: "Other" },
];

const PRIORITIES = [
  { value: "LOW",    label: "Low",    color: "#059669", bg: "rgba(5,150,105,.08)" },
  { value: "MEDIUM", label: "Medium", color: "#d97706", bg: "rgba(245,158,11,.08)" },
  { value: "HIGH",   label: "High",   color: "#ea580c", bg: "rgba(234,88,12,.08)" },
  { value: "URGENT", label: "Urgent", color: "#dc2626", bg: "rgba(239,68,68,.08)" },
];

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(26,26,46,.5)", marginBottom: "7px", textTransform: "uppercase", letterSpacing: ".07em" }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: "11.5px", color: "rgba(26,26,46,.38)", marginTop: "5px" }}>{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: "10px",
  border: "1.5px solid rgba(26,26,46,.12)", fontSize: "14px",
  background: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

export default function ServiceRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [warranties, setWarranties] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productName:      searchParams.get("product") || "",
    serialNumber:     searchParams.get("serial")  || "",
    warrantyId:       searchParams.get("warrantyId") || "",
    issueType:        "OTHER",
    issueDescription: "",
    priority:         "MEDIUM",
    contactName:      "",
    contactPhone:     "",
    contactAddress:   "",
    preferredDate:    "",
  });

  // Sync contact info once user object is available
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        contactName:  f.contactName  || user.name  || "",
        contactPhone: f.contactPhone || user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    axiosInstance.get("/service/warranty")
      .then(r => setWarranties(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleWarrantySelect = (wId) => {
    set("warrantyId", wId);
    if (wId) {
      const w = warranties.find(x => x._id === wId);
      if (w) {
        set("productName", w.productName);
        set("serialNumber", w.serialNumber);
      }
    }
  };

  const handleSubmit = async () => {
    setError("");
    const nameErr    = validateRequired(form.productName, "Product name");
    const issueErr   = validateMinLength(form.issueDescription, 10, "Issue description");
    const contactErr = validateRequired(form.contactName, "Contact name");
    const phoneErr   = validatePhone(form.contactPhone);
    if (nameErr || issueErr || contactErr || phoneErr) {
      return setError(nameErr || issueErr || contactErr || phoneErr);
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/service/requests", form);
      setSubmitted(res.data.request);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to raise request. Try again.");
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: "min(540px, 100%)", margin: "60px auto", textAlign: "center", animation: "fadeUp .4s ease both" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(5,150,105,.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e", marginBottom: "8px" }}>Request Submitted!</h2>
        <p style={{ color: "rgba(26,26,46,.5)", fontSize: "14px", marginBottom: "6px" }}>Your service request has been raised successfully.</p>
        <div style={{ background: acLight, border: `1.5px solid ${acBorder}`, borderRadius: "14px", padding: "16px 22px", margin: "20px 0", display: "inline-block" }}>
          <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>Ticket Number</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: ac, fontFamily: "'DM Mono',monospace" }}>{submitted.ticketNo}</div>
        </div>
        <p style={{ color: "rgba(26,26,46,.4)", fontSize: "13px", marginBottom: "24px" }}>Use this ticket number to track your complaint status.</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/customer/track-complaint")} style={{ padding: "12px 20px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${ac},#92400e)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Track This Request</button>
          <button onClick={() => navigate("/customer/service-request")} style={{ padding: "12px 20px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>New Request</button>
          <button onClick={() => navigate("/dashboard/cashier")} style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", color: "#1a1a2e", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "min(700px, 100%)", margin: "0 auto", animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Raise Service Request</h1>
          <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", margin: 0 }}>Describe your issue and our technician will contact you</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Product Info */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: ".06em" }}>Product Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {warranties.length > 0 && (
              <Field label="Select Registered Product">
                <select value={form.warrantyId} onChange={e => handleWarrantySelect(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Select from registered warranties (optional) —</option>
                  {warranties.filter(w => w.status === "ACTIVE").map(w => (
                    <option key={w._id} value={w._id}>{w.productName} — S/N: {w.serialNumber}</option>
                  ))}
                </select>
              </Field>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Product Name" required>
                <input value={form.productName} onChange={e => set("productName", e.target.value)} placeholder="e.g. Smart Inverter 1500VA" style={inputStyle} />
              </Field>
              <Field label="Serial Number">
                <input value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} placeholder="e.g. INV-2024-001234" style={inputStyle} />
              </Field>
            </div>
          </div>
        </div>

        {/* Issue Details */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: ".06em" }}>Issue Details</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Field label="Issue Type" required>
              <select value={form.issueType} onChange={e => set("issueType", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Describe the Issue" required hint="Be as specific as possible — this helps our technician prepare">
              <textarea value={form.issueDescription} onChange={e => set("issueDescription", e.target.value)}
                placeholder="Describe when the issue started, what you've noticed, error codes if any..." rows={4}
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
            <Field label="Priority">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {PRIORITIES.map(p => (
                  <button key={p.value} onClick={() => set("priority", p.value)} style={{
                    padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${form.priority === p.value ? p.color : "rgba(26,26,46,.1)"}`,
                    background: form.priority === p.value ? p.bg : "#fff", color: form.priority === p.value ? p.color : "rgba(26,26,46,.5)",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all .15s"
                  }}>{p.label}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: ".06em" }}>Contact & Schedule</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Field label="Contact Name" required>
                <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Your name" style={inputStyle} />
              </Field>
              <Field label="Contact Phone" required>
                <input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="Your phone number" style={inputStyle} />
              </Field>
            </div>
            <Field label="Service Address">
              <input value={form.contactAddress} onChange={e => set("contactAddress", e.target.value)} placeholder="Address where technician should visit" style={inputStyle} />
            </Field>
            <Field label="Preferred Service Date" hint="We'll try to accommodate your preference">
              <input type="date" value={form.preferredDate} onChange={e => set("preferredDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]} style={{ ...inputStyle, cursor: "pointer" }} />
            </Field>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "12px", padding: "14px 18px", color: "#dc2626", fontSize: "13.5px" }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => navigate(-1)} style={{ flex: 1, padding: "14px", borderRadius: "13px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", color: "#1a1a2e", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: "14px", borderRadius: "13px", border: "none", fontSize: "15px", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", background: submitting ? "rgba(26,26,46,.1)" : `linear-gradient(135deg,${ac},#92400e)`, color: submitting ? "rgba(26,26,46,.3)" : "#fff" }}>
            {submitting ? "Submitting..." : "Submit Service Request →"}
          </button>
        </div>
      </div>
    </div>
  );
}
