import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import useAuth from "../hooks/useAuth";
import { ROLE_CONFIG, ROLE_NAV } from "../utils/constants";

function NavIcon({ path, size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor"
      width={size} height={size} style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={13} height={13}
      style={{ flexShrink: 0, transition: "transform .22s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </svg>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Track which groups are expanded (by parent path)
  const [expanded, setExpanded] = useState(() => {
    // Auto-expand parent if current route is a child
    const initial = {};
    return initial;
  });

  if (!user) return null;

  const role = ROLE_CONFIG[user.role];
  const navItems = ROLE_NAV[user.role] ?? [];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const isChildActive = (children) =>
    children?.some((c) => location.pathname.startsWith(c.path));

  const toggleGroup = (path) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Auto-expand if a child is currently active
  const isOpen = (item) => {
    if (expanded[item.path] !== undefined) return expanded[item.path];
    return isChildActive(item.children);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop${open ? " open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar${open ? " open" : ""}`}>

        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: "11px",
          padding: "22px 20px 20px",
          borderBottom: "1px solid rgba(26,26,46,.07)",
        }}>
          <Logo size={34} variant="full" style={{ flex: 1, minWidth: 0 }} />
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid rgba(26,26,46,.12)", background: "transparent",
              cursor: "pointer", alignItems: "center", justifyContent: "center",
              color: "rgba(26,26,46,.4)", flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>

        {/* User badge */}
        <div style={{
          margin: "14px 14px 6px", padding: "11px 14px", borderRadius: "14px",
          background: role.light, border: `1px solid ${role.border}`,
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: `linear-gradient(135deg,${role.btnFrom},${role.btnTo})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: `0 2px 8px ${role.glow}`,
          }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>
              {user.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "8.5px", color: role.accent, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "2px" }}>{role.level}</div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginTop: "1px" }}>{role.name}</div>
          </div>
        </div>

        {/* Section label */}
        <div style={{ padding: "8px 14px 4px", fontFamily: "'DM Mono', monospace", fontSize: "8.5px", color: "rgba(26,26,46,.28)", letterSpacing: ".16em", textTransform: "uppercase", marginTop: "4px" }}>
          Menu
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              const groupOpen = isOpen(item);
              const childActive = isChildActive(item.children);
              const parentActive = location.pathname === item.path;
              const highlighted = childActive || parentActive;

              return (
                <div key={item.path}>
                  {/* Parent row — clickable to toggle + navigate */}
                  <div
                    onClick={() => toggleGroup(item.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: "11px",
                      padding: "9px 12px", borderRadius: "11px", marginBottom: "2px",
                      fontSize: "13.5px", fontWeight: highlighted ? 600 : 400,
                      color: highlighted ? role.accent : "rgba(26,26,46,.52)",
                      background: highlighted ? role.light : "transparent",
                      border: `1px solid ${highlighted ? role.border : "transparent"}`,
                      cursor: "pointer", transition: "all .18s",
                      boxShadow: highlighted ? `0 2px 8px ${role.glow}` : "none",
                      userSelect: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!highlighted) {
                        e.currentTarget.style.background = "rgba(26,26,46,.04)";
                        e.currentTarget.style.color = "rgba(26,26,46,.7)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!highlighted) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(26,26,46,.52)";
                      }
                    }}
                  >
                    {item.icon && <NavIcon path={item.icon} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <ChevronIcon open={groupOpen} />
                  </div>

                  {/* Children — animated slide */}
                  <div style={{
                    overflow: "hidden",
                    maxHeight: groupOpen ? `${item.children.length * 48}px` : "0px",
                    transition: "max-height .25s ease",
                  }}>
                    {/* Left accent line */}
                    <div style={{ position: "relative", marginLeft: "10px" }}>
                      <div style={{
                        position: "absolute", left: "11px", top: "4px",
                        bottom: "4px", width: "2px",
                        background: `linear-gradient(180deg, ${role.border}, transparent)`,
                        borderRadius: "99px",
                      }} />
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={handleNavClick}
                          style={({ isActive }) => ({
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "8px 12px 8px 30px",
                            borderRadius: "10px", marginBottom: "2px",
                            fontSize: "13px", fontWeight: isActive ? 600 : 400,
                            color: isActive ? role.accent : "rgba(26,26,46,.48)",
                            background: isActive ? role.light : "transparent",
                            border: `1px solid ${isActive ? role.border : "transparent"}`,
                            textDecoration: "none", transition: "all .15s",
                            boxShadow: isActive ? `0 1px 6px ${role.glow}` : "none",
                          })}
                        >
                          {child.icon && <NavIcon path={child.icon} size={14} />}
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // Regular flat nav item
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: "11px",
                  padding: "9px 12px", borderRadius: "11px", marginBottom: "2px",
                  fontSize: "13.5px", fontWeight: isActive ? 600 : 400,
                  color: isActive ? role.accent : "rgba(26,26,46,.52)",
                  background: isActive ? role.light : "transparent",
                  border: `1px solid ${isActive ? role.border : "transparent"}`,
                  textDecoration: "none", transition: "all .18s",
                  boxShadow: isActive ? `0 2px 8px ${role.glow}` : "none",
                })}
              >
                {item.icon && <NavIcon path={item.icon} />}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "10px 10px 16px", borderTop: "1px solid rgba(26,26,46,.07)" }}>
          <NavLink
            to="/profile"
            onClick={handleNavClick}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "11px",
              padding: "9px 12px", borderRadius: "11px", marginBottom: "2px",
              fontSize: "13px", fontWeight: 500,
              color: isActive ? role.accent : "rgba(26,26,46,.45)",
              background: isActive ? role.light : "transparent",
              border: `1px solid ${isActive ? role.border : "transparent"}`,
              textDecoration: "none", transition: "all .18s",
            })}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            Profile
          </NavLink>

          <div
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "11px", padding: "9px 12px", borderRadius: "11px", cursor: "pointer", fontSize: "13px", color: "rgba(26,26,46,.38)", fontWeight: 500, transition: "all .18s", border: "1px solid transparent" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.background = "rgba(239,68,68,.06)"; e.currentTarget.style.borderColor = "rgba(239,68,68,.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(26,26,46,.38)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Sign out
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", padding: "0 12px", fontFamily: "'DM Mono', monospace", fontSize: "8.5px", color: "rgba(26,26,46,.22)", letterSpacing: ".1em", textTransform: "uppercase" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(22,163,74,.6)", boxShadow: "0 0 5px rgba(22,163,74,.4)", flexShrink: 0 }} />
            TLS 1.3 Encrypted
          </div>
        </div>
      </aside>
    </>
  );
}