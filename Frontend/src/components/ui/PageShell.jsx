/* PageShell — consistent page wrapper with title, breadcrumb support */
export function PageShell({ title, subtitle, actions, children }) {
  return (
    <div style={{ animation: "fadeUp .38s ease both" }}>
      {/* Page header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: "clamp(10px,2vw,16px)", marginBottom: "clamp(14px,3vw,24px)", flexWrap: "wrap",
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(18px, 3vw, 26px)",
            fontWeight: 800, color: "#1a1a2e",
            letterSpacing: "-.025em", lineHeight: 1.15, marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: "clamp(11px,2vw,13px)", color: "rgba(26,26,46,.42)", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* Card — white surface */
export function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

/* PagePlaceholder — for unbuilt pages */
export function PagePlaceholder({ title, subtitle }) {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <Card>
        <p style={{ fontSize: 13, color: "rgba(26,26,46,.4)", lineHeight: 1.7 }}>
          Connect your backend API to populate this page. Service functions are ready in{" "}
          <code style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(26,26,46,.55)", background: "rgba(26,26,46,.05)", padding: "1px 5px", borderRadius: 4 }}>
            src/services/
          </code>.
        </p>
      </Card>
    </PageShell>
  );
}
