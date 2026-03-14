export function PageShell({ title, subtitle, children }) {
  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: "24px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.02em", marginBottom: "4px" }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "13px", color: "rgba(26,26,46,.42)" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "18px",
      border: "1px solid rgba(26,26,46,.08)",
      boxShadow: "0 2px 12px rgba(26,26,46,.06)",
      padding: "24px", ...style,
    }}>
      {children}
    </div>
  );
}

export function PagePlaceholder({ title, subtitle }) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <Card>
        <p style={{ fontSize: "13px", color: "rgba(26,26,46,.4)", lineHeight: 1.7 }}>
          Connect your backend API to populate this page. Service functions are ready in{" "}
          <code style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", color: "rgba(26,26,46,.55)", background: "rgba(26,26,46,.05)", padding: "1px 5px", borderRadius: "4px" }}>src/services/</code>.
        </p>
      </Card>
    </PageShell>
  );
}
