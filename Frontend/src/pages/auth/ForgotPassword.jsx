import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { forgotPasswordSendOtpApi, forgotPasswordResetApi } from "../../services/authService";
import { validateEmail, validateOTP, validateStrongPassword, validateConfirmPassword } from "../../utils/validators";

const inputStyle = {
  width: "100%", height: "50px", borderRadius: "12px",
  border: "1.5px solid rgba(26,26,46,.14)", outline: "none",
  padding: "0 14px", fontSize: "14px",
  fontFamily: "'Poppins',sans-serif", color: "#1a1a2e",
  background: "#fff", marginBottom: "12px",
  boxShadow: "0 1px 3px rgba(26,26,46,.05)",
};

const btnStyle = {
  width: "100%", height: "50px", borderRadius: "12px",
  border: "none", cursor: "pointer",
  fontFamily: "'Poppins',sans-serif", fontSize: "14px", fontWeight: 700,
  background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
  marginTop: "4px", boxShadow: "0 4px 16px rgba(79,70,229,.3)",
};

const ErrorBox = ({ msg }) =>
  msg ? (
    <div style={{ padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.2)", fontSize: "12px", color: "#dc2626", fontFamily: "'DM Mono',monospace" }}>
      {msg}
    </div>
  ) : null;

// ── Step 1: Enter email ──────────────────────────────────────────────────────
function StepEmail({ onOtpSent }) {
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailErr(err);
    if (err) return;
    setLoading(true); setError("");
    try {
      await forgotPasswordSendOtpApi(email.trim());
      onOtpSent(email.trim());
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ErrorBox msg={error} />
      <input
        type="email" value={email} placeholder="Email address"
        onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
        style={{ ...inputStyle, border: `1.5px solid ${emailErr ? "rgba(239,68,68,.4)" : "rgba(26,26,46,.14)"}`, marginBottom: "6px" }}
      />
      {emailErr && <div style={{ marginBottom: "10px", color: "#dc2626", fontSize: "11px", fontFamily: "'DM Mono',monospace" }}>{emailErr}</div>}
      <button type="submit" disabled={loading} style={{ ...btnStyle, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Sending OTP…" : "Send OTP"}
      </button>
    </form>
  );
}

// ── Step 2: Enter OTP + new password ────────────────────────────────────────
function StepReset({ email, onSuccess }) {
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
      otp:      validateOTP(otp),
      newPw:    validateStrongPassword(newPassword),
      confirm:  validateConfirmPassword(newPassword, confirm),
    };
    setFieldErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPasswordResetApi({ email, otp, newPassword });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP or error. Try again.");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setResendMsg(""); setError("");
    try {
      await forgotPasswordSendOtpApi(email);
      setResendMsg("New OTP sent! Check your inbox.");
    } catch {
      setError("Failed to resend OTP.");
    } finally { setResending(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "10px", background: "rgba(79,70,229,.06)", border: "1px solid rgba(79,70,229,.15)", fontSize: "12px", color: "#4f46e5", fontFamily: "'DM Mono',monospace" }}>
        OTP sent to <strong>{email}</strong>
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
      <button type="submit" disabled={loading} style={{ ...btnStyle, cursor: loading ? "not-allowed" : "pointer", marginBottom: "10px" }}>
        {loading ? "Resetting…" : "Reset Password"}
      </button>
      <button type="button" onClick={handleResend} disabled={resending}
        style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1.5px solid rgba(79,70,229,.3)", background: "transparent", color: "#4f46e5", fontFamily: "'Poppins',sans-serif", fontSize: "13px", fontWeight: 600, cursor: resending ? "not-allowed" : "pointer" }}>
        {resending ? "Resending…" : "Resend OTP"}
      </button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "reset" | "done"
  const [email, setEmail] = useState("");

  const titles = {
    email: { h: "Forgot Password", p: "Enter your email and we'll send you an OTP." },
    reset: { h: "Enter OTP", p: "Check your inbox and set your new password." },
    done: { h: "Password Reset!", p: "" },
  };

  return (
    <div style={{ width: "100%", maxWidth: "min(400px, 100%)", padding: "0 20px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", border: "1.5px solid rgba(26,26,46,.08)", boxShadow: "0 8px 48px rgba(26,26,46,.1)", padding: "38px 36px 34px", animation: "popIn .55s cubic-bezier(.34,1.24,.64,1) both" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "24px", fontWeight: 800, color: "#1a1a2e", marginBottom: "8px" }}>{titles[step].h}</h2>
          {titles[step].p && <p style={{ fontSize: "13.5px", color: "rgba(26,26,46,.45)" }}>{titles[step].p}</p>}
        </div>

        {step === "email" && (
          <StepEmail onOtpSent={(e) => { setEmail(e); setStep("reset"); }} />
        )}
        {step === "reset" && (
          <StepReset email={email} onSuccess={() => setStep("done")} />
        )}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px" }}>✅</div>
            <p style={{ fontSize: "14px", color: "#1a1a2e", fontWeight: 600, marginBottom: "6px" }}>Password reset successfully!</p>
            <p style={{ fontSize: "13px", color: "rgba(26,26,46,.45)", marginBottom: "24px" }}>You can now log in with your new password.</p>
            <button onClick={() => navigate("/login")} style={{ ...btnStyle, width: "auto", padding: "0 28px" }}>
              Go to Login
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link to="/login" style={{ fontSize: "13px", color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
