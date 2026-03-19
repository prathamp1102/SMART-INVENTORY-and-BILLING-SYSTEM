/* Table — responsive, scrollable, with loading & empty states */
export default function Table({
  columns, data,
  loading = false,
  emptyIcon = "📭",
  emptyText = "No records found.",
  emptySubtext = "",
  minWidth = 520,
  onRowClick,
  rowKey = "_id",
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 18, border: "1px solid rgba(26,26,46,.08)",
      boxShadow: "0 2px 12px rgba(26,26,46,.05)",
      overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth }}>
          <thead>
            <tr style={{ background: "rgba(26,26,46,.025)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: "11px 16px",
                  textAlign: col.align || "left",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 9.5, color: "rgba(26,26,46,.38)",
                  letterSpacing: ".14em", textTransform: "uppercase",
                  fontWeight: 500, whiteSpace: "nowrap",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(26,26,46,.04)" }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "13px 16px" }}>
                      <div style={{
                        height: 12, borderRadius: 6,
                        width: `${55 + Math.random() * 35}%`,
                        background: "linear-gradient(90deg, rgba(26,26,46,.06) 25%, rgba(26,26,46,.1) 50%, rgba(26,26,46,.06) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s ease-in-out infinite",
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "52px 20px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 32 }}>{emptyIcon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(26,26,46,.4)" }}>{emptyText}</span>
                    {emptySubtext && <span style={{ fontSize: 12, color: "rgba(26,26,46,.28)" }}>{emptySubtext}</span>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row[rowKey] ?? i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    borderBottom: "1px solid rgba(26,26,46,.042)",
                    transition: "background .12s",
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(26,26,46,.018)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: "12px 16px",
                      fontSize: 13, color: "rgba(26,26,46,.72)",
                      verticalAlign: "middle",
                      textAlign: col.align || "left",
                    }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
