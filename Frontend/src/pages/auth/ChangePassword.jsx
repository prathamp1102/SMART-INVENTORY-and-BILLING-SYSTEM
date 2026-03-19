import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePasswordSendOtpApi, changePasswordApi } from "../../services/authService";
import { validateStrongPassword, validateConfirmPassword, validateOTP, validateRequired } from "../../utils/validators";

const inputStyle = {
  width: "100%", height: "48px", borderRadius: "12px",
  border: "1.5px solid rgba(26,26,46,.14)", outline: "none",
  padding: "0 14px", fontSize: "14px",
  fontFamily: "'Figtree',sans-serif", color: "#1a1a2e",
  background: "#fff", marginBottom: "12px",
  boxShadow: "0 1px 3px rgba(26,26,46,.05)",
};

const btnPrimary = {
  width: "100%", height: "50px", borderRadius: "12px",
  border: "none", cursor: "pointer",
  fontFamily: "'Figtree',sans-serif", fontSize: "14px", fontWeight: 700,
  background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
  boxShadow: "0 4px 16px rgba(79,70,229,.3)",
};

const ErrorBox = ({ msg }) =>
  msg ? (
    <div style={{ padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", fontSize: "12px", color: "#dc2626", fontFamily: "'DM Mono',monospace" }}>
      {msg}
    </div>
  ) : null;

// ── Step 1: Enter current password & request OTP ─────────────────────────────
function StepRequestOtp({ onOtpSent }) {
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentErr, setCurrentErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    const err = validateRequired(current, "Current password");
    setCurrentErr(err);
    if (err) return;
    setLoading(true);
    try {
      await changePasswordSendOtpApi();
      onOtpSent(current);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ErrorBox msg={error} />
      <p style={{ fontSize: "13px", color: "rgba(26,26,46,.5)", marginBottom: "14px", lineHeight: 1.5 }}>
        Enter your current password to receive an OTP on your registered email.
      </p>
      <input
        type="password" value={current} placeholder="Current password"
        onChange={(e) => { setCurrent(e.target.value); setCurrentErr(""); }}
        style={{ ...inputStyle, borderColor: currentErr ? "rgba(239,68,68,.5)" : undefined, marginBottom: currentErr ? "4px" : undefined }}
      />
      {currentErr && <div style={{color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginBottom:"10px"}}>{currentErr}</div>}
      <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: "8px", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Sending OTP…" : "Send OTP to Email"}
      </button>
    </form>
  );
}

// ── Step 2: Enter OTP + new password ────────────────────────────────────────
function StepSetPassword({ currentPassword, onSuccess }) {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const e = {
      otp:     validateOTP(otp),
      newPw:   validateStrongPassword(newPassword),
      confirm: validateConfirmPassword(newPassword, confirm),
    };
    setFieldErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await changePasswordApi({ currentPassword, otp, newPassword });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to change password.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setResendMsg(""); setError("");
    try {
      await changePasswordSendOtpApi();
      setResendMsg("New OTP sent! Check your inbox.");
    } catch {
      setError("Failed to resend OTP.");
    } finally { setResending(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(79,70,229,.06)", border: "1px solid rgba(79,70,229,.15)", fontSize: "12px", color: "#4f46e5", fontFamily: "'DM Mono',monospace" }}>
        OTP sent to your registered email address.
      </div>
      {resendMsg && <div style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: "10px", background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.2)", fontSize: "12px", color: "#059669", fontFamily: "'DM Mono',monospace" }}>{resendMsg}</div>}
      <ErrorBox msg={error} />
      <input
        type="text" value={otp} maxLength={6} placeholder="6-digit OTP"
        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setFieldErrors(p=>({...p,otp:""})); }}
        style={{ ...inputStyle, letterSpacing: "6px", fontSize: "18px", fontFamily: "'DM Mono',monospace", textAlign: "center", borderColor: fieldErrors?.otp ? "rgba(239,68,68,.5)" : undefined, marginBottom: "4px" }}
      />
      {fieldErrors?.otp && <div style={{color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginBottom:"10px"}}>{fieldErrors.otp}</div>}
      <input type="password" value={newPassword} placeholder="New password (min 8 chars)" onChange={(e) => { setNewPassword(e.target.value); setFieldErrors(p=>({...p,newPw:""})); }} style={{ ...inputStyle, borderColor: fieldErrors?.newPw ? "rgba(239,68,68,.5)" : undefined, marginBottom: "4px" }} />
      {fieldErrors?.newPw && <div style={{color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginBottom:"10px"}}>{fieldErrors.newPw}</div>}
      <input type="password" value={confirm} placeholder="Confirm new password" onChange={(e) => { setConfirm(e.target.value); setFieldErrors(p=>({...p,confirm:""})); }} style={{ ...inputStyle, borderColor: fieldErrors?.confirm ? "rgba(239,68,68,.5)" : undefined, marginBottom: "4px" }} />
      {fieldErrors?.confirm && <div style={{color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginBottom:"20px"}}>{fieldErrors.confirm}</div>}
      <button type="submit" disabled={loading} style={{ ...btnPrimary, marginBottom: "10px", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Updating…" : "Update Password"}
      </button>
      <button type="button" onClick={handleResend} disabled={resending}
        style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1.5px solid rgba(79,70,229,.3)", background: "transparent", color: "#4f46e5", fontFamily: "'Figtree',sans-serif", fontSize: "13px", fontWeight: 600, cursor: resending ? "not-allowed" : "pointer" }}>
        {resending ? "Resending…" : "Resend OTP"}
      </button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChangePassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // "request" | "verify" | "done"
  const [currentPassword, setCurrentPassword] = useState("");

  const titles = {
    request: { h: "Change Password", p: "Verify your identity to proceed." },
    verify: { h: "Verify OTP", p: "Enter the OTP sent to your email and set a new password." },
    done: { h: "Password Updated!", p: "" },
  };

  return (
    <div style={{ width: "100%", maxWidth: "min(400px, 100%)", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", border: "1.5px solid rgba(26,26,46,.08)", boxShadow: "0 8px 48px rgba(26,26,46,.1)", padding: "38px 36px 34px", animation: "popIn .55s cubic-bezier(.34,1.24,.64,1) both" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "24px", fontWeight: 800, color: "#1a1a2e", marginBottom: "8px" }}>{titles[step].h}</h2>
          {titles[step].p && <p style={{ fontSize: "13.5px", color: "rgba(26,26,46,.45)" }}>{titles[step].p}</p>}
        </div>

        {step === "request" && (
          <StepRequestOtp onOtpSent={(pwd) => { setCurrentPassword(pwd); setStep("verify"); }} />
        )}
        {step === "verify" && (
          <StepSetPassword currentPassword={currentPassword} onSuccess={() => setStep("done")} />
        )}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>✅</div>
            <p style={{ fontSize: "14px", color: "#1a1a2e", fontWeight: 600, marginBottom: "20px" }}>Password changed successfully!</p>
            <button onClick={() => navigate("/login")} style={{ ...btnPrimary, width: "auto", padding: "0 28px" }}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
