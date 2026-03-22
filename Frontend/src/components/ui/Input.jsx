import { useState } from "react";

export default function Input({
  id, type = "text", label, value, onChange, error,
  autoComplete, icon, rightSlot,
  accent = "#7c3aed", glow = "rgba(124,58,237,.18)",
  animDelay = "0s",
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || (value != null && String(value).length > 0);

  return (
    <div style={{ position: "relative", marginBottom: "13px", animation: `fadeUp .48s ease ${animDelay} both` }}>
      <div style={{
        position: "relative", display: "flex", alignItems: "center", height: "50px",
        borderRadius: "12px",
        border: `1.5px solid ${error ? "rgba(239,68,68,.5)" : focused ? accent : "rgba(255,255,255,.1)"}`,
        background: focused ? "rgba(255,255,255,.06)" : "rgba(255,255,255,.03)",
        boxShadow: error ? "0 0 0 4px rgba(239,68,68,.07)" : focused ? `0 0 0 4px ${glow}` : "none",
        transition: "all .22s",
      }}>
        {icon && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "46px", flexShrink: 0, color: focused ? accent : "rgba(255,255,255,.28)", transition: "color .22s" }}>
            {icon}
          </div>
        )}
        <input
          id={id} type={type} value={value} onChange={onChange}
          autoComplete={autoComplete} placeholder=" "
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, height: "100%", background: "transparent",
            border: "none", outline: "none",
            color: "#fff", fontSize: "14px",
            fontFamily: "'Poppins', sans-serif", fontWeight: 400,
            paddingTop: lifted ? "14px" : "0",
            paddingLeft: icon ? "0" : "14px",
            transition: "padding-top .16s",
          }}
        />
        <label htmlFor={id} style={{
          position: "absolute",
          left: icon ? "46px" : "14px",
          pointerEvents: "none",
          fontFamily: lifted ? "'DM Mono', monospace" : "'Poppins', sans-serif",
          fontWeight: lifted ? 400 : 500,
          fontSize: lifted ? "9px" : "13.5px",
          color: lifted ? (error ? "rgba(248,113,113,.8)" : accent) : "rgba(255,255,255,.35)",
          top: lifted ? "8px" : "50%",
          transform: lifted ? "none" : "translateY(-50%)",
          letterSpacing: lifted ? ".12em" : "normal",
          textTransform: lifted ? "uppercase" : "none",
          transition: "all .16s ease",
        }}>
          {label}
        </label>
        {rightSlot && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "46px", flexShrink: 0 }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "5px", paddingLeft: icon ? "46px" : "14px", color: "rgba(248,113,113,.85)", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>
          <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
