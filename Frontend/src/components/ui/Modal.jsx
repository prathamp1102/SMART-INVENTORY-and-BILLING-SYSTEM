import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, width = "520px", accent }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) {
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(26,26,46,.55)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "fadeIn .18s ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: width,
          background: "#fff",
          borderRadius: 20,
          border: "1px solid rgba(26,26,46,.09)",
          boxShadow: "0 24px 64px rgba(26,26,46,.18), 0 4px 16px rgba(26,26,46,.08)",
          overflow: "hidden",
          animation: "popIn .28s cubic-bezier(.34,1.24,.64,1) both",
          maxHeight: "calc(100vh - 32px)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 16px",
          borderBottom: "1px solid rgba(26,26,46,.07)",
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 800,
            color: "#1a1a2e", letterSpacing: "-.02em",
          }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: "1px solid rgba(26,26,46,.1)",
              background: "rgba(26,26,46,.04)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(26,26,46,.45)",
              transition: "all .15s",
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,.08)"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "rgba(239,68,68,.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(26,26,46,.04)"; e.currentTarget.style.color = "rgba(26,26,46,.45)"; e.currentTarget.style.borderColor = "rgba(26,26,46,.1)"; }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body — scrollable */}
        <div style={{ padding: "22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
