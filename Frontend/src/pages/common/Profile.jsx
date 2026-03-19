import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROLE_CONFIG } from "../../utils/constants";
import { PageShell } from "../../components/ui/PageShell";
import { IS, FieldLabel, FormSuccess, FormError, FormDivider } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";
import { updateProfileApi, changePasswordSendOtpApi, changePasswordApi } from "../../services/authService";
import { validateRequired, validatePhone, validateStrongPassword, validateConfirmPassword } from "../../utils/validators";

/* ── Skeleton shimmer block ─────────────────────────────────── */
const Skeleton = ({ w = "100%", h = "46px", r = "10px" }) => (
  <div style={{
    width: w, height: h, borderRadius: r,
    background: "linear-gradient(90deg,rgba(26,26,46,.06) 25%,rgba(26,26,46,.1) 50%,rgba(26,26,46,.06) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    marginBottom: "12px",
  }} />
);

/* ── Read-only info card ─────────────────────────────────────── */
const InfoCard = ({ label, value, loading }) => (
  <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.07)" }}>
    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
    {loading
      ? <div style={{ height: "18px", borderRadius: "6px", background: "rgba(26,26,46,.07)", animation: "shimmer 1.4s infinite", backgroundSize: "200% 100%" }} />
      : <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a1a2e" }}>{value || "—"}</div>
    }
  </div>
);

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const role = ROLE_CONFIG[user?.role] || {};
  const ac = role.accent || "#7c3aed";

  const [tab, setTab]               = useState("profile");
  const [profile, setProfile]       = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [form, setForm]             = useState({ name: "", phone: "", address: "" });
  const [saved, setSaved]           = useState("");
  const [saveErr, setSaveErr]       = useState("");
  const [saving, setSaving]         = useState(false);

  // OTP change-password state
  const [pwStep, setPwStep]         = useState("form"); // "form" | "otp" | "done"
  const [pwForm, setPwForm]         = useState({ current: "", newPw: "", confirm: "" });
  const [otpValue, setOtpValue]     = useState("");
  const [pwMsg, setPwMsg]           = useState({ ok: "", err: "" });
  const [pwLoading, setPwLoading]   = useState(false);
  const [resendMsg, setResendMsg]   = useState("");

  // ── Fetch full profile from /auth/me ─────────────────────────
  useEffect(() => {
    axiosInstance.get("/auth/me")
      .then(r => {
        const d = r.data;
        setProfile(d);
        setForm({
          name:    d.name    || "",
          phone:   d.phone   || "",
          address: d.address || "",
        });
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  // Derived workspace info
  const orgName    = profile?.organization?.name    || profile?.branch?.organization?.name || null;
  const orgCity    = profile?.organization?.city    || profile?.branch?.organization?.city || null;
  const orgEmail   = profile?.organization?.email   || profile?.branch?.organization?.email || null;
  const orgPhone   = profile?.organization?.phone   || profile?.branch?.organization?.phone || null;
  const branchName = profile?.branch?.branchName    || null;
  const branchCity = profile?.branch?.city          || null;

  const joinDate   = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // ── Save profile ─────────────────────────────────────────────
  const handleSave = async () => {
    setSaved(""); setSaveErr("");
    const nameErr = validateRequired(form.name, "Name");
    const phoneErr = form.phone.trim() ? validatePhone(form.phone) : "";
    if (nameErr || phoneErr) { setSaveErr(nameErr || phoneErr); return; }
    setSaving(true);
    try {
      const { user: updated } = await updateProfileApi({
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        address: form.address.trim(),
      });
      updateUser({ name: updated.name });
      setProfile(prev => ({ ...prev, ...updated }));
      setSaved("Profile updated successfully!");
      setTimeout(() => setSaved(""), 3500);
    } catch (e) {
      setSaveErr(e?.response?.data?.message || "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  // ── OTP Step 1: send OTP ─────────────────────────────────────
  const handleSendOtp = async () => {
    setPwMsg({ ok: "", err: "" }); setResendMsg("");
    const currErr = validateRequired(pwForm.current, "Current password");
    const newPwErr = validateStrongPassword(pwForm.newPw);
    const confirmErr = validateConfirmPassword(pwForm.newPw, pwForm.confirm);
    if (currErr || newPwErr || confirmErr) { setPwMsg({ ok: "", err: currErr || newPwErr || confirmErr }); return; }
    setPwLoading(true);
    try {
      await changePasswordSendOtpApi();
      setPwStep("otp");
      setPwMsg({ ok: "", err: "" });
    } catch (e) {
      setPwMsg({ ok: "", err: e?.response?.data?.message || "Failed to send OTP. Try again." });
    } finally { setPwLoading(false); }
  };

  // ── OTP Step 2: verify OTP ───────────────────────────────────
  const handleVerifyOtp = async () => {
    setPwMsg({ ok: "", err: "" });
    if (!otpValue || otpValue.length !== 6) { setPwMsg({ ok: "", err: "Enter the 6-digit OTP." }); return; }
    setPwLoading(true);
    try {
      await changePasswordApi({ currentPassword: pwForm.current, otp: otpValue, newPassword: pwForm.newPw });
      setPwStep("done");
      setPwMsg({ ok: "Password changed successfully!", err: "" });
      setPwForm({ current: "", newPw: "", confirm: "" });
      setOtpValue("");
    } catch (e) {
      setPwMsg({ ok: "", err: e?.response?.data?.message || "Invalid or expired OTP." });
    } finally { setPwLoading(false); }
  };

  const handleResendOtp = async () => {
    setResendMsg(""); setPwMsg({ ok: "", err: "" });
    try {
      await changePasswordSendOtpApi();
      setResendMsg("New OTP sent! Check your inbox.");
    } catch {
      setPwMsg({ ok: "", err: "Failed to resend OTP." });
    }
  };

  const resetPwFlow = () => {
    setPwStep("form");
    setPwForm({ current: "", newPw: "", confirm: "" });
    setOtpValue(""); setPwMsg({ ok: "", err: "" }); setResendMsg("");
  };

  // ── Reusable label+value display row ────────────────────────
  const InfoPill = ({ icon, colorVar, label, title, subtitle }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "14px", background: `${colorVar}08`, border: `1px solid ${colorVar}25` }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `${colorVar}12`, border: `1px solid ${colorVar}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={colorVar} strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", fontWeight: 700, color: colorVar, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || <span style={{ color: "rgba(26,26,46,.28)", fontStyle: "italic", fontWeight: 400 }}>Not assigned</span>}
        </div>
        {subtitle && <div style={{ fontSize: "11px", color: "rgba(26,26,46,.42)", marginTop: "2px" }}>{subtitle}</div>}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <PageShell title="My Profile" subtitle="Manage your account details and security">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}>

          {/* ── Sidebar ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>

              {/* Avatar */}
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `linear-gradient(135deg,${role.btnFrom || ac},${role.btnTo || ac})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 8px 24px ${role.glow || "rgba(0,0,0,.15)"}` }}>
                <span style={{ fontSize: "32px", fontWeight: 800, color: "#fff" }}>
                  {(profile?.name || user?.name)?.charAt(0)?.toUpperCase()}
                </span>
              </div>

              {profileLoading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <Skeleton w="140px" h="20px" r="6px" />
                  <Skeleton w="100px" h="14px" r="4px" />
                  <Skeleton w="160px" h="13px" r="4px" />
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "4px" }}>{profile?.name}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: ac, letterSpacing: ".15em", textTransform: "uppercase" }}>{role.name} · {role.level}</div>
                  <div style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", marginTop: "4px" }}>{profile?.email}</div>
                </>
              )}

              {/* Org & Branch mini-badges for ADMIN/STAFF */}
              {(user?.role === "ADMIN" || user?.role === "STAFF") && (
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "7px", textAlign: "left" }}>
                  {profileLoading ? (
                    <><Skeleton h="40px" r="10px" /><Skeleton h="40px" r="10px" /></>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 11px", borderRadius: "10px", background: "rgba(124,58,237,.06)", border: "1px solid rgba(124,58,237,.15)" }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" /></svg>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", color: "#7c3aed", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>Organisation</div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {orgName || <span style={{ color: "rgba(26,26,46,.3)", fontStyle: "italic", fontWeight: 400 }}>Not assigned</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 11px", borderRadius: "10px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.15)" }}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21" /></svg>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", color: "#059669", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>Branch</div>
                          <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {branchName || <span style={{ color: "rgba(26,26,46,.3)", fontStyle: "italic", fontWeight: 400 }}>Not assigned</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Member since */}
              <div style={{ marginTop: "14px", padding: "8px 14px", borderRadius: "10px", background: `${ac}10`, border: `1px solid ${ac}30` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.38)", letterSpacing: ".12em", textTransform: "uppercase" }}>Member since</div>
                {profileLoading
                  ? <div style={{ height: "16px", borderRadius: "5px", background: "rgba(26,26,46,.07)", marginTop: "4px", animation: "shimmer 1.4s infinite", backgroundSize: "200% 100%" }} />
                  : <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#1a1a2e", marginTop: "2px" }}>{joinDate || "—"}</div>
                }
              </div>
            </div>

            {/* Nav tabs */}
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 8px rgba(26,26,46,.04)" }}>
              {[["profile", "👤 Profile Details"], ["security", "🔒 Change Password"], ["activity", "📋 Activity"]].map(([key, label]) => (
                <div key={key} onClick={() => { setTab(key); if (key === "security") resetPwFlow(); }}
                  style={{ padding: "13px 18px", cursor: "pointer", fontSize: "13.5px", fontWeight: tab === key ? 700 : 500, color: tab === key ? ac : "rgba(26,26,46,.55)", background: tab === key ? `${ac}08` : "transparent", borderLeft: `3px solid ${tab === key ? ac : "transparent"}`, transition: "all .15s", borderBottom: "1px solid rgba(26,26,46,.05)" }}>
                  {label}
                </div>
              ))}
            </div>

            <button onClick={() => { logout(); navigate("/login", { replace: true }); }}
              style={{ padding: "11px", borderRadius: "12px", border: "1.5px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.05)", color: "#dc2626", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree',sans-serif", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              Sign Out
            </button>
          </div>

          {/* ── Main Content ──────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "28px", boxShadow: "0 2px 12px rgba(26,26,46,.05)" }}>

            {/* ════════════════ PROFILE TAB ════════════════════ */}
            {tab === "profile" && (<>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "22px" }}>Profile Details</div>

              <FormSuccess message={saved} />
              <FormError   message={saveErr} />

              {/* ── Editable fields ── */}
              <FormDivider label="Personal Information" />

              <FieldLabel>Full Name *</FieldLabel>
              {profileLoading
                ? <Skeleton />
                : <input value={form.name} onChange={set("name")} style={IS} placeholder="Your full name" />
              }

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <FieldLabel>Phone Number</FieldLabel>
                  {profileLoading
                    ? <Skeleton />
                    : <input value={form.phone} onChange={set("phone")} style={IS} placeholder="10-digit mobile" maxLength={15} />
                  }
                </div>
                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  {profileLoading
                    ? <Skeleton />
                    : <input value={profile?.email || ""} disabled style={{ ...IS, background: "rgba(26,26,46,.03)", color: "rgba(26,26,46,.45)", cursor: "not-allowed", borderColor: "rgba(26,26,46,.08)" }} />
                  }
                </div>
              </div>

              <FieldLabel>Address</FieldLabel>
              {profileLoading
                ? <Skeleton />
                : <input value={form.address} onChange={set("address")} style={IS} placeholder="City, State" />
              }

              {/* ── Read-only account info ── */}
              <FormDivider label="Account Information" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                <InfoCard label="Role"         value={role.name}                     loading={profileLoading} />
                <InfoCard label="Access Level" value={role.level}                    loading={profileLoading} />
                <InfoCard label="Status"       value={profile?.isActive ? "✅ Active" : "❌ Inactive"} loading={profileLoading} />
                <InfoCard label="Member Since" value={joinDate}                      loading={profileLoading} />
              </div>

              {/* ── Workspace assignment (ADMIN / STAFF only) ── */}
              {(user?.role === "ADMIN" || user?.role === "STAFF") && (<>
                <FormDivider label="Workspace Assignment" />
                {profileLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    <Skeleton h="68px" r="14px" />
                    <Skeleton h="68px" r="14px" />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    <InfoPill
                      icon="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                      colorVar="#7c3aed" label="Organisation"
                      title={orgName}
                      subtitle={[orgCity, orgEmail, orgPhone].filter(Boolean).join(" · ") || null}
                    />
                    <InfoPill
                      icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"
                      colorVar="#059669" label="Branch"
                      title={branchName}
                      subtitle={branchCity ? `📍 ${branchCity}` : null}
                    />
                  </div>
                )}
              </>)}

              <button onClick={handleSave} disabled={saving || profileLoading}
                style={{ padding: "11px 28px", borderRadius: "12px", border: "none", cursor: (saving || profileLoading) ? "not-allowed" : "pointer", background: `linear-gradient(135deg,${ac},${role.btnTo || ac})`, color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: `0 4px 16px ${role.glow || "rgba(0,0,0,.15)"}`, opacity: (saving || profileLoading) ? 0.6 : 1, display: "flex", alignItems: "center", gap: "7px" }}>
                {saving ? (
                  <><span style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} /> Saving…</>
                ) : "Save Changes"}
              </button>
            </>)}

            {/* ════════════════ SECURITY TAB ═══════════════════ */}
            {tab === "security" && (<>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "22px" }}>Change Password</div>

              <FormSuccess message={pwMsg.ok} />
              <FormError   message={pwMsg.err} />

              {/* Step indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                {[["1", "Enter details"], ["2", "Verify OTP"]].map(([num, lbl], i) => {
                  const active = (i === 0 && pwStep === "form") || (i === 1 && (pwStep === "otp" || pwStep === "done"));
                  const done   = i === 0 && (pwStep === "otp" || pwStep === "done");
                  return (
                    <div key={num} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, fontFamily: "'DM Mono',monospace", background: done ? "#059669" : active ? ac : "rgba(26,26,46,.08)", color: done || active ? "#fff" : "rgba(26,26,46,.35)", transition: "all .2s" }}>
                          {done ? "✓" : num}
                        </div>
                        <span style={{ fontSize: "12px", color: active ? "#1a1a2e" : "rgba(26,26,46,.35)", fontWeight: active ? 600 : 400 }}>{lbl}</span>
                      </div>
                      {i === 0 && <div style={{ width: "32px", height: "1px", background: pwStep !== "form" ? ac : "rgba(26,26,46,.1)", transition: "background .3s" }} />}
                    </div>
                  );
                })}
              </div>

              {/* STEP 1 */}
              {pwStep === "form" && (<>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(2,132,199,.06)", border: "1px solid rgba(2,132,199,.15)", fontSize: "12.5px", color: "rgba(26,26,46,.6)", lineHeight: 1.6, marginBottom: "20px" }}>
                  🔒 Enter your current and new password. We'll send a one-time code to <strong>{profile?.email || "your email"}</strong> to confirm.
                </div>
                <FieldLabel>Current Password *</FieldLabel>
                <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} style={IS} placeholder="Enter current password" />
                <FormDivider label="New Password" />
                <FieldLabel>New Password *</FieldLabel>
                <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))} style={IS} placeholder="At least 6 characters" />
                <FieldLabel>Confirm New Password *</FieldLabel>
                <input type="password" value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                  style={{ ...IS, borderColor: pwForm.confirm && pwForm.newPw !== pwForm.confirm ? "rgba(239,68,68,.4)" : undefined }}
                  placeholder="Repeat new password"
                />
                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                  <div style={{ color: "#dc2626", fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "-6px", marginBottom: "12px" }}>Passwords don't match</div>
                )}
                <div style={{ marginTop: "8px" }}>
                  <button onClick={handleSendOtp} disabled={pwLoading}
                    style={{ padding: "11px 24px", borderRadius: "12px", border: "none", cursor: pwLoading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: "0 4px 16px rgba(79,70,229,.25)", opacity: pwLoading ? 0.7 : 1 }}>
                    {pwLoading ? "Sending OTP…" : "Send OTP to Email →"}
                  </button>
                </div>
              </>)}

              {/* STEP 2 */}
              {pwStep === "otp" && (<>
                <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(79,70,229,.06)", border: "1px solid rgba(79,70,229,.18)", fontSize: "12.5px", color: "#4f46e5", marginBottom: "20px", fontFamily: "'DM Mono',monospace" }}>
                  📬 OTP sent to <strong>{profile?.email}</strong>. Valid for 10 minutes.
                </div>
                {resendMsg && (
                  <div style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: "12px", background: "rgba(5,150,105,.07)", border: "1px solid rgba(5,150,105,.2)", fontSize: "12px", color: "#059669", fontFamily: "'DM Mono',monospace" }}>✓ {resendMsg}</div>
                )}
                <FieldLabel>6-Digit OTP *</FieldLabel>
                <input type="text" value={otpValue} maxLength={6}
                  onChange={e => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ ...IS, letterSpacing: "8px", fontSize: "22px", fontFamily: "'DM Mono',monospace", textAlign: "center", height: "56px" }}
                  placeholder="••••••" autoFocus
                />
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button onClick={handleVerifyOtp} disabled={pwLoading}
                    style={{ padding: "11px 24px", borderRadius: "12px", border: "none", cursor: pwLoading ? "not-allowed" : "pointer", background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Figtree',sans-serif", boxShadow: "0 4px 16px rgba(239,68,68,.25)", opacity: pwLoading ? 0.7 : 1 }}>
                    {pwLoading ? "Verifying…" : "Confirm & Update Password"}
                  </button>
                  <button onClick={handleResendOtp} disabled={pwLoading}
                    style={{ padding: "11px 18px", borderRadius: "12px", border: "1.5px solid rgba(79,70,229,.25)", background: "transparent", color: "#4f46e5", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>
                    Resend OTP
                  </button>
                  <button onClick={resetPwFlow}
                    style={{ padding: "11px 14px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.1)", background: "transparent", color: "rgba(26,26,46,.45)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>
                    ← Back
                  </button>
                </div>
              </>)}

              {/* DONE */}
              {pwStep === "done" && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: "52px", marginBottom: "14px" }}>✅</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "8px" }}>Password Updated!</div>
                  <p style={{ fontSize: "13px", color: "rgba(26,26,46,.45)", marginBottom: "24px" }}>Your password has been changed successfully.</p>
                  <button onClick={resetPwFlow}
                    style={{ padding: "10px 22px", borderRadius: "12px", border: "1.5px solid rgba(79,70,229,.25)", background: "transparent", color: "#4f46e5", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>
                    Change Again
                  </button>
                </div>
              )}
            </>)}

            {/* ════════════════ ACTIVITY TAB ═══════════════════ */}
            {tab === "activity" && (<>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", marginBottom: "22px" }}>Recent Activity</div>
              {[
                { icon: "🔐", text: "Logged in from Chrome · Windows", time: "Just now",    color: ac },
                { icon: "✏️", text: "Profile viewed",                   time: "2 hours ago", color: ac },
                { icon: "🔐", text: "Logged in from Chrome · Windows", time: "Yesterday",   color: "rgba(26,26,46,.3)" },
                { icon: "🔑", text: "Password last changed",            time: "30 days ago", color: "rgba(26,26,46,.3)" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 0", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${a.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: "13.5px", color: "#1a1a2e", fontWeight: 500 }}>{a.text}</div></div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.3)", whiteSpace: "nowrap" }}>{a.time}</div>
                </div>
              ))}
            </>)}

          </div>
        </div>
      </PageShell>
    </>
  );
}
