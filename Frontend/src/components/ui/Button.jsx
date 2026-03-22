export default function Button({
  children, onClick, type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  accent = "#7c3aed",
  glow = "rgba(124,58,237,.2)",
  icon,
  style: extraStyle = {},
}) {
  const sizes     = { sm: "6px 14px", md: "10px 22px", lg: "13px 32px" };
  const fontSizes = { sm: "11.5px",   md: "13.5px",    lg: "15px"      };
  const radii     = { sm: "8px",      md: "11px",      lg: "14px"      };

  const variants = {
    primary:   { background: `linear-gradient(135deg,${accent},${accent}dd)`, color: "#fff",             border: "none",                                    boxShadow: `0 4px 14px ${glow}` },
    secondary: { background: "#fff",                                           color: "#1a1a2e",           border: "1.5px solid rgba(26,26,46,.14)",           boxShadow: "0 1px 4px rgba(26,26,46,.06)" },
    danger:    { background: "rgba(239,68,68,.08)",                            color: "#dc2626",           border: "1.5px solid rgba(239,68,68,.22)",          boxShadow: "none" },
    ghost:     { background: "transparent",                                    color: accent,              border: `1.5px solid ${glow}`,                     boxShadow: "none" },
    outline:   { background: "transparent",                                    color: "rgba(26,26,46,.6)", border: "1.5px solid rgba(26,26,46,.18)",           boxShadow: "none" },
  };

  const base = variants[variant] || variants.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 7, padding: sizes[size], borderRadius: radii[size],
        cursor: isDisabled ? "not-allowed" : "pointer",
        fontFamily: "'Poppins', sans-serif", fontSize: fontSizes[size],
        fontWeight: 700, letterSpacing: ".01em",
        opacity: isDisabled ? 0.48 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "transform .18s, box-shadow .18s, opacity .18s",
        whiteSpace: "nowrap",
        ...base, ...extraStyle,
      }}
      onMouseEnter={(e) => { if (!isDisabled) { e.currentTarget.style.transform = "translateY(-1.5px)"; e.currentTarget.style.boxShadow = variant === "primary" ? `0 8px 22px ${glow}` : base.boxShadow; } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = base.boxShadow; }}
    >
      {loading ? (
        <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${variant === "primary" ? "rgba(255,255,255,.3)" : "rgba(26,26,46,.2)"}`, borderTopColor: variant === "primary" ? "#fff" : accent, animation: "spin .7s linear infinite", flexShrink: 0 }} />
      ) : icon ? (
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
