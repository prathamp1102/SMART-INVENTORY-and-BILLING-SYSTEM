/* Loader — spinner + skeleton variants */

/* Spinner */
export default function Loader({ fullScreen = false, size = 28, color = "#7c3aed", text = "Loading…" }) {
  const spinner = (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `3px solid rgba(26,26,46,.08)`,
      borderTopColor: color,
      animation: "spin .75s linear infinite",
    }} />
  );

  if (fullScreen) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#f5f3ee", gap: 14,
      }}>
        <div style={{ position: "relative" }}>
          {spinner}
          <div style={{
            position: "absolute", inset: -6, borderRadius: "50%",
            border: `2px solid rgba(124,58,237,.08)`,
          }} />
        </div>
        <span style={{
          fontFamily: "'DM Mono',monospace", fontSize: 10,
          color: "rgba(26,26,46,.3)", letterSpacing: ".16em", textTransform: "uppercase",
        }}>
          {text}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 52, gap: 12,
    }}>
      {spinner}
      <span style={{
        fontFamily: "'DM Mono',monospace", fontSize: 11,
        color: "rgba(26,26,46,.3)", letterSpacing: ".1em",
      }}>
        {text}
      </span>
    </div>
  );
}

/* Skeleton shimmer block */
export function Skeleton({ width = "100%", height = 14, radius = 7, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: "linear-gradient(90deg, rgba(26,26,46,.06) 25%, rgba(26,26,46,.1) 50%, rgba(26,26,46,.06) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}

/* Card skeleton */
export function CardSkeleton({ rows = 3 }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1px solid rgba(26,26,46,.07)",
      padding: 22, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <Skeleton height={20} width="55%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={12} width={`${70 + i * 5}%`} />
      ))}
    </div>
  );
}
