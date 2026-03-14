export default function Button({
  children, onClick, type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  accent = "#7c3aed",
  glow = "rgba(124,58,237,.2)",
  style: extraStyle = {},
}) {
  const sizes    = { sm: "7px 14px", md: "10px 22px", lg: "13px 32px" };
  const fontSizes = { sm: "12px", md: "13.5px", lg: "15px" };

  const variants = {
    primary:   { background: accent, color: "#fff", border: "none", boxShadow: `0 4px 16px ${glow}` },
    secondary: { background: "#fff", color: "#1a1a2e", border: "1.5px solid rgba(26,26,46,.14)", boxShadow: "0 1px 4px rgba(26,26,46,.06)" },
    danger:    { background: "rgba(239,68,68,.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,.2)", boxShadow: "none" },
    ghost:     { background: "transparent", color: accent, border: "none", boxShadow: "none" },
  };

  const base = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: "7px", padding: sizes[size], borderRadius: "10px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        fontFamily: "'Figtree', sans-serif", fontSize: fontSizes[size],
        fontWeight: 700, letterSpacing: ".01em",
        opacity: disabled || loading ? 0.45 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "transform .2s, box-shadow .2s, opacity .2s",
        ...base, ...extraStyle,
      }}
      onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
    >
      {loading && (
        <div style={{ width: "13px", height: "13px", borderRadius: "50%", border: `2px solid ${variant === "primary" ? "rgba(255,255,255,.35)" : "rgba(26,26,46,.2)"}`, borderTopColor: variant === "primary" ? "#fff" : accent, animation: "spin .7s linear infinite", flexShrink: 0 }} />
      )}
      {children}
    </button>
  );
}
