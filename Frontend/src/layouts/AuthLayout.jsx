import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { ROLE_CONFIG } from "../utils/constants";

// ── Inject fonts & keyframes once ────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,700&family=Figtree:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(20px,-18px) scale(1.04);} 66%{transform:translate(-14px,12px) scale(.97);} }
  @keyframes fadeDown  { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn     { from{opacity:0;transform:scale(.88) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes checkPop  { 0%{transform:scale(0)} 70%{transform:scale(1.18)} 100%{transform:scale(1)} }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Figtree',sans-serif; background:#f5f3ee; -webkit-font-smoothing:antialiased; }
  input::placeholder { color:transparent; }
`;
document.head.appendChild(styleTag);

/**
 * AuthLayout
 * Provides the blob background, dot grid and logo.
 * It also manages the selectedRole state so Login can render role cards.
 * The selectedRole + setter are passed via React context to child pages
 * using Outlet context.
 */
export default function AuthLayout() {
  const { isAuthenticated, homePath } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  if (isAuthenticated) return <Navigate to={homePath} replace />;

  const role = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <div style={{
      position: "relative", width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", overflow: "hidden", background: "#f5f3ee",
    }}>
      {/* ── Animated blobs ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", animation: "blobFloat 12s ease-in-out infinite", width: "500px", height: "500px", top: "-120px", left: "-100px", background: role?.blob1 || "rgba(79,70,229,.12)", transition: "background .8s ease" }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", animation: "blobFloat 12s ease-in-out infinite", animationDelay: "-6s", width: "380px", height: "380px", bottom: "-80px", right: "-60px", background: role?.blob2 || "rgba(99,102,241,.07)", transition: "background .8s ease" }} />
        <div style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", animation: "blobFloat 12s ease-in-out infinite", animationDelay: "-3s", width: "260px", height: "260px", top: "40%", left: "55%", background: "rgba(0,0,0,.03)" }} />
      </div>

      {/* ── Dot grid ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(0,0,0,.06) 1px, transparent 1px)", backgroundSize: "28px 28px", WebkitMaskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black, transparent)", maskImage: "radial-gradient(ellipse 85% 85% at 50% 50%, black, transparent)" }} />

      {/* ── Logo ── */}
      <div style={{ position: "absolute", top: "28px", left: "50%", transform: "translateX(-50%)", zIndex: 30, display: "flex", alignItems: "center", gap: "12px", animation: "fadeDown .5s ease .1s both" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#1a1a2e,#2d2d44)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3M9 11.25v1.5M12 9v3.75m3-6.75v6.75" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e" }}>EVARA</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8.5px", color: "rgba(26,26,46,.38)", letterSpacing: ".18em", textTransform: "uppercase", marginTop: "2px" }}>Access Portal</div>
        </div>
      </div>

      {/* ── Page content (Login / ForgotPassword / ChangePassword) ── */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", justifyContent: "center" }}>
        <Outlet context={{ selectedRole, setSelectedRole }} />
      </div>
    </div>
  );
}
