export default function Table({ columns, data, loading = false, emptyText = "No records found." }) {
  return (
    <div style={{ borderRadius: "16px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", background: "#fff", boxShadow: "0 2px 12px rgba(26,26,46,.06)" }}>
      {/* Horizontal scroll wrapper for mobile */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
          <thead>
            <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: "12px 16px", textAlign: "left",
                  fontFamily: "'DM Mono', monospace", fontSize: "9.5px",
                  color: "rgba(26,26,46,.35)", letterSpacing: ".14em",
                  textTransform: "uppercase", fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "40px", textAlign: "center", color: "rgba(26,26,46,.3)", fontSize: "13px" }}>
                  Loading…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "40px", textAlign: "center", color: "rgba(26,26,46,.3)", fontSize: "13px" }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row._id ?? i}
                  style={{ borderBottom: "1px solid rgba(26,26,46,.05)", transition: "background .15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "12px 16px", fontSize: "13px", color: "rgba(26,26,46,.7)", verticalAlign: "middle" }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
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
