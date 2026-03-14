import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";

const ac         = "#0284c7";
const acLight    = "rgba(2,132,199,.08)";
const acBorder   = "rgba(2,132,199,.2)";
const acGlow     = "rgba(2,132,199,.18)";
const purple     = "#7c3aed";
const purpleLight  = "rgba(124,58,237,.08)";
const purpleBorder = "rgba(124,58,237,.2)";
const green      = "#059669";
const greenLight   = "rgba(5,150,105,.08)";
const greenBorder  = "rgba(5,150,105,.2)";
const red        = "#dc2626";

/* ─────────────────────────── Shared UI ─────────────────────────── */
function Spinner({ size = 20, color = ac }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid rgba(2,132,199,.15)`, borderTopColor: color, animation: "spin .7s linear infinite", flexShrink: 0 }} />;
}

function Toast({ message, type = "success" }) {
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: type === "error" ? red : green, color: "#fff", padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 28px rgba(0,0,0,.18)", zIndex: 9999, animation: "fadeUp .2s ease both", maxWidth: 320 }}>
      {type === "error" ? "✗" : "✓"} {message}
    </div>
  );
}

function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: width, boxShadow: "0 24px 80px rgba(26,26,46,.22)", animation: "fadeUp .22s ease both", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid rgba(26,26,46,.07)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{title}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(26,26,46,.12)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(26,26,46,.4)" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: "22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

const iStyle = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(26,26,46,.12)", fontSize: 13, color: "#1a1a2e", background: "#fafafa", outline: "none", fontFamily: "'Figtree',sans-serif", boxSizing: "border-box", transition: "border-color .15s" };

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(26,26,46,.45)", fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {children}
      {error && <div style={{ color: red, fontSize: 11, fontFamily: "'DM Mono',monospace", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Input({ error, ...props }) {
  return <input {...props} style={{ ...iStyle, borderColor: error ? "rgba(239,68,68,.5)" : "rgba(26,26,46,.12)" }}
    onFocus={e => e.target.style.borderColor = ac}
    onBlur={e => e.target.style.borderColor = error ? "rgba(239,68,68,.5)" : "rgba(26,26,46,.12)"} />;
}

function PrimaryBtn({ onClick, children, loading, color = ac, glow = acGlow }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: "10px 22px", borderRadius: 11, border: "none", cursor: loading ? "not-allowed" : "pointer", background: `linear-gradient(135deg,${color},${color}cc)`, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: `0 4px 16px ${glow}`, opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", gap: 7 }}>
      {loading && <Spinner size={13} color="#fff" />}
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: "10px 18px", borderRadius: 11, border: `1.5px solid ${acBorder}`, cursor: "pointer", background: acLight, color: ac, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree',sans-serif" }}>
      {children}
    </button>
  );
}

/* ─────────────────────────── KPI Card ─────────────────────────── */
function KpiCard({ icon, label, value, trend, trendUp, color = ac, light = acLight, border = acBorder, delay = "0s", onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 20, border: `1px solid ${border}`, padding: 22, cursor: onClick ? "pointer" : "default", transition: "all .22s", animation: `fadeUp .45s ease ${delay} both` }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 36px ${border}`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: light, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
        </div>
        {trend && <span style={{ fontSize: 11, fontWeight: 700, color: trendUp ? green : red, background: trendUp ? greenLight : "rgba(239,68,68,.1)", padding: "3px 8px", borderRadius: 99, fontFamily: "'DM Mono',monospace" }}>{trendUp ? "↑" : "↓"} {trend}</span>}
      </div>
      <div style={{ fontFamily: "'Figtree',sans-serif", fontSize: 30, fontWeight: 700, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 8 }}>{label}</div>
    </div>
  );
}

function ActionTile({ icon, label, desc, color = ac, light = acLight, border = acBorder, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 13, border: `1px solid ${border}`, background: light, cursor: "pointer", transition: "all .18s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateX(5px)"; e.currentTarget.style.boxShadow = `0 4px 18px ${border}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: "#fff", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 2px 8px ${border}` }}>
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>{label}</div>
        <div style={{ fontSize: "11.5px", color: "rgba(26,26,46,.45)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
      </div>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.25)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </div>
  );
}

function SectionBox({ title, icon, children, right, color = ac, light = acLight, border = acBorder }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(26,26,46,.08)", boxShadow: "0 2px 16px rgba(26,26,46,.05)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: light, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
          </div>
          <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>{title}</span>
        </div>
        {right}
      </div>
      <div style={{ padding: "20px 22px" }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────── Org/Branch Banner ─────────────────── */
function InfoChip({ icon, label, value, color }) {
  return (
    <div style={{ background: "rgba(26,26,46,.025)", borderRadius: 9, padding: "8px 10px", border: "1px solid rgba(26,26,46,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

function OrgBranchBanner({ profile, loading }) {
  if (loading) return (
    <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${acBorder}`, padding: "20px 24px", marginBottom: 22, display: "flex", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  const org    = profile?.organization || profile?.branch?.organization || null;
  const branch = profile?.branch;

  return (
    <div style={{ display: "grid", gridTemplateColumns: branch ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr", gap: 14, marginBottom: 22, animation: "fadeUp .35s ease both" }}>
      {/* Organization */}
      <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${purpleBorder}`, padding: "18px 22px", boxShadow: `0 4px 20px ${purpleLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: org ? 14 : 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${purple},#6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${purpleBorder}` }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: purple, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 2 }}>Your Organization</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: org ? "#1a1a2e" : "rgba(26,26,46,.3)", fontStyle: org ? "normal" : "italic" }}>
              {org ? org.name : "Not assigned"}
            </div>
          </div>
          {org && <span style={{ fontSize: 10, fontWeight: 700, color: org.status === "ACTIVE" ? green : "#b45309", background: org.status === "ACTIVE" ? greenLight : "rgba(180,83,9,.08)", border: `1px solid ${org.status === "ACTIVE" ? greenBorder : "rgba(180,83,9,.2)"}`, borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{org.status}</span>}
        </div>
        {org && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {org.city && <InfoChip icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" label="City" value={org.city} color={purple} />}
            {org.gstNumber && <InfoChip icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5" label="GST" value={org.gstNumber} color={purple} />}
            {org.email && <InfoChip icon="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" label="Email" value={org.email} color={purple} />}
            {org.phone && <InfoChip icon="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" label="Phone" value={org.phone} color={purple} />}
          </div>
        )}
        {!org && <p style={{ fontSize: 12, color: "rgba(26,26,46,.4)", margin: 0 }}>Ask your Super Admin to assign you to an organization.</p>}
      </div>

      {/* Branch */}
      {branch && (
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${greenBorder}`, padding: "18px 22px", boxShadow: `0 4px 20px ${greenLight}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${green},#047857)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 14px ${greenBorder}` }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: green, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 2 }}>Your Branch</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1a2e" }}>{branch.branchName}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: branch.status === "ACTIVE" ? green : "#b45309", background: branch.status === "ACTIVE" ? greenLight : "rgba(180,83,9,.08)", border: `1px solid ${branch.status === "ACTIVE" ? greenBorder : "rgba(180,83,9,.2)"}`, borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>{branch.status}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {branch.city && <InfoChip icon="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" label="City" value={branch.city} color={green} />}
            {branch.address && <InfoChip icon="M2.25 21.75h19.5m-18-18v18m10.5-18v18m6-13.5V21" label="Address" value={branch.address} color={green} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Staff Management ──────────────────── */
function StaffSection({ profile, showToast }) {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | "add" | {edit: user}
  const [form, setForm]         = useState({});
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch]     = useState("");

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/auth/users");
      setStaff(data.filter(u => u.role === "STAFF"));
    } catch {
      showToast("Failed to load staff.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const openAdd  = () => { setForm({ name: "", email: "", password: "", role: "STAFF" }); setErrors({}); setModal("add"); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: "" }); setErrors({}); setModal({ edit: u }); };
  const closeModal = () => { setModal(null); setForm({}); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.name?.trim())  e.name = "Name is required";
    if (!form.email?.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (modal === "add" && !form.password?.trim()) e.password = "Password is required";
    else if (modal === "add" && form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === "add") {
        await axiosInstance.post("/auth/add", { ...form, role: "STAFF" });
        showToast("Staff member added!");
      } else {
        const payload = { name: form.name };
        if (form.password?.trim()) payload.password = form.password;
        await axiosInstance.put(`/auth/users/${modal.edit._id}`, payload);
        showToast("Staff updated!");
      }
      closeModal();
      loadStaff();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user) => {
    setToggling(user._id);
    try {
      await axiosInstance.put(`/auth/users/${user._id}`, { isActive: !user.isActive });
      showToast(`${user.name} ${!user.isActive ? "activated" : "deactivated"}.`);
      loadStaff();
    } catch {
      showToast("Failed to update status.", "error");
    } finally {
      setToggling(null);
    }
  };

  const filtered = staff.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const active   = staff.filter(u => u.isActive).length;
  const inactive = staff.filter(u => !u.isActive).length;

  const branchName = profile?.branch?.branchName;
  const orgName    = (profile?.organization || profile?.branch?.organization)?.name;

  return (
    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(26,26,46,.08)", boxShadow: "0 2px 16px rgba(26,26,46,.05)", overflow: "hidden", marginTop: 16 }}>

      {/* Header */}
      <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(26,26,46,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: 15, fontWeight: 800, color: "#1a1a2e" }}>Staff Management</span>
            {(branchName || orgName) && (
              <div style={{ fontSize: 11, color: "rgba(26,26,46,.4)", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>
                {[orgName, branchName].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          {/* Stats pills */}
          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: green, background: greenLight, border: `1px solid ${greenBorder}`, borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace" }}>✓ {active} active</span>
            {inactive > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace" }}>✗ {inactive} inactive</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.35)" strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...iStyle, width: 180, paddingLeft: 32, fontSize: 12 }}
              onFocus={e => e.target.style.borderColor = ac}
              onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"} />
          </div>
          <button onClick={loadStaff} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${acBorder}`, background: acLight, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: ac }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </button>
          <button onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${ac},#0369a1)`, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: `0 4px 14px ${acGlow}` }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff list */}
      <div style={{ padding: "16px 22px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>{search ? "No staff match your search" : "No staff yet"}</div>
            <div style={{ fontSize: 12, color: "rgba(26,26,46,.4)", marginBottom: 16 }}>{search ? "Try a different name or email." : "Add your first staff member to get started."}</div>
            {!search && <button onClick={openAdd} style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${ac},#0369a1)`, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "'Figtree',sans-serif" }}>+ Add First Staff</button>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((u, i) => (
              <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 14, border: "1px solid rgba(26,26,46,.07)", background: u.isActive ? "#fff" : "rgba(26,26,46,.02)", transition: "all .18s", animation: `fadeUp .3s ease ${i * 0.04}s both` }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = acBorder; e.currentTarget.style.boxShadow = `0 4px 18px ${acLight}`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,26,46,.07)"; e.currentTarget.style.boxShadow = "none"; }}>

                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: u.isActive ? `linear-gradient(135deg,${ac},#0369a1)` : "rgba(26,26,46,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: u.isActive ? `0 3px 12px ${acGlow}` : "none" }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{u.name?.[0]?.toUpperCase()}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: u.isActive ? "#1a1a2e" : "rgba(26,26,46,.4)" }}>{u.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: u.isActive ? green : "#b45309", background: u.isActive ? greenLight : "rgba(180,83,9,.08)", border: `1px solid ${u.isActive ? greenBorder : "rgba(180,83,9,.2)"}`, borderRadius: 99, padding: "1px 7px", fontFamily: "'DM Mono',monospace" }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(26,26,46,.42)" }}>{u.email}</div>
                </div>

                {/* Joined date */}
                <div style={{ fontSize: 11, color: "rgba(26,26,46,.3)", fontFamily: "'DM Mono',monospace", flexShrink: 0, display: "none" }} className="date-col">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {/* Edit */}
                  <button title="Edit" onClick={() => openEdit(u)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${acBorder}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: ac, transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = acLight; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </button>

                  {/* Toggle active */}
                  <button title={u.isActive ? "Deactivate" : "Activate"} onClick={() => handleToggle(u)} disabled={toggling === u._id}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${u.isActive ? "rgba(239,68,68,.25)" : greenBorder}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: u.isActive ? "#ef4444" : green, transition: "all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = u.isActive ? "rgba(239,68,68,.08)" : greenLight; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    {toggling === u._id
                      ? <Spinner size={12} color={u.isActive ? red : green} />
                      : u.isActive
                        ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        : <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === "add" ? "Add Staff Member" : `Edit — ${modal.edit?.name}`} onClose={closeModal}>
          {/* Branch context badge */}
          {(branchName || orgName) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, background: acLight, border: `1px solid ${acBorder}`, marginBottom: 18 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21" /></svg>
              <span style={{ fontSize: 12, color: ac, fontWeight: 600 }}>
                {modal === "add" ? "Will be added to" : "Member of"}: <strong>{[orgName, branchName].filter(Boolean).join(" · ")}</strong>
              </span>
            </div>
          )}

          <Field label="Full Name *" error={errors.name}>
            <Input placeholder="Enter full name" value={form.name || ""} error={errors.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} />
          </Field>

          {modal === "add" && (
            <Field label="Email Address *" error={errors.email}>
              <Input type="email" placeholder="staff@company.in" value={form.email || ""} error={errors.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(p => ({ ...p, email: "" })); }} />
            </Field>
          )}

          <Field label={modal === "add" ? "Password *" : "New Password (leave blank to keep)"} error={errors.password}>
            <Input type="password" placeholder={modal === "add" ? "Min 6 characters" : "Leave blank to keep current"} value={form.password || ""} error={errors.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(p => ({ ...p, password: "" })); }} />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            <PrimaryBtn onClick={handleSave} loading={saving}>
              {modal === "add" ? "Add Staff" : "Save Changes"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────── Reports ──────────────────────────── */
function ReportCard({ icon, label, desc, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: 16, borderRadius: 14, border: "1px solid rgba(26,26,46,.08)", background: "#fff", cursor: "pointer", transition: "all .2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = acBorder; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${acBorder}`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,26,46,.08)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: acLight, border: `1px solid ${acBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: "rgba(26,26,46,.4)" }}>{desc}</div>
    </div>
  );
}

function LogRow({ dot, text, time }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(26,26,46,.05)" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 5 }} />
      <div style={{ fontSize: 13, color: "rgba(26,26,46,.65)", flex: 1, lineHeight: 1.5 }}>{text}</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(26,26,46,.28)", whiteSpace: "nowrap", flexShrink: 0 }}>{time}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now      = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const [profile, setProfile]               = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [toast, setToast]                   = useState(null);

  // Real KPI data
  const [kpiProducts,  setKpiProducts]  = useState(null);
  const [kpiSales,     setKpiSales]     = useState(null);
  const [kpiSuppliers, setKpiSuppliers] = useState(null);
  const [kpiInvoices,  setKpiInvoices]  = useState(null);
  const [kpiReturns,   setKpiReturns]   = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Profile
    axiosInstance.get("/auth/me")
      .then(r => setProfile(r.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));

    // Products + stock counts
    axiosInstance.get("/products")
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setKpiProducts({
          total:      all.length,
          lowStock:   all.filter(p => p.stock <= 10).length,
          outOfStock: all.filter(p => p.stock === 0).length,
        });
      }).catch(() => {});

    // Today's sales
    const today = new Date().toISOString().split("T")[0];
    axiosInstance.get("/invoices", { params: { from: today, to: today, status: "PAID" } })
      .then(r => {
        const invs = Array.isArray(r.data) ? r.data : [];
        setKpiSales({ total: invs.reduce((s, i) => s + (i.grandTotal || i.totalAmount || 0), 0), count: invs.length });
      }).catch(() => {});

    // Active suppliers
    axiosInstance.get("/suppliers")
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setKpiSuppliers({ total: all.filter(s => s.status === "ACTIVE").length });
      }).catch(() => {});

    // All invoices today
    axiosInstance.get("/invoices", { params: { from: today, to: today } })
      .then(r => setKpiInvoices({ count: Array.isArray(r.data) ? r.data.length : 0 }))
      .catch(() => {});

    // Pending returns
    axiosInstance.get("/returns")
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setKpiReturns({ pending: all.filter(ret => ret.status === "PENDING").length });
      }).catch(() => {});
  }, []);

  const orgName    = profile?.organization?.name || profile?.branch?.organization?.name || user?.organization?.name;
  const branchName = profile?.branch?.branchName || user?.branch?.branchName;
  const contextLabel = branchName ? `${orgName || "Unknown Org"} · ${branchName}` : orgName || "No organization assigned";
  const fmtMoney = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${(n || 0)}`;

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: green, boxShadow: "0 0 8px rgba(5,150,105,.5)", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: ac, letterSpacing: ".2em", textTransform: "uppercase" }}>Branch Manager Console</span>
          </div>
          <h1 style={{ fontFamily: "'Figtree',sans-serif", fontSize: 30, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.02em", margin: 0, lineHeight: 1.1 }}>
            {greeting}, <em style={{ color: ac, fontStyle: "italic" }}>{user?.name?.split(" ")[0]}</em> 🏢
          </h1>
          <p style={{ fontSize: 13, color: "rgba(26,26,46,.45)", marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.35)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" /></svg>
            {profileLoading ? "Loading..." : contextLabel}
            <span style={{ color: "rgba(26,26,46,.25)" }}>·</span>
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/products/add")} style={{ padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${ac},#0369a1)`, color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: `0 4px 18px ${acGlow}`, display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Product
          </button>
          <button onClick={() => navigate("/sales/desk")} style={{ padding: "10px 20px", borderRadius: 12, border: `1.5px solid ${acBorder}`, cursor: "pointer", background: acLight, color: ac, fontSize: 13, fontWeight: 700, fontFamily: "'Figtree',sans-serif" }}>New Sale</button>
        </div>
      </div>

      {/* ── Org + Branch Banner ── */}
      <OrgBranchBanner profile={profile} loading={profileLoading} />

      {/* ── KPIs (real data) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard icon="M2.25 18.75a60.07 60.07 0 0115.797 2.101" label="Today's Sales"   value={kpiSales     ? fmtMoney(kpiSales.total)              : "—"} trend={kpiSales     ? `${kpiSales.count} invoices`                          : undefined} trendUp delay="0s"   onClick={() => navigate("/reports/sales")} />
        <KpiCard icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622"         label="Total Products"  value={kpiProducts  ? kpiProducts.total.toLocaleString("en-IN") : "—"} trend={kpiProducts  ? `${kpiProducts.lowStock} low stock`                   : undefined} trendUp={false} delay=".06s" onClick={() => navigate("/products")} />
        <KpiCard icon="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3"    label="Active Suppliers" value={kpiSuppliers ? kpiSuppliers.total                        : "—"} delay=".12s" onClick={() => navigate("/suppliers")} />
        <KpiCard icon="M9 14.25l6-6m4.5-3.493V21.75l-4.125-1.687a4.5 4.5 0 00-3.375 0L9 21.75" label="Pending Returns"  value={kpiReturns   ? kpiReturns.pending                         : "—"} delay=".18s" color="#b45309" light="rgba(180,83,9,.08)" border="rgba(180,83,9,.2)" onClick={() => navigate("/billing/returns")} />
        <KpiCard icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18"                          label="Invoices Today"  value={kpiInvoices  ? kpiInvoices.count                           : "—"} delay=".24s" />
        <KpiCard icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25"                          label="Stock Alerts"    value={kpiProducts  ? kpiProducts.lowStock                        : "—"} trend={kpiProducts?.outOfStock > 0 ? `${kpiProducts.outOfStock} out of stock` : "Need reorder"} trendUp={false} color={red} light="rgba(239,68,68,.08)" border="rgba(239,68,68,.2)" delay=".30s" onClick={() => navigate("/reports/low-stock")} />
      </div>

      {/* ── Inventory + Suppliers ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 16 }}>
        <SectionBox title="Inventory Management" icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <ActionTile icon="M12 4.5v15m7.5-7.5h-15"             label="Add New Product"       desc="Add to catalogue with cost & sell price"    onClick={() => navigate("/products/add")} />
            <ActionTile icon="M20.25 7.5l-.625 10.632"            label="Manage Products"        desc="Edit, update stock, set reorder level"      onClick={() => navigate("/products")} />
            <ActionTile icon="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318" label="Categories"      desc="Organise product hierarchy"                 onClick={() => navigate("/categories")} />
            <ActionTile icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25" label="Stock Management" desc="GRN entries & stock adjustments"             onClick={() => navigate("/inventory/stock")} />
          </div>
        </SectionBox>

        <SectionBox title="Supplier Management" icon="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H3">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <ActionTile icon="M12 4.5v15m7.5-7.5h-15"             label="Add Supplier"          desc="Register with GST & contact details"        onClick={() => navigate("/suppliers/add")} />
            <ActionTile icon="M8.25 18.75a1.5 1.5 0 01-3 0"       label="Manage Suppliers"      desc="Edit, view purchase history"                onClick={() => navigate("/suppliers")} />
            <ActionTile icon="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25" label="Purchase Orders / GRN" desc="Create & record supplier receipts"      onClick={() => navigate("/inventory/grn")} />
            <ActionTile icon="M9 15L3 9m0 0l6-6M3 9h12"           label="Billing & Returns"     desc="Sales oversight & return approvals"         onClick={() => navigate("/billing/returns")} />
            <ActionTile icon="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63" label="Service Requests" desc="Manage complaints & warranties" onClick={() => navigate("/admin/service-management")} />
          </div>
        </SectionBox>
      </div>

      {/* ── Staff Management ── */}
      <StaffSection profile={profile} showToast={showToast} />

      {/* ── Reports + Activity ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
        <SectionBox title="Reports" icon="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <ReportCard icon="M20.25 7.5l-.625 10.632"                                               label="Stock Report"    desc="Current levels & movement"       onClick={() => navigate("/reports/stock")} />
            <ReportCard icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71"        label="Low Stock"       desc="Items below reorder point"       onClick={() => navigate("/reports/low-stock")} />
            <ReportCard icon="M2.25 18.75a60.07 60.07 0 0115.797 2.101"                              label="Sales Report"    desc="Daily, weekly, monthly"          onClick={() => navigate("/reports/sales")} />
            <ReportCard icon="M3 13.125C3 12.504 3.504 12 4.125 12"                                  label="Profit Report"   desc="Margin & P&L analysis"           onClick={() => navigate("/reports/profit-loss")} />
            <ReportCard icon="M8.25 18.75a1.5 1.5 0 01-3 0"                                         label="Purchase Report" desc="Supplier payments & orders"      onClick={() => navigate("/reports/purchase")} />
            <ReportCard icon="M9 12h3.75M9 15h3.75"                                                  label="Invoice Report"  desc="All billing records"             onClick={() => navigate("/billing/invoice")} />
          </div>
        </SectionBox>

        <SectionBox title="Recent Activity" icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z">
          <LogRow dot={ac}                    text="Invoice activity tracked — check billing section"  time="live"   />
          <LogRow dot={green}                 text="Stock movements via GRN system"                    time="live"   />
          <LogRow dot={red}                   text="Low stock alerts shown above in real-time"         time="live"   />
          <LogRow dot={ac}                    text="Use Reports section for detailed analytics"        time="—"      />
          <LogRow dot="#b45309"               text="Pending returns require approval in billing"       time="live"   />
          <LogRow dot="rgba(26,26,46,.25)"    text="All data scoped to your assigned branch"          time="always" />
        </SectionBox>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        @media (max-width: 600px) {
          .dash-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-actions { flex-wrap: wrap !important; }
          .dash-h1 { font-size: 22px !important; }
          .staff-header { flex-direction: column !important; align-items: flex-start !important; }
          .staff-search { flex-wrap: wrap !important; }
          .search-input { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
