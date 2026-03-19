import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import useAuth from "../hooks/useAuth";
import { ROLE_CONFIG, ROLE_NAV } from "../utils/constants";
import axiosInstance from "../services/axiosInstance";

const LOW_THRESHOLD = 10;
const POLL_INTERVAL = 60000; // refresh every 60s

/* ─── helpers ───────────────────────────────────────────────────── */
function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)  return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─── NotificationBell ──────────────────────────────────────────── */
function NotificationBell({ role }) {
  const navigate = useNavigate();

  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [readIds, setReadIds]     = useState(new Set());
  const [fetchedAt, setFetchedAt] = useState(null);
  const dropRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/products");
      const all = Array.isArray(res.data) ? res.data : [];
      const alerts = all
        .filter(p => p.stock <= LOW_THRESHOLD)
        .sort((a, b) => a.stock - b.stock)
        .map(p => ({
          id:       p._id,
          name:     p.name,
          stock:    p.stock,
          category: p.category?.name || null,
          isOut:    p.stock === 0,
          urgency:  p.stock === 0 ? "critical" : p.stock <= 3 ? "high" : "medium",
        }));
      setItems(alerts);
      setFetchedAt(Date.now());
    } catch {
      // silent fail — don't disrupt UX
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const unread     = items.filter(i => !readIds.has(i.id));
  const unreadCnt  = unread.length;
  const critCount  = items.filter(i => i.isOut).length;
  const highCount  = items.filter(i => !i.isOut && i.stock <= 3).length;

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const markAllRead = () => {
    setReadIds(new Set(items.map(i => i.id)));
  };

  const handleItemClick = (item) => {
    setReadIds(r => new Set([...r, item.id]));
    setOpen(false);
    navigate(role === "STAFF" ? "/staff/my-reports" : "/reports/low-stock");
  };

  const urgStyle = (u) => {
    if (u === "critical") return { color: "#dc2626", bg: "rgba(239,68,68,.1)",  border: "rgba(239,68,68,.22)", dot: "#dc2626" };
    if (u === "high")     return { color: "#b45309", bg: "rgba(180,83,9,.1)",   border: "rgba(180,83,9,.22)",  dot: "#b45309" };
    return                       { color: "#b45309", bg: "rgba(245,158,11,.1)", border: "rgba(245,158,11,.22)",dot: "#f59e0b" };
  };

  return (
    <div ref={dropRef} style={{ position: "relative", flexShrink: 0 }}>

      {/* ── Bell button ── */}
      <button
        onClick={handleOpen}
        title="Stock Alerts"
        style={{
          position: "relative",
          width: 38, height: 38,
          borderRadius: 10,
          border: open
            ? "1.5px solid rgba(239,68,68,.35)"
            : unreadCnt > 0
              ? "1.5px solid rgba(239,68,68,.22)"
              : "1px solid rgba(26,26,46,.12)",
          background: open
            ? "rgba(239,68,68,.08)"
            : unreadCnt > 0
              ? "rgba(239,68,68,.05)"
              : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all .18s",
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = "rgba(239,68,68,.08)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,.3)";
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = unreadCnt > 0 ? "rgba(239,68,68,.05)" : "transparent";
            e.currentTarget.style.borderColor = unreadCnt > 0 ? "rgba(239,68,68,.22)" : "rgba(26,26,46,.12)";
          }
        }}
      >
        {/* Bell icon — shaking when critical */}
        <svg
          width="17" height="17" fill="none" viewBox="0 0 24 24"
          stroke={unreadCnt > 0 ? "#dc2626" : "rgba(26,26,46,.45)"}
          strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: critCount > 0 && !open ? "bellShake 2.5s ease infinite" : "none" }}
        >
          <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {/* Badge */}
        {unreadCnt > 0 && (
          <span style={{
            position: "absolute", top: -5, right: -5,
            minWidth: 17, height: 17,
            borderRadius: 99,
            background: critCount > 0 ? "#dc2626" : "#b45309",
            color: "#fff",
            fontSize: 9, fontWeight: 800,
            fontFamily: "'DM Mono',monospace",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #fff",
            boxShadow: "0 1px 6px rgba(220,38,38,.45)",
            animation: "badgePop .25s cubic-bezier(.34,1.56,.64,1) both",
          }}>
            {unreadCnt > 9 ? "9+" : unreadCnt}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-dropdown"
          style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          width: 360,
          maxHeight: 520,
          background: "#fff",
          borderRadius: 18,
          border: "1px solid rgba(26,26,46,.1)",
          boxShadow: "0 20px 60px rgba(26,26,46,.18), 0 4px 16px rgba(26,26,46,.08)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "dropIn .18s cubic-bezier(.34,1.3,.64,1) both",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid rgba(26,26,46,.07)",
            background: "linear-gradient(135deg,rgba(239,68,68,.05),rgba(180,83,9,.03))",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span style={{ fontFamily: "'Figtree',sans-serif", fontSize: 14, fontWeight: 800, color: "#1a1a2e" }}>
                  Stock Alerts
                </span>
                {unreadCnt > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 99, padding: "1px 7px", fontFamily: "'DM Mono',monospace" }}>
                    {unreadCnt} new
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Refresh */}
                <button
                  onClick={e => { e.stopPropagation(); fetchAlerts(); }}
                  title="Refresh"
                  style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(26,26,46,.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(26,26,46,.4)" }}
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"
                    style={{ animation: loading ? "spin .7s linear infinite" : "none" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
                {/* Mark all read */}
                {unreadCnt > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); markAllRead(); }}
                    style={{ fontSize: 10, fontWeight: 700, color: "rgba(26,26,46,.4)", background: "transparent", border: "1px solid rgba(26,26,46,.1)", borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Summary chips */}
            {items.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {critCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace" }}>
                    🔴 {critCount} OUT OF STOCK
                  </span>
                )}
                {highCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "rgba(180,83,9,.08)", border: "1px solid rgba(180,83,9,.2)", borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace" }}>
                    🟠 {highCount} CRITICALLY LOW
                  </span>
                )}
                {(items.length - critCount - highCount) > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 99, padding: "2px 9px", fontFamily: "'DM Mono',monospace" }}>
                    🟡 {items.length - critCount - highCount} LOW
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && items.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(239,68,68,.15)", borderTopColor: "#dc2626", animation: "spin .7s linear infinite" }} />
                <span style={{ fontSize: 12, color: "rgba(26,26,46,.35)", fontFamily: "'DM Mono',monospace" }}>Checking inventory…</span>
              </div>
            ) : items.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 10 }}>
                <div style={{ fontSize: 32 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(26,26,46,.45)" }}>All stock levels healthy</div>
                <div style={{ fontSize: 11, color: "rgba(26,26,46,.3)", textAlign: "center", fontFamily: "'DM Mono',monospace", letterSpacing: ".04em" }}>
                  No products below {LOW_THRESHOLD} units
                </div>
              </div>
            ) : (
              items.map((item, i) => {
                const s       = urgStyle(item.urgency);
                const isUnread = !readIds.has(item.id);
                const pct     = Math.round((item.stock / LOW_THRESHOLD) * 100);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 18px",
                      borderBottom: i < items.length - 1 ? "1px solid rgba(26,26,46,.05)" : "none",
                      background: isUnread ? `${s.bg}` : "transparent",
                      cursor: "pointer",
                      transition: "background .15s",
                      position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = isUnread ? s.bg : "transparent"}
                  >
                    {/* Unread dot */}
                    {isUnread && (
                      <div style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                    )}

                    {/* Stock badge */}
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: s.bg, border: `1.5px solid ${s.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1 }}>{item.stock}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: s.color, opacity: .7, letterSpacing: ".04em" }}>UNITS</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </span>
                        <span style={{ flexShrink: 0, fontSize: 8.5, fontWeight: 800, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 99, padding: "1px 6px", fontFamily: "'DM Mono',monospace", letterSpacing: ".06em", textTransform: "uppercase" }}>
                          {item.urgency}
                        </span>
                      </div>

                      {/* Mini bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ flex: 1, height: 3.5, borderRadius: 99, background: "rgba(26,26,46,.07)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: s.dot, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 9.5, color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
                          {pct}% of {LOW_THRESHOLD}
                        </span>
                        {item.category && (
                          <span style={{ fontSize: 9, color: "#059669", background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.15)", padding: "0px 5px", borderRadius: 99, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.2)" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div style={{
              padding: "11px 18px",
              borderTop: "1px solid rgba(26,26,46,.07)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
              background: "rgba(26,26,46,.015)",
            }}>
              <span style={{ fontSize: 10, color: "rgba(26,26,46,.32)", fontFamily: "'DM Mono',monospace" }}>
                {fetchedAt ? `Updated ${timeAgo(fetchedAt)}` : "Checking…"}
              </span>
              <button
                onClick={() => { setOpen(false); navigate(role === "STAFF" ? "/staff/my-reports" : "/reports/low-stock"); }}
                style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", background: "rgba(239,68,68,.07)", border: "1.5px solid rgba(239,68,68,.18)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "'DM Mono',monospace", letterSpacing: ".04em" }}>
                View Full Report →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%,100%  { transform: rotate(0); }
          10%,30%  { transform: rotate(-12deg); }
          20%,40%  { transform: rotate(12deg); }
          50%      { transform: rotate(0); }
        }
        @keyframes badgePop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HEADER
══════════════════════════════════════════════════════════════════ */
export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role      = ROLE_CONFIG[user.role];
  const navItems  = ROLE_NAV[user.role] ?? [];
  const current   = navItems.find((n) => location.pathname.startsWith(n.path));

  // Show bell only for roles that can access reports (ADMIN, SUPER_ADMIN)
  const showBell = user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "STAFF";

  return (
      <header className="app-header">
        {/* Left — hamburger + page title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="hamburger-btn" onClick={onMenuClick}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-.02em" }}>
              {current?.label ?? "Dashboard"}
            </div>
            <div className="header-workspace">{role.workspace}</div>
          </div>
        </div>

        {/* Right — live indicator + notification bell */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,.5)", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9.5px", color: "rgba(26,26,46,.3)", letterSpacing: ".1em", textTransform: "uppercase" }}>Live</span>
          </div>

          {/* Divider */}
          {showBell && <div style={{ width: 1, height: 20, background: "rgba(26,26,46,.1)" }} />}

          {/* Notification Bell */}
          {showBell && <NotificationBell role={user.role} />}
        </div>
      </header>
  );
}
