import useAuth from "../../hooks/useAuth";

/**
 * Shows a branch-scope badge for ADMIN users, indicating they only see
 * data from their assigned branch. Invisible for SUPER_ADMIN.
 */
export default function BranchScopeBanner({ branchName, orgName }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") return null;
  if (!branchName && !orgName) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 14px",
      borderRadius: 12,
      background: "rgba(2,132,199,.06)",
      border: "1px solid rgba(2,132,199,.18)",
      marginBottom: 16,
      animation: "fadeUp .3s ease both",
    }}>
      {/* Branch icon */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: "rgba(2,132,199,.12)",
        border: "1px solid rgba(2,132,199,.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#0284c7" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "8.5px", color: "#0284c7", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 2 }}>
          Branch Scope Active
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {orgName && <span style={{ color: "rgba(26,26,46,.45)" }}>{orgName} · </span>}
          {branchName}
        </div>
      </div>

      <div style={{
        fontSize: 10, fontWeight: 700, color: "#0284c7",
        background: "rgba(2,132,199,.1)",
        border: "1px solid rgba(2,132,199,.2)",
        borderRadius: 99, padding: "2px 9px",
        fontFamily: "'DM Mono',monospace",
        whiteSpace: "nowrap",
      }}>
        Your branch only
      </div>
    </div>
  );
}
