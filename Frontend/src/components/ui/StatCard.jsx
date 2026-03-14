export default function StatCard({ label, value, delta, iconPath, accent, glow, light, border, delay = "0s" }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: "18px",
        border: `1px solid rgba(26,26,46,.08)`,
        boxShadow: "0 2px 12px rgba(26,26,46,.06), 0 1px 3px rgba(26,26,46,.04)",
        padding: "22px 22px 20px",
        transition: "all .22s", cursor: "default",
        animation: `fadeUp .5s ease ${delay} both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = `0 8px 28px ${glow}, 0 2px 8px rgba(26,26,46,.08)`;
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(26,26,46,.08)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,26,46,.06), 0 1px 3px rgba(26,26,46,.04)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</div>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: light, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${glow}` }}>
          <svg viewBox="0 0 24 24" fill={accent} width="16" height="16">
            <path d={iconPath} />
          </svg>
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: "28px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.03em", lineHeight: 1, marginBottom: "6px" }}>{value}</div>
      <div style={{ fontSize: "12px", color: accent, fontWeight: 600 }}>{delta}</div>
    </div>
  );
}
