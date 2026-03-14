import { useState, useRef, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROLE_CONFIG } from "../../utils/constants";
import { validateEmail, validatePassword } from "../../utils/validators";

/* ── Icons ───────────────────────────────────────────────────── */
const EmailIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);
const EyeIcon = ({ open }) => (
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
    {open
      ? <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
      : <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    }
  </svg>
);

/* ── Floating Label Input ─────────────────────────────────────── */
function FloatingInput({ id, type, label, value, onChange, error, autoComplete, icon, rightSlot, accent, glow, animDelay = "0s" }) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value?.length > 0;
  return (
    <div style={{ position: "relative", marginBottom: "13px", animation: `fadeUp .48s ease ${animDelay} both` }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center", height: "54px",
        borderRadius: "14px",
        border: `1.5px solid ${error ? "rgba(239,68,68,.5)" : focused ? accent : "rgba(26,26,46,.1)"}`,
        background: focused ? "#fff" : "rgba(26,26,46,.025)",
        boxShadow: error ? "0 0 0 4px rgba(239,68,68,.07)" : focused ? `0 0 0 4px ${glow},0 2px 8px rgba(0,0,0,.06)` : "none",
        transition: "all .22s",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px", flexShrink: 0, color: focused ? accent : "rgba(26,26,46,.28)", transition: "color .22s" }}>{icon}</div>
        <input id={id} type={type} value={value} onChange={onChange} autoComplete={autoComplete} placeholder=" "
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, height: "100%", background: "transparent", border: "none", outline: "none", color: "#1a1a2e", fontSize: "14px", fontFamily: "'Figtree',sans-serif", fontWeight: 400, paddingTop: lifted ? "15px" : "0", transition: "padding-top .16s" }}
        />
        <label htmlFor={id} style={{
          position: "absolute", left: "50px", pointerEvents: "none",
          fontFamily: lifted ? "'DM Mono',monospace" : "'Figtree',sans-serif",
          fontWeight: lifted ? 400 : 500, fontSize: lifted ? "9.5px" : "14px",
          color: lifted ? (error ? "rgba(220,38,38,.7)" : accent) : "rgba(26,26,46,.38)",
          top: lifted ? "10px" : "50%", transform: lifted ? "none" : "translateY(-50%)",
          letterSpacing: lifted ? ".12em" : "normal", textTransform: lifted ? "uppercase" : "none",
          transition: "all .16s ease",
        }}>{label}</label>
        {rightSlot && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "50px", flexShrink: 0 }}>{rightSlot}</div>}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", paddingLeft: "50px", color: "rgba(220,38,38,.8)", fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>
          <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}
    </div>
  );
}

/* ── OTP Input (6 individual boxes) ──────────────────────────── */
function OtpInput({ value, onChange, accent, glow }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs[i - 1].current?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs[i + 1].current?.focus();
    }
  };

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;
    // Handle paste of full OTP
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6);
      onChange(pasted);
      refs[Math.min(pasted.length, 5)].current?.focus();
      return;
    }
    const next = value.slice(0, i) + raw[0] + value.slice(i + 1);
    onChange(next);
    if (i < 5) refs[i + 1].current?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "8px 0 20px" }}>
      {digits.map((d, i) => (
        <div key={i} style={{
          width: "52px", height: "60px", borderRadius: "14px",
          border: `2px solid ${d ? accent : "rgba(26,26,46,.12)"}`,
          background: d ? `${glow}` : "#fff",
          boxShadow: d ? `0 0 0 3px ${glow}` : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .18s",
          animation: `fadeUp .35s ease ${i * 0.05}s both`,
        }}>
          <input
            ref={refs[i]}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={d}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKey(i, e)}
            onFocus={(e) => e.target.select()}
            style={{
              width: "100%", height: "100%", border: "none", outline: "none",
              background: "transparent", textAlign: "center",
              fontSize: "22px", fontWeight: 800, color: "#1a1a2e",
              fontFamily: "'DM Mono',monospace", cursor: "pointer",
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Role Card ───────────────────────────────────────────────── */
function RoleCard({ role, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const active = isSelected || hovered;
  return (
    <div role="button" tabIndex={0}
      onClick={() => onSelect(role.key)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(role.key)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", cursor: "pointer", background: "#fff", borderRadius: "22px",
        padding: "28px 24px 26px",
        border: `2px solid ${isSelected ? role.accent : active ? "rgba(26,26,46,.15)" : "rgba(26,26,46,.07)"}`,
        boxShadow: isSelected ? `0 20px 56px rgba(0,0,0,.14), 0 0 0 3px ${role.accent}55, 0 0 32px ${role.glow}` : active ? "0 16px 48px rgba(0,0,0,.1)" : "0 2px 12px rgba(0,0,0,.05)",
        transform: active ? "translateY(-5px) scale(1.015)" : "none",
        transition: "transform .32s cubic-bezier(.34,1.48,.64,1),box-shadow .3s,border-color .3s",
        overflow: "hidden", outline: "none",
      }}
    >
      <div style={{ position: "absolute", top: "-30px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: role.halo, filter: "blur(28px)", pointerEvents: "none", opacity: active ? 1 : 0.7, transition: "opacity .3s" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "22px", background: "linear-gradient(135deg,rgba(255,255,255,.9) 0%,rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
      <div style={{ width: "52px", height: "52px", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", background: active ? role.light : "rgba(26,26,46,.04)", border: `1px solid ${active ? role.border : "rgba(26,26,46,.08)"}`, boxShadow: active ? `0 4px 16px ${role.glow}` : "none", marginBottom: "18px", transition: "all .3s", position: "relative", zIndex: 1 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={role.accent} strokeWidth="1.8" width="24" height="24">
          <path strokeLinecap="round" strokeLinejoin="round" d={role.iconPath} />
        </svg>
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.3)", letterSpacing: ".18em", textTransform: "uppercase", marginBottom: "6px", position: "relative", zIndex: 1 }}>{role.level}</div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 700, color: "#1a1a2e", marginBottom: "6px", lineHeight: 1.2, position: "relative", zIndex: 1 }}>{role.name}</div>
      <div style={{ fontSize: "12px", color: "rgba(26,26,46,.42)", lineHeight: 1.6, position: "relative", zIndex: 1 }}>{role.desc}</div>
      <div style={{ position: "absolute", top: "16px", right: "16px", width: "24px", height: "24px", borderRadius: "50%", background: isSelected ? role.accent : "#fff", border: `1.5px solid ${isSelected ? role.accent : "rgba(26,26,46,.12)"}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isSelected ? `0 4px 12px ${role.glow}` : "none", transition: "all .25s", color: "#fff", zIndex: 2, animation: isSelected ? "checkPop .25s cubic-bezier(.34,1.6,.64,1) both" : "none" }}>
        {isSelected && <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="11" height="11"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", borderRadius: "0 0 22px 22px", background: `linear-gradient(90deg,${role.accent},${role.btnTo})`, opacity: isSelected ? 1 : active ? 0.5 : 0, transition: "opacity .28s" }} />
    </div>
  );
}

/* ── Step Indicator ──────────────────────────────────────────── */
function StepDots({ step, accent }) {
  const steps = ["Role", "Login", "Verify"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginBottom: "28px", animation: "fadeUp .4s ease .1s both" }}>
      {steps.map((label, i) => {
        const done   = i < step;
        const active = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{ width: active ? "28px" : "22px", height: "22px", borderRadius: "99px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, fontFamily: "'DM Mono',monospace", background: done ? "#059669" : active ? accent : "rgba(26,26,46,.08)", color: (done || active) ? "#fff" : "rgba(26,26,46,.3)", transition: "all .3s cubic-bezier(.34,1.4,.64,1)", boxShadow: active ? `0 4px 12px ${accent}55` : "none" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "8px", letterSpacing: ".1em", textTransform: "uppercase", color: active ? "#1a1a2e" : "rgba(26,26,46,.3)", fontWeight: active ? 600 : 400, transition: "color .2s" }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: "28px", height: "1.5px", background: done ? "#059669" : "rgba(26,26,46,.08)", borderRadius: "99px", marginBottom: "16px", transition: "background .4s" }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Login Page ─────────────────────────────────────────── */
export default function Login() {
  const { loginSendOtp, loginVerifyOtp } = useAuth();
  const navigate = useNavigate();
  const { selectedRole, setSelectedRole } = useOutletContext();

  // screen: "role" | "form" | "otp"
  const [screen, setScreen]         = useState("role");
  const [transitioning, setTrans]   = useState(false);

  // Form state
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [remember, setRemember]     = useState(false);
  const [emailErr, setEmailErr]     = useState("");
  const [passErr, setPassErr]       = useState("");
  const [alertErr, setAlertErr]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [attempts, setAttempts]     = useState(0);
  const [locked, setLocked]         = useState(false);
  const [lockLeft, setLockLeft]     = useState(0);

  // OTP state
  const [otp, setOtp]               = useState("");
  const [otpErr, setOtpErr]         = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendCool, setResendCool] = useState(0);

  const role = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  const stepIndex = screen === "role" ? 0 : screen === "form" ? 1 : 2;

  const transition = (to, delay = 280) => {
    setTrans(true);
    setTimeout(() => { setScreen(to); setTrans(false); }, delay);
  };

  const goToForm = () => {
    if (!selectedRole) return;
    setEmail(ROLE_CONFIG[selectedRole].email);
    setPassword(""); setAlertErr(""); setEmailErr(""); setPassErr("");
    transition("form");
  };

  const goBack = () => {
    if (screen === "otp") { setOtp(""); setOtpErr(""); transition("form"); }
    else { transition("role"); }
  };

  // Step 1: submit credentials → send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || loading) return;
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailErr(eErr); setPassErr(pErr); setAlertErr("");
    if (eErr || pErr) return;

    setLoading(true);
    try {
      await loginSendOtp(email, password, selectedRole);
      setOtp(""); setOtpErr("");
      transition("otp");
      startResendCooldown();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Incorrect credentials";
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLocked(true); setLockLeft(30);
        const interval = setInterval(() => {
          setLockLeft(p => { if (p <= 1) { clearInterval(interval); setLocked(false); setAttempts(0); return 0; } return p - 1; });
        }, 1000);
      } else {
        setAlertErr(`${msg}. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? "s" : ""} remaining.`);
      }
    } finally { setLoading(false); }
  };

  // Step 2: verify OTP → login
  const handleVerifyOtp = async () => {
    setOtpErr("");
    if (!otp || otp.length !== 6) { setOtpErr("Enter the 6-digit OTP from your email."); return; }
    setOtpLoading(true);
    try {
      const user = await loginVerifyOtp(email, otp, selectedRole, remember);
      const home = { SUPER_ADMIN: "/dashboard/superadmin", ADMIN: "/dashboard/admin", STAFF: "/dashboard/inventory", CUSTOMER: "/dashboard/cashier" };
      navigate(home[user.role] ?? "/", { replace: true });
    } catch (err) {
      setOtpErr(err?.response?.data?.message || err?.message || "Invalid or expired OTP.");
    } finally { setOtpLoading(false); }
  };

  // Resend OTP
  const startResendCooldown = () => {
    setResendCool(30);
    const t = setInterval(() => setResendCool(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
  };

  const handleResend = async () => {
    if (resendCool > 0 || resending) return;
    setResending(true); setOtpErr("");
    try {
      await loginSendOtp(email, password, selectedRole);
      setOtp("");
      startResendCooldown();
    } catch (err) {
      setOtpErr(err?.response?.data?.message || "Failed to resend OTP.");
    } finally { setResending(false); }
  };

  /* ── SCREEN: Role Select ─────────────────────────────────── */
  if (screen === "role") return (
    <div style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "scale(.97)" : "scale(1)", transition: "all .28s", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "1020px", padding: "0 24px" }}>
      <StepDots step={0} accent="#4f46e5" />
      <div style={{ textAlign: "center", marginBottom: "44px", animation: "fadeUp .6s ease .15s both" }}>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.03em", lineHeight: 1.08, marginBottom: "10px" }}>
          Sign in as<br />
          <em style={{ fontStyle: "italic", color: role ? role.accent : "#4f46e5", transition: "color .5s" }}>
            {role ? role.name : "your role"}
          </em>
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(26,26,46,.45)" }}>Choose your role to access your personalised workspace</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "16px", width: "100%", animation: "fadeUp .6s ease .28s both" }}>
        {Object.values(ROLE_CONFIG).map((r) => (
          <RoleCard key={r.key} role={r} isSelected={selectedRole === r.key} onSelect={setSelectedRole} />
        ))}
      </div>
      <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "20px", animation: "fadeUp .6s ease .42s both" }}>
        <button disabled={!selectedRole} onClick={goToForm}
          style={{ height: "52px", padding: "0 36px", borderRadius: "14px", border: "none", cursor: selectedRole ? "pointer" : "not-allowed", fontFamily: "'Figtree',sans-serif", fontSize: "14px", fontWeight: 700, background: selectedRole ? `linear-gradient(135deg,${role.btnFrom},${role.btnTo})` : "rgba(26,26,46,.08)", color: selectedRole ? "#fff" : "rgba(26,26,46,.28)", display: "flex", alignItems: "center", gap: "10px", boxShadow: selectedRole ? `0 6px 28px ${role.glow}` : "none", transition: "all .3s cubic-bezier(.34,1.4,.64,1)" }}>
          <span>{selectedRole ? `Continue as ${role.name}` : "Select a role first"}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </button>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.28)", letterSpacing: ".12em", textTransform: "uppercase" }}>4 roles · secure access</span>
      </div>
    </div>
  );

  /* ── Shared card wrapper for form + otp screens ─────────── */
  const RoleChip = () => (
    <div role="button" tabIndex={0} onClick={goBack}
      style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 18px 8px 8px", background: "#fff", borderRadius: "100px", border: "1.5px solid rgba(26,26,46,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.06)", cursor: "pointer", marginBottom: "22px", transition: "all .2s", animation: "fadeDown .5s ease .05s both", outline: "none" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = role.border; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(26,26,46,.08)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ width: "30px", height: "30px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: role.light, border: `1px solid ${role.border}`, flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={role.accent} strokeWidth="1.8" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d={role.iconPath} /></svg>
      </div>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", lineHeight: 1 }}>{role.name}</div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: "rgba(26,26,46,.3)", letterSpacing: ".12em", textTransform: "uppercase", marginTop: "2px" }}>← back</div>
      </div>
    </div>
  );

  /* ── SCREEN: Login Form ──────────────────────────────────── */
  if (screen === "form") return (
    <div style={{ opacity: transitioning ? 0 : 1, transition: "opacity .28s", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "420px", padding: "0 20px" }}>
      <StepDots step={1} accent={role.accent} />
      <RoleChip />

      <div style={{ width: "100%", background: "#fff", borderRadius: "24px", border: "1.5px solid rgba(26,26,46,.07)", boxShadow: "0 8px 48px rgba(0,0,0,.08)", padding: "38px 36px 34px", position: "relative", overflow: "hidden", animation: "popIn .55s cubic-bezier(.34,1.24,.64,1) .08s both" }}>
        {/* Left side edge color bar */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: `linear-gradient(180deg,${role.btnFrom},${role.btnTo})`, borderRadius: "24px 0 0 24px" }} />
        {/* Right side edge color bar */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "4px", height: "100%", background: `linear-gradient(180deg,${role.btnFrom},${role.btnTo})`, borderRadius: "0 24px 24px 0" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "5px", background: `linear-gradient(90deg,${role.btnFrom},${role.btnTo})`, borderRadius: "24px 24px 0 0" }} />
        <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: "200px", height: "80px", borderRadius: "50%", background: role.glow, filter: "blur(24px)", pointerEvents: "none" }} />

        <div style={{ textAlign: "center", marginBottom: "26px", position: "relative", zIndex: 2, animation: "fadeUp .5s ease .18s both" }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "26px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.025em", marginBottom: "5px" }}>Welcome back</h2>
          <p style={{ fontSize: "13.5px", color: "rgba(26,26,46,.4)" }}>Enter your credentials — we'll send a verification code to your email</p>
        </div>

        {locked && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "12px", marginBottom: "16px", border: "1px solid rgba(234,88,12,.2)", background: "rgba(234,88,12,.05)", fontSize: "12px", fontFamily: "'DM Mono',monospace", color: "rgba(180,72,9,.85)" }}>
            🔒 Too many attempts — retry in <strong style={{ marginLeft: "4px" }}>{lockLeft}s</strong>
          </div>
        )}
        {alertErr && !locked && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "11px 14px", borderRadius: "12px", marginBottom: "16px", border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.05)", fontSize: "12px", fontFamily: "'DM Mono',monospace", color: "rgba(185,28,28,.85)" }}>
            {alertErr}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FloatingInput id="em" type="email" label="Email address" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(""); setAlertErr(""); }} error={emailErr} autoComplete="email" accent={role.accent} glow={role.glow} icon={<EmailIcon />} animDelay=".2s" />
          <FloatingInput id="pw" type={showPass ? "text" : "password"} label="Password" value={password} onChange={e => { setPassword(e.target.value); setPassErr(""); setAlertErr(""); }} error={passErr} autoComplete="current-password" accent={role.accent} glow={role.glow} icon={<LockIcon />} animDelay=".28s"
            rightSlot={<button type="button" onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "rgba(26,26,46,.28)" }}><EyeIcon open={showPass} /></button>}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "14px 0 20px", animation: "fadeUp .48s ease .36s both" }}>
            <div onClick={() => setRemember(!remember)} style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer", userSelect: "none" }}>
              <div style={{ width: "17px", height: "17px", borderRadius: "5px", border: `1.5px solid ${remember ? role.accent : "rgba(26,26,46,.18)"}`, background: remember ? role.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>
                {remember && <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span style={{ fontSize: "13px", color: "rgba(26,26,46,.48)" }}>Remember me</span>
            </div>
            <button type="button" onClick={() => navigate("/forgot-password")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Figtree',sans-serif", fontSize: "13px", color: "rgba(26,26,46,.38)", fontWeight: 600, padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = role.accent}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(26,26,46,.38)"}
            >Forgot password?</button>
          </div>

          <button type="submit" disabled={locked || loading}
            style={{ width: "100%", height: "52px", borderRadius: "14px", border: "none", cursor: locked || loading ? "not-allowed" : "pointer", fontFamily: "'Figtree',sans-serif", fontSize: "14.5px", fontWeight: 700, background: `linear-gradient(135deg,${role.btnFrom},${role.btnTo})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", boxShadow: `0 6px 24px ${role.glow}`, opacity: locked ? 0.35 : 1, transition: "all .22s", animation: "fadeUp .48s ease .42s both" }}>
            {loading
              ? <><div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} /><span>Sending OTP…</span></>
              : locked ? <span>Locked — {lockLeft}s</span>
              : <><span>Send Verification Code</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg></>
            }
          </button>
        </form>

        {attempts > 0 && !locked && (
          <div style={{ marginTop: "11px" }}>
            <div style={{ display: "flex", gap: "3px" }}>
              {[0,1,2,3,4].map(i => <div key={i} style={{ height: "2.5px", flex: 1, borderRadius: "99px", background: i < attempts ? "rgba(220,38,38,.4)" : "rgba(26,26,46,.08)", transition: "background .3s" }} />)}
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(220,38,38,.45)", textAlign: "right", marginTop: "4px", letterSpacing: ".1em", textTransform: "uppercase" }}>{attempts} of 5 — {5 - attempts} remaining</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.25)", letterSpacing: ".1em", textTransform: "uppercase", animation: "fadeUp .5s ease .52s both" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(22,163,74,.55)", boxShadow: "0 0 6px rgba(22,163,74,.35)" }} />
        TLS 1.3 encrypted · Smart Inventory
      </div>
    </div>
  );

  /* ── SCREEN: OTP Verify ──────────────────────────────────── */
  return (
    <div style={{ opacity: transitioning ? 0 : 1, transition: "opacity .28s", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "420px", padding: "0 20px" }}>
      <StepDots step={2} accent={role.accent} />
      <RoleChip />

      <div style={{ width: "100%", background: "#fff", borderRadius: "24px", border: "1.5px solid rgba(26,26,46,.07)", boxShadow: "0 8px 48px rgba(0,0,0,.08)", padding: "38px 36px 34px", position: "relative", overflow: "hidden", animation: "popIn .55s cubic-bezier(.34,1.24,.64,1) both" }}>
        {/* Left side edge color bar */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: `linear-gradient(180deg,${role.btnFrom},${role.btnTo})`, borderRadius: "24px 0 0 24px" }} />
        {/* Right side edge color bar */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "4px", height: "100%", background: `linear-gradient(180deg,${role.btnFrom},${role.btnTo})`, borderRadius: "0 24px 24px 0" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "5px", background: `linear-gradient(90deg,${role.btnFrom},${role.btnTo})`, borderRadius: "24px 24px 0 0" }} />
        <div style={{ position: "absolute", top: "-40px", left: "50%", transform: "translateX(-50%)", width: "200px", height: "80px", borderRadius: "50%", background: role.glow, filter: "blur(24px)", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px", position: "relative", zIndex: 2, animation: "fadeUp .5s ease .1s both" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${role.glow}`, border: `2px solid ${role.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>
            📬
          </div>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "26px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.025em", marginBottom: "8px" }}>Check your email</h2>
          <p style={{ fontSize: "13.5px", color: "rgba(26,26,46,.45)", lineHeight: 1.6 }}>
            We sent a 6-digit code to<br />
            <strong style={{ color: "#1a1a2e", fontWeight: 700 }}>{email}</strong>
          </p>
        </div>

        {/* OTP input */}
        <OtpInput value={otp} onChange={setOtp} accent={role.accent} glow={role.glow} />

        {/* Error */}
        {otpErr && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.05)", fontSize: "12px", fontFamily: "'DM Mono',monospace", color: "rgba(185,28,28,.9)", animation: "fadeUp .25s ease both" }}>
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {otpErr}
          </div>
        )}

        {/* Verify button */}
        <button onClick={handleVerifyOtp} disabled={otpLoading || otp.length !== 6}
          style={{ width: "100%", height: "52px", borderRadius: "14px", border: "none", cursor: (otpLoading || otp.length !== 6) ? "not-allowed" : "pointer", fontFamily: "'Figtree',sans-serif", fontSize: "14.5px", fontWeight: 700, background: otp.length === 6 ? `linear-gradient(135deg,${role.btnFrom},${role.btnTo})` : "rgba(26,26,46,.07)", color: otp.length === 6 ? "#fff" : "rgba(26,26,46,.28)", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", boxShadow: otp.length === 6 ? `0 6px 24px ${role.glow}` : "none", transition: "all .3s cubic-bezier(.34,1.4,.64,1)", marginBottom: "16px" }}>
          {otpLoading
            ? <><div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} /><span>Verifying…</span></>
            : <><span>Verify & Sign In</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></>
          }
        </button>

        {/* Resend + timer */}
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(26,26,46,.4)" }}>Didn't receive it? </span>
          <button onClick={handleResend} disabled={resendCool > 0 || resending}
            style={{ background: "none", border: "none", cursor: resendCool > 0 ? "default" : "pointer", fontFamily: "'Figtree',sans-serif", fontSize: "13px", fontWeight: 700, color: resendCool > 0 ? "rgba(26,26,46,.25)" : role.accent, padding: 0, transition: "color .2s" }}>
            {resending ? "Sending…" : resendCool > 0 ? `Resend in ${resendCool}s` : "Resend code"}
          </button>
        </div>

        {/* Expiry note */}
        <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.06)", textAlign: "center" }}>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "rgba(26,26,46,.35)", letterSpacing: ".08em" }}>⏱ Code expires in 10 minutes</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.25)", letterSpacing: ".1em", textTransform: "uppercase", animation: "fadeUp .5s ease .3s both" }}>
        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(22,163,74,.55)", boxShadow: "0 0 6px rgba(22,163,74,.35)" }} />
        TLS 1.3 encrypted · Smart Inventory
      </div>
    </div>
  );
}
