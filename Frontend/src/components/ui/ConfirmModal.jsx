/**
 * ConfirmModal — reusable professional confirmation dialog.
 *
 * Props:
 *  title        string   — modal heading
 *  message      string   — body text
 *  itemName     string?  — highlighted item name chip (optional)
 *  itemIcon     string?  — SVG path for chip icon (optional)
 *  confirmLabel string?  — confirm button label (default "Confirm")
 *  variant      string?  — "danger" | "warning" | "info"  (default "danger")
 *  loading      bool?    — shows spinner on confirm button
 *  error        string?  — inline error message
 *  onConfirm    fn
 *  onCancel     fn
 */
export default function ConfirmModal({
  title = "Are you sure?",
  message,
  itemName,
  itemIcon,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  error,
  onConfirm,
  onCancel,
}) {
  const VARIANTS = {
    danger: {
      strip:     "linear-gradient(90deg,#dc2626,#ef4444,#f87171)",
      iconBg:    "rgba(239,68,68,.1)",
      iconBorder:"rgba(239,68,68,.2)",
      iconColor: "#dc2626",
      chipBg:    "rgba(239,68,68,.07)",
      chipBorder:"rgba(239,68,68,.18)",
      chipColor: "#dc2626",
      btnBg:     "linear-gradient(135deg,#dc2626,#b91c1c)",
      btnBgDis:  "rgba(220,38,38,.45)",
      btnShadow: "0 4px 18px rgba(220,38,38,.35)",
      strongColor:"#dc2626",
      svgStroke: "#dc2626",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      ),
    },
    warning: {
      strip:     "linear-gradient(90deg,#b45309,#d97706,#fbbf24)",
      iconBg:    "rgba(180,83,9,.08)",
      iconBorder:"rgba(180,83,9,.2)",
      iconColor: "#b45309",
      chipBg:    "rgba(180,83,9,.07)",
      chipBorder:"rgba(180,83,9,.18)",
      chipColor: "#b45309",
      btnBg:     "linear-gradient(135deg,#b45309,#92400e)",
      btnBgDis:  "rgba(180,83,9,.45)",
      btnShadow: "0 4px 18px rgba(180,83,9,.3)",
      strongColor:"#b45309",
      svgStroke: "#b45309",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      ),
    },
    info: {
      strip:     "linear-gradient(90deg,#0284c7,#38bdf8,#7dd3fc)",
      iconBg:    "rgba(2,132,199,.08)",
      iconBorder:"rgba(2,132,199,.2)",
      iconColor: "#0284c7",
      chipBg:    "rgba(2,132,199,.07)",
      chipBorder:"rgba(2,132,199,.18)",
      chipColor: "#0284c7",
      btnBg:     "linear-gradient(135deg,#0284c7,#0369a1)",
      btnBgDis:  "rgba(2,132,199,.45)",
      btnShadow: "0 4px 18px rgba(2,132,199,.3)",
      strongColor:"#0284c7",
      svgStroke: "#0284c7",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4m0-4h.01"/>
        </svg>
      ),
    },
  };

  const v = VARIANTS[variant] || VARIANTS.danger;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(10,10,26,.55)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          animation: "cmFadeIn .18s ease",
        }}
      />

      {/* Card */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 1001,
        width: "min(430px, calc(100vw - 32px))",
        background: "#fff",
        borderRadius: "22px",
        boxShadow: "0 24px 80px rgba(10,10,26,.2), 0 4px 24px rgba(0,0,0,.06)",
        overflow: "hidden",
        animation: "cmPopIn .22s cubic-bezier(.34,1.4,.64,1)",
      }}>
        {/* Colour strip */}
        <div style={{ height: "5px", background: v.strip }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Icon badge */}
          <div style={{
            width: 56, height: 56, borderRadius: "16px",
            background: v.iconBg, border: `1.5px solid ${v.iconBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "18px",
            color: v.iconColor,
          }}>
            {v.icon}
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Poppins',sans-serif", fontSize: "18px",
            fontWeight: 700, color: "#1a1a2e", marginBottom: "8px",
            letterSpacing: "-.02em",
          }}>
            {title}
          </div>

          {/* Message */}
          {message && (
            <div style={{
              fontSize: "13.5px", color: "rgba(26,26,46,.55)",
              lineHeight: 1.65, marginBottom: itemName ? "10px" : "0",
            }}>
              {message}
            </div>
          )}

          {/* Item name chip */}
          {itemName && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "6px 13px", borderRadius: "10px",
              background: v.chipBg, border: `1px solid ${v.chipBorder}`,
              marginBottom: "14px", marginTop: message ? "4px" : "0",
            }}>
              {itemIcon && (
                <svg viewBox="0 0 24 24" fill="none" stroke={v.chipColor}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  width="13" height="13">
                  <path d={itemIcon}/>
                </svg>
              )}
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: "13px",
                fontWeight: 700, color: v.chipColor,
              }}>{itemName}</span>
            </div>
          )}

          {/* Warning note */}
          {variant === "danger" && (
            <div style={{ fontSize: "13px", color: "rgba(26,26,46,.42)", lineHeight: 1.55 }}>
              This action <strong style={{ color: v.strongColor }}>cannot be undone</strong>.
            </div>
          )}

          {/* Inline error */}
          {error && (
            <div style={{
              marginTop: "14px", padding: "10px 14px", borderRadius: "10px",
              background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)",
              color: "#dc2626", fontSize: "12.5px",
              display: "flex", gap: "7px", alignItems: "flex-start",
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ flexShrink: 0, marginTop: "1px" }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: "1.5px solid rgba(26,26,46,.14)", background: "#fff",
                color: "rgba(26,26,46,.6)", fontSize: "13.5px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Poppins',sans-serif", transition: "all .15s",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(26,26,46,.04)"; e.currentTarget.style.borderColor = "rgba(26,26,46,.22)"; }}}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(26,26,46,.14)"; }}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                background: loading ? v.btnBgDis : v.btnBg,
                color: "#fff", fontSize: "13.5px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Poppins',sans-serif",
                boxShadow: loading ? "none" : v.btnShadow,
                transition: "all .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: "cmSpin .7s linear infinite" }}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" width="14" height="14">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Processing…
                </>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cmPopIn  { from { opacity:0; transform:translate(-50%,-50%) scale(.9) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes cmSpin   { to { transform:rotate(360deg) } }
      `}</style>
    </>
  );
}
