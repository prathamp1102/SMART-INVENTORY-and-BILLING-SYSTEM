export default function Footer() {
  return (
    <footer style={{
      height: "40px", flexShrink: 0,
      borderTop: "1px solid rgba(26,26,46,.07)",
      background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "8px",
    }}>
      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(22,163,74,.6)", boxShadow: "0 0 6px rgba(22,163,74,.4)" }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "rgba(26,26,46,.25)", letterSpacing: ".12em", textTransform: "uppercase" }}>
        TLS 1.3 encrypted · EVARA v1.0
      </span>
    </footer>
  );
}
