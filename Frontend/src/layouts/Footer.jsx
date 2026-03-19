import Logo from "../components/ui/Logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer" style={{ gap: 10 }}>
      <Logo size={16} variant="icon" />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 10, fontWeight: 800, color: "rgba(26,26,46,.3)", letterSpacing: "-.01em" }}>EVARA</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(26,26,46,.2)", letterSpacing: ".1em" }}>·</span>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(22,163,74,.65)", boxShadow: "0 0 6px rgba(22,163,74,.4)", animation: "pulse 2.5s ease-in-out infinite" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(26,26,46,.22)", letterSpacing: ".1em", textTransform: "uppercase" }}>
          Live · TLS 1.3 · © {year}
        </span>
      </div>
    </footer>
  );
}
