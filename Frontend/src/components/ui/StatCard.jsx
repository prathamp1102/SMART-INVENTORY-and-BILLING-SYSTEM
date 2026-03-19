export default function StatCard({
  label, value, delta, iconPath, accent, glow, light, border,
  delay = "0s", onClick, badge,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 18,
        border: `1.5px solid rgba(26,26,46,.07)`,
        boxShadow: "0 2px 10px rgba(26,26,46,.05)",
        padding: "20px",
        transition: "all .22s cubic-bezier(.34,1.2,.64,1)",
        cursor: onClick ? "pointer" : "default",
        animation: `fadeUp .45s ease ${delay} both`,
        position: "relative", overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = `0 10px 32px ${glow}, 0 2px 8px rgba(26,26,46,.06)`;
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(26,26,46,.07)";
        e.currentTarget.style.boxShadow = "0 2px 10px rgba(26,26,46,.05)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Subtle glow blob */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: light, filter: "blur(20px)", pointerEvents: "none", opacity: 0.7 }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(26,26,46,.36)", letterSpacing: ".16em", textTransform: "uppercase", lineHeight: 1.4 }}>
          {label}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: light, border: `1.5px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 3px 10px ${glow}`, flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill={accent} width="16" height="16">
            <path d={iconPath} />
          </svg>
        </div>
      </div>

      <div style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "clamp(22px, 3vw, 30px)",
        fontWeight: 900, color: "#1a1a2e",
        letterSpacing: "-.03em", lineHeight: 1,
        marginBottom: 6, position: "relative",
      }}>
        {value}
      </div>

      {delta && (
        <div style={{ fontSize: 12, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          {delta}
        </div>
      )}

      {badge && (
        <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 99, background: light, border: `1px solid ${border}`, fontSize: 10, color: accent, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
          {badge}
        </div>
      )}
    </div>
  );
}
