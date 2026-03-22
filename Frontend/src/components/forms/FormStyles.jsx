/* ═══════════════════════════════════════════════════
   EVARA Form Design System
   Consistent inputs, labels, errors, dividers
═══════════════════════════════════════════════════ */

/* ── Base input style ─────────────────────────────── */
export const IS = {
  width: "100%",
  height: "46px",
  borderRadius: "11px",
  border: "1.5px solid rgba(26,26,46,.13)",
  outline: "none",
  padding: "0 14px",
  fontSize: "14px",
  fontFamily: "'Poppins', sans-serif",
  color: "#1a1a2e",
  background: "#fff",
  marginBottom: "12px",
  boxShadow: "0 1px 3px rgba(26,26,46,.04)",
  transition: "border-color .18s, box-shadow .18s",
  WebkitAppearance: "none",
};

/* ── Textarea variant ─────────────────────────────── */
export const TS = {
  ...IS,
  height: "90px",
  padding: "11px 14px",
  resize: "vertical",
  lineHeight: 1.55,
};

/* ── Select variant ───────────────────────────────── */
export const SS = {
  ...IS,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231a1a2e' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 13px center",
  paddingRight: "36px",
};

/* ── Field label ──────────────────────────────────── */
export function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "'DM Mono', monospace",
      fontSize: "9px",
      color: "rgba(26,26,46,.4)",
      letterSpacing: ".16em",
      textTransform: "uppercase",
      marginBottom: "6px",
      marginTop: "2px",
      userSelect: "none",
    }}>
      {children}
      {required && <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>}
    </label>
  );
}

/* ── FormField wrapper ────────────────────────────── */
export function FormField({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: 4 }}>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {hint && (
        <div style={{ fontSize: 11, color: "rgba(26,26,46,.35)", fontFamily: "'DM Mono',monospace", marginTop: -8, marginBottom: 10 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

/* ── Inline field error ───────────────────────────── */
export function FieldError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      color: "#dc2626", fontSize: "11px",
      fontFamily: "'DM Mono', monospace",
      marginTop: "-8px", marginBottom: "10px",
    }}>
      <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

/* ── Top-level API error banner ───────────────────── */
export function FormError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "11px 14px", borderRadius: "11px", marginBottom: "16px",
      background: "rgba(239,68,68,.06)",
      border: "1.5px solid rgba(239,68,68,.2)",
      fontSize: "12.5px", color: "#dc2626",
      fontFamily: "'DM Mono', monospace",
      animation: "fadeDown .2s ease both",
    }}>
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 1 }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

/* ── Success banner ───────────────────────────────── */
export function FormSuccess({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "11px 14px", borderRadius: "11px", marginBottom: "16px",
      background: "rgba(5,150,105,.06)",
      border: "1.5px solid rgba(5,150,105,.2)",
      fontSize: "12.5px", color: "#059669",
      fontFamily: "'DM Mono', monospace",
      animation: "fadeDown .2s ease both",
    }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

/* ── Section divider ──────────────────────────────── */
export function FormDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 13px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(26,26,46,.07)" }} />
      {label && (
        <span style={{
          fontFamily: "'DM Mono',monospace", fontSize: 8.5,
          color: "rgba(26,26,46,.32)", letterSpacing: ".16em",
          textTransform: "uppercase", whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "rgba(26,26,46,.07)" }} />
    </div>
  );
}
