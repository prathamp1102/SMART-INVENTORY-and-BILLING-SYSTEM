/**
 * OrgBranchCell
 * Shows Org + Branch origin of a record.
 * If branch is null/unassigned, shows a red "Unassigned" badge.
 * Pass onAssign callback to show a quick-assign button.
 */
export default function OrgBranchCell({ branch, onAssign }) {
  const orgName    = branch?.organization?.name;
  const branchName = branch?.branchName;

  // ── Unassigned state ──────────────────────────────────────────
  if (!orgName && !branchName) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
          fontFamily: "'DM Mono',monospace", letterSpacing: ".05em",
          background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#dc2626",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} />
          Unassigned
        </span>
        {onAssign && (
          <button onClick={onAssign} style={{
            padding: "3px 10px", borderRadius: 8, border: "1px solid rgba(2,132,199,.3)",
            background: "rgba(2,132,199,.07)", color: "#0284c7", fontSize: 10, fontWeight: 700,
            cursor: "pointer", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap",
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(2,132,199,.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(2,132,199,.07)"; }}>
            + Assign
          </button>
        )}
      </div>
    );
  }

  // ── Assigned state ────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 160 }}>

      {/* Organization */}
      {orgName && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.1 }}>Org</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1a1a2e", lineHeight: 1.2 }}>{orgName}</div>
          </div>
        </div>
      )}

      {/* Branch */}
      {branchName && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.1 }}>Branch</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(26,26,46,.7)", lineHeight: 1.2 }}>{branchName}</div>
          </div>
        </div>
      )}
    </div>
  );
}
