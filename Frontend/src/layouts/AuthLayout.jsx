import { Outlet, Navigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { ROLE_CONFIG } from "../utils/constants";

// ── Inject fonts & keyframes once ────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;0,9..144,900;1,9..144,700&family=Poppins:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap";
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
  body { font-family:'Poppins',sans-serif; background:#f5f3ee; -webkit-font-smoothing:antialiased; }
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

      {/* ── Page content (Login / ForgotPassword / ChangePassword) ── */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", justifyContent: "center", padding: "0 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Brand logo at top of auth pages */}
          <div style={{ marginBottom: 28, animation: "fadeDown .5s ease both" }}>
            <Logo size={36} variant="full" />
          </div>
          <Outlet context={{ selectedRole, setSelectedRole }} />
        </div>
      </div>
    </div>
  );
}
