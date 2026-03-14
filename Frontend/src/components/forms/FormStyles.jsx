import { useState } from "react";

/* ── Light-theme input style constant (export for inline use) ── */
export const IS = {
  width: "100%",
  height: "46px",
  borderRadius: "10px",
  border: "1.5px solid rgba(26,26,46,.14)",
  outline: "none",
  padding: "0 14px",
  fontSize: "14px",
  fontFamily: "'Figtree', sans-serif",
  color: "#1a1a2e",
  background: "#fff",
  marginBottom: "12px",
  boxShadow: "0 1px 3px rgba(26,26,46,.05)",
  transition: "border-color .18s, box-shadow .18s",
};

/* ── Textarea variant ───────────────────────────────────────── */
export const TS = {
  ...IS,
  height: "80px",
  padding: "10px 14px",
  resize: "vertical",
};

/* ── Select variant ─────────────────────────────────────────── */
export const SS = {
  ...IS,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231a1a2e' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "32px",
};

/* ── Label helper ───────────────────────────────────────────── */
export function FieldLabel({ children }) {
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
    }}>
      {children}
    </label>
  );
}

/* ── FormField: label + focused input with accent border ─────── */
export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      {children}
    </div>
  );
}

/* ── Error alert ─────────────────────────────────────────────── */
export function FormError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "8px",
      padding: "10px 14px", borderRadius: "10px", marginBottom: "14px",
      background: "rgba(239,68,68,.06)",
      border: "1px solid rgba(239,68,68,.2)",
      fontSize: "12px", color: "#dc2626",
      fontFamily: "'DM Mono', monospace",
    }}>
      <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: "1px" }}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </div>
  );
}

/* ── FormSuccess alert ───────────────────────────────────────── */
export function FormSuccess({ message }) {
  if (!message) return null;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: "10px", marginBottom: "14px",
      background: "rgba(5,150,105,.07)",
      border: "1px solid rgba(5,150,105,.2)",
      fontSize: "12px", color: "#059669",
      fontFamily: "'DM Mono', monospace",
    }}>
      ✓ {message}
    </div>
  );
}

/* ── Section divider ─────────────────────────────────────────── */
export function FormDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0 12px" }}>
      <div style={{ flex: 1, height: "1px", background: "rgba(26,26,46,.08)" }} />
      {label && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.3)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</span>}
      <div style={{ flex: 1, height: "1px", background: "rgba(26,26,46,.08)" }} />
    </div>
  );
}
