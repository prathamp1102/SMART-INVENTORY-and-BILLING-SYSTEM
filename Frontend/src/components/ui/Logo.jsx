/**
 * EVARA Logo Component
 * Renders the brand mark (SVG icon) + "EVARA" wordmark side by side.
 * Props:
 *   size    — icon size in px (default 32)
 *   variant — "full" (icon + text) | "icon" (icon only) | "text" (text only)
 *   light   — if true, renders white text (for dark backgrounds)
 *   accent  — gradient color for the icon background (default brand purple→green)
 */
export default function Logo({ size = 32, variant = "full", light = false, style = {} }) {
  const textColor = light ? "#fff" : "#1a1a2e";
  const subColor  = light ? "rgba(255,255,255,.55)" : "rgba(26,26,46,.32)";

  const Icon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ flexShrink: 0, display: "block" }}
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="#1a1a2e"/>
      {/* Green accent top-right dot */}
      <circle cx="25" cy="7" r="3" fill="#059669"/>
      {/* Bold geometric E mark in white */}
      <rect x="8"  y="8"    width="4" height="16"  rx="1" fill="#ffffff"/>
      <rect x="12" y="8"    width="9" height="3.5"  rx="1" fill="#ffffff"/>
      <rect x="12" y="14.25" width="7" height="3.5"  rx="1" fill="#ffffff"/>
      <rect x="12" y="20.5" width="9" height="3.5"  rx="1" fill="#ffffff"/>
    </svg>
  );

  if (variant === "icon") return <Icon />;

  if (variant === "text") {
    return (
      <div style={{ display: "flex", flexDirection: "column", ...style }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: textColor, fontFamily: "'Fraunces', serif", letterSpacing: "-.01em", lineHeight: 1 }}>EVARA</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: subColor, letterSpacing: ".2em", textTransform: "uppercase", marginTop: 2 }}>Smart Inventory</span>
      </div>
    );
  }

  // "full" — icon + text
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, ...style }}>
      <Icon />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: textColor, fontFamily: "'Fraunces', serif", letterSpacing: "-.01em", lineHeight: 1.1 }}>EVARA</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: subColor, letterSpacing: ".2em", textTransform: "uppercase", marginTop: 2 }}>Smart Inventory</span>
      </div>
    </div>
  );
}
