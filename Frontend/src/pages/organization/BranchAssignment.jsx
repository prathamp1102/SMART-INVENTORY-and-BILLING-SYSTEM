import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getOrganizations,
  getBranches,
  getBranchStaff,
  getUnassignedStaff,
  assignStaff,
  bulkAssignStaff,
} from "../../services/organizationService";
import { getUsersApi } from "../../services/authService";

/* ─── palette ──────────────────────────────────────────────────── */
const P = "#7c3aed", PL = "rgba(124,58,237,.08)", PB = "rgba(124,58,237,.2)", PG = "rgba(124,58,237,.15)";
const B = "#0284c7", BL = "rgba(2,132,199,.08)",  BB = "rgba(2,132,199,.2)";
const G = "#059669", GL = "rgba(5,150,105,.08)",   GB = "rgba(5,150,105,.2)";
const R = "#dc2626", RL = "rgba(239,68,68,.08)",   RB = "rgba(239,68,68,.2)";
const card = { background:"#fff", borderRadius:"18px", border:"1px solid rgba(26,26,46,.08)", boxShadow:"0 2px 16px rgba(26,26,46,.05)" };

/* ─── tiny helpers ─────────────────────────────────────────────── */
function Avatar({ name, size = 32, color = P }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${color}cc)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 2px 8px ${color}44` }}>
      <span style={{ fontSize:size*0.38, fontWeight:800, color:"#fff" }}>{name?.charAt(0)?.toUpperCase()}</span>
    </div>
  );
}

function Tag({ label, color, bg, border }) {
  return <span style={{ fontSize:"10px", fontWeight:700, color, background:bg, border:`1px solid ${border}`, borderRadius:"99px", padding:"2px 8px", fontFamily:"'DM Mono',monospace", letterSpacing:".08em", whiteSpace:"nowrap" }}>{label}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const ok = type !== "error";
  return (
    <div style={{ position:"fixed", bottom:"24px", right:"24px", zIndex:9999, padding:"13px 20px", borderRadius:"14px", background: ok ? "#fff" : "#fff", border:`1px solid ${ok ? GB : RB}`, boxShadow:`0 8px 32px ${ok ? GL : RL}`, display:"flex", alignItems:"center", gap:"10px", animation:"fadeUp .3s ease both", minWidth:"260px" }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background: ok ? G : R, flexShrink:0 }} />
      <span style={{ fontSize:"13px", fontWeight:600, color:"#1a1a2e" }}>{msg}</span>
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"rgba(26,26,46,.4)", fontSize:"16px", lineHeight:1 }}>×</button>
    </div>
  );
}

function Spinner() {
  return <div style={{ width:20, height:20, borderRadius:"50%", border:"2.5px solid rgba(124,58,237,.2)", borderTopColor:P, animation:"spin .7s linear infinite" }} />;
}

function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", padding:"40px 20px", color:"rgba(26,26,46,.35)" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path strokeLinecap="round" strokeLinejoin="round" d={icon} /></svg>
      <div style={{ fontWeight:700, fontSize:"14px", color:"rgba(26,26,46,.5)" }}>{title}</div>
      {sub && <div style={{ fontSize:"12px" }}>{sub}</div>}
    </div>
  );
}

/* ─── StaffCard ────────────────────────────────────────────────── */
function StaffCard({ staff, onRemove, onMove, branches, currentBranchId, removing }) {
  const [showMove, setShowMove] = useState(false);
  const dropRef = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMove) return;
    const handler = (e) => {
      if (!e.target.closest("[data-move-dropdown]")) setShowMove(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMove]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"12px", border:"1px solid rgba(26,26,46,.07)", background:"rgba(26,26,46,.01)", transition:"all .15s" }}
      onMouseEnter={e => e.currentTarget.style.background = PL}
      onMouseLeave={e => e.currentTarget.style.background = "rgba(26,26,46,.01)"}
    >
      <Avatar name={staff.name} size={34} color={G} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:"13px", color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{staff.name}</div>
        <div style={{ fontSize:"11px", color:"rgba(26,26,46,.4)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{staff.email}</div>
      </div>
      <Tag label={staff.role} color={staff.role === "ADMIN" ? B : G} bg={staff.role === "ADMIN" ? BL : GL} border={staff.role === "ADMIN" ? BB : GB} />

      <div style={{ display:"flex", gap:"5px", flexShrink:0 }}>
        {/* Move to another branch — only show if other branches exist */}
        {branches.length > 0 && (
          <div style={{ position:"relative" }} data-move-dropdown="true">
            <button
              title="Move to branch"
              onClick={() => setShowMove(v => !v)}
              style={{ width:28, height:28, borderRadius:"8px", border:`1px solid ${BB}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:B }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
            </button>
            {showMove && (
              <div style={{ position:"absolute", right:0, top:"34px", zIndex:200, background:"#fff", borderRadius:"12px", border:"1px solid rgba(26,26,46,.1)", boxShadow:"0 8px 32px rgba(26,26,46,.15)", padding:"6px", minWidth:"200px" }}>
                <div style={{ fontSize:"10px", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(26,26,46,.4)", padding:"4px 8px 6px" }}>Move to branch</div>
                {branches.filter(b => String(b._id) !== currentBranchId).length === 0 ? (
                  <div style={{ padding:"10px", fontSize:"12px", color:"rgba(26,26,46,.4)", textAlign:"center" }}>No other branches available</div>
                ) : (
                  branches.filter(b => String(b._id) !== currentBranchId).map(b => (
                    <button key={b._id} onClick={() => { setShowMove(false); onMove(staff._id, b._id); }}
                      style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px", borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", fontSize:"12px", color:"#1a1a2e", fontWeight:600 }}
                      onMouseEnter={e => e.currentTarget.style.background = PL}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {b.branchName} <span style={{ color:"rgba(26,26,46,.4)", fontWeight:400 }}>· {b.city}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {/* Remove from branch */}
        <button
          title="Remove from branch"
          onClick={() => onRemove(staff._id)}
          disabled={removing}
          style={{ width:28, height:28, borderRadius:"8px", border:`1px solid ${RB}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:R }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ─── BranchPanel ──────────────────────────────────────────────── */
function BranchPanel({ branch, allBranches, onStaffChange, showToast }) {
  const [staff, setStaff]             = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [removing, setRemoving]       = useState(false);

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true);
    try { setStaff(await getBranchStaff(branch._id)); }
    catch { setStaff([]); }
    finally { setLoadingStaff(false); }
  }, [branch._id]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const handleRemove = async (staffId) => {
    setRemoving(true);
    try {
      await assignStaff(staffId, null);
      showToast("Staff removed from branch");
      await loadStaff();
      onStaffChange();
    } catch { showToast("Failed to remove staff", "error"); }
    finally { setRemoving(false); }
  };

  const handleMove = async (staffId, toBranchId) => {
    try {
      await assignStaff(staffId, toBranchId);
      showToast("Staff moved successfully");
      await loadStaff();
      onStaffChange();
    } catch { showToast("Failed to move staff", "error"); }
  };

  const adminAssigned = branch.admin;
  const otherBranches = allBranches.filter(b => b._id !== branch._id);

  return (
    <div style={{ border:`1px solid ${BB}`, borderRadius:"14px", overflow:"hidden" }}>
      {/* Branch header */}
      <div style={{ padding:"12px 16px", background:`linear-gradient(135deg,${BL},rgba(2,132,199,.03))`, borderBottom:`1px solid ${BB}`, display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:34, height:34, borderRadius:"10px", background:`linear-gradient(135deg,${B},#0369a1)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 10px ${B}44` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:"14px", color:"#1a1a2e" }}>{branch.branchName}</div>
          <div style={{ fontSize:"11.5px", color:"rgba(26,26,46,.4)", marginTop:"1px" }}>{[branch.city, branch.state].filter(Boolean).join(", ")}</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
          {adminAssigned ? (
            <div style={{ display:"flex", alignItems:"center", gap:"6px", padding:"4px 10px", borderRadius:"99px", background:GL, border:`1px solid ${GB}` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:G }} />
              <span style={{ fontSize:"11px", color:G, fontWeight:700 }}>Admin: {branch.admin?.name || "Assigned"}</span>
            </div>
          ) : (
            <Tag label="No Admin" color="#b45309" bg="rgba(180,83,9,.08)" border="rgba(180,83,9,.2)" />
          )}
          <Tag label={`${staff.length} staff`} color={B} bg={BL} border={BB} />
          <button
            onClick={() => setShowAssignModal(true)}
            style={{ padding:"6px 14px", borderRadius:"9px", border:`1px solid ${PB}`, background:PL, color:P, fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Assign Staff
          </button>
        </div>
      </div>

      {/* Staff list */}
      <div style={{ padding:"10px 12px", minHeight:"60px" }}>
        {loadingStaff ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"20px" }}><Spinner /></div>
        ) : staff.length === 0 ? (
          <EmptyState icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" title="No staff assigned" sub="Click 'Assign Staff' to add members" />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {staff.map(s => (
              <StaffCard key={s._id} staff={s} onRemove={handleRemove} onMove={handleMove} branches={otherBranches} currentBranchId={String(branch._id)} removing={removing} />
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignStaffModal
          branch={branch}
          onClose={() => setShowAssignModal(false)}
          onAssigned={async () => { await loadStaff(); onStaffChange(); setShowAssignModal(false); }}
          showToast={showToast}
          currentStaffIds={staff.map(s => String(s._id))}
        />
      )}
    </div>
  );
}

/* ─── AssignStaffModal ─────────────────────────────────────────── */
function AssignStaffModal({ branch, onClose, onAssigned, showToast, currentStaffIds }) {
  const [allStaff, setAllStaff]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(new Set());
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    // Load all staff — both unassigned and from other branches
    getUsersApi().then(users => {
      const staff = users.filter(u => u.role === "STAFF");
      setAllStaff(staff);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allStaff.filter(s =>
      !currentStaffIds.includes(String(s._id)) &&
      (s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    );
  }, [allStaff, search, currentStaffIds]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleAssign = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await bulkAssignStaff([...selected], branch._id);
      showToast(`${selected.size} staff assigned to ${branch.branchName}`);
      onAssigned();
    } catch (e) {
      showToast(e?.response?.data?.message || "Assignment failed", "error");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,26,46,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#fff", borderRadius:"20px", width:"100%", maxWidth: "min(480px, 100%)", boxShadow:"0 24px 80px rgba(26,26,46,.2)", animation:"fadeUp .22s ease both", display:"flex", flexDirection:"column", maxHeight:"85vh" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(26,26,46,.08)", display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:36, height:36, borderRadius:"10px", background:`linear-gradient(135deg,${P},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:"15px", color:"#1a1a2e" }}>Assign Staff</div>
            <div style={{ fontSize:"11.5px", color:"rgba(26,26,46,.4)", marginTop:"1px" }}>to {branch.branchName}</div>
          </div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:"8px", border:"1px solid rgba(26,26,46,.12)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(26,26,46,.4)" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding:"14px 20px 6px" }}>
          <div style={{ position:"relative" }}>
            <svg style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.35)" strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search staff by name or email…"
              style={{ width:"100%", padding:"8px 12px 8px 34px", borderRadius:"10px", border:"1.5px solid rgba(26,26,46,.12)", fontSize:"13px", boxSizing:"border-box", outline:"none" }}
              onFocus={e => e.target.style.borderColor = P}
              onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
            />
          </div>
          {selected.size > 0 && (
            <div style={{ marginTop:"8px", fontSize:"12px", color:P, fontWeight:700 }}>
              {selected.size} staff selected
              <button onClick={() => setSelected(new Set())} style={{ marginLeft:"8px", fontSize:"11px", color:"rgba(26,26,46,.4)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>clear</button>
            </div>
          )}
        </div>

        {/* Staff list */}
        <div style={{ flex:1, overflowY:"auto", padding:"8px 16px 12px" }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"30px" }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" title={search ? "No matches found" : "No staff available"} sub={search ? "Try a different search term" : "All staff are already assigned to this branch"} />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
              {filtered.map(s => {
                const isSel = selected.has(s._id);
                const hasBranch = s.branch;
                return (
                  <div
                    key={s._id}
                    onClick={() => toggle(s._id)}
                    style={{ display:"flex", alignItems:"center", gap:"11px", padding:"9px 12px", borderRadius:"11px", border:`1.5px solid ${isSel ? PB : "rgba(26,26,46,.07)"}`, background: isSel ? PL : "#fff", cursor:"pointer", transition:"all .15s" }}
                  >
                    <div style={{ width:18, height:18, borderRadius:"5px", border:`2px solid ${isSel ? P : "rgba(26,26,46,.2)"}`, background: isSel ? P : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .15s" }}>
                      {isSel && <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="10" height="10"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>}
                    </div>
                    <Avatar name={s.name} size={30} color={G} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:"13px", color:"#1a1a2e" }}>{s.name}</div>
                      <div style={{ fontSize:"11px", color:"rgba(26,26,46,.4)" }}>{s.email}</div>
                    </div>
                    {hasBranch ? (
                      <div style={{ fontSize:"10px", color:"#b45309", background:"rgba(180,83,9,.08)", border:"1px solid rgba(180,83,9,.2)", borderRadius:"99px", padding:"2px 8px", fontWeight:700, whiteSpace:"nowrap" }}>
                        In another branch
                      </div>
                    ) : (
                      <Tag label="Unassigned" color="rgba(26,26,46,.4)" bg="rgba(26,26,46,.05)" border="rgba(26,26,46,.1)" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(26,26,46,.08)", display:"flex", gap:"10px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px", borderRadius:"10px", border:"1px solid rgba(26,26,46,.15)", background:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:600, color:"rgba(26,26,46,.6)" }}>Cancel</button>
          <button
            onClick={handleAssign}
            disabled={selected.size === 0 || saving}
            style={{ flex:2, padding:"10px", borderRadius:"10px", border:"none", background: selected.size > 0 ? `linear-gradient(135deg,${P},#6d28d9)` : "rgba(26,26,46,.1)", color: selected.size > 0 ? "#fff" : "rgba(26,26,46,.3)", cursor: selected.size > 0 ? "pointer" : "not-allowed", fontSize:"13px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", transition:"all .2s" }}
          >
            {saving ? <><Spinner /><span>Assigning…</span></> : `Assign ${selected.size > 0 ? selected.size : ""} Staff`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── OrgSection ───────────────────────────────────────────────── */
function OrgSection({ org, branches, showToast, onRefresh }) {
  const [open, setOpen] = useState(true);
  const orgBranches = branches.filter(b =>
    String(b.organization?._id || b.organization) === String(org._id)
  );

  return (
    <div style={{ ...card, overflow:"hidden" }}>
      {/* Org header */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ padding:"16px 20px", background:`linear-gradient(135deg,${PL},rgba(124,58,237,.03))`, borderBottom: open ? `1px solid ${PB}` : "none", display:"flex", alignItems:"center", gap:"14px", cursor:"pointer", userSelect:"none" }}
      >
        <div style={{ width:40, height:40, borderRadius:"12px", background:`linear-gradient(135deg,${P},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 14px ${PG}` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="18" height="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontWeight:800, fontSize:"17px", color:"#1a1a2e", letterSpacing:"-.01em" }}>{org.name}</div>
          <div style={{ fontSize:"12px", color:"rgba(26,26,46,.4)", marginTop:"2px", display:"flex", gap:"12px" }}>
            {org.city && <span>{org.city}</span>}
            {org.gstNumber && <span style={{ fontFamily:"'DM Mono',monospace" }}>GST: {org.gstNumber}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <Tag label={`${orgBranches.length} branches`} color={P} bg={PL} border={PB} />
          <Tag label={org.status} color={org.status === "ACTIVE" ? G : "#b45309"} bg={org.status === "ACTIVE" ? GL : "rgba(180,83,9,.08)"} border={org.status === "ACTIVE" ? GB : "rgba(180,83,9,.2)"} />
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="16" height="16" style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
          </svg>
        </div>
      </div>

      {open && (
        <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          {orgBranches.length === 0 ? (
            <EmptyState icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21" title="No branches yet" sub="Create branches from the Organization page" />
          ) : (
            orgBranches.map(branch => (
              <BranchPanel
                key={branch._id}
                branch={branch}
                allBranches={orgBranches}
                onStaffChange={onRefresh}
                showToast={showToast}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────── */
export default function BranchAssignment() {
  const [orgs, setOrgs]         = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [search, setSearch]     = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, b] = await Promise.all([getOrganizations(), getBranches()]);
      setOrgs(o);
      setBranches(b);
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll, refreshKey]);

  const filteredOrgs = useMemo(() => {
    if (!search.trim()) return orgs;
    const q = search.toLowerCase();
    return orgs.filter(o => o.name.toLowerCase().includes(q) || o.city?.toLowerCase().includes(q));
  }, [orgs, search]);

  // Stats
  const totalBranches = branches.length;
  const assignedBranches = branches.filter(b => b.admin).length;

  return (
    <div style={{ animation:"fadeUp .4s ease both" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom:"24px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"16px", flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:"26px", fontWeight:900, color:"#1a1a2e", letterSpacing:"-.02em", margin:"0 0 4px" }}>Branch Assignment</h2>
            <p style={{ fontSize:"13px", color:"rgba(26,26,46,.42)", margin:0 }}>Assign and manage staff across organizations and branches</p>
          </div>
          {/* Summary pills */}
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <div style={{ padding:"10px 18px", borderRadius:"12px", background:"#fff", border:`1px solid ${PB}`, display:"flex", gap:"8px", alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:P }} />
              <span style={{ fontSize:"12px", color:"rgba(26,26,46,.5)" }}>Orgs</span>
              <span style={{ fontSize:"16px", fontWeight:800, color:P }}>{orgs.length}</span>
            </div>
            <div style={{ padding:"10px 18px", borderRadius:"12px", background:"#fff", border:`1px solid ${BB}`, display:"flex", gap:"8px", alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:B }} />
              <span style={{ fontSize:"12px", color:"rgba(26,26,46,.5)" }}>Branches</span>
              <span style={{ fontSize:"16px", fontWeight:800, color:B }}>{totalBranches}</span>
            </div>
            <div style={{ padding:"10px 18px", borderRadius:"12px", background:"#fff", border:`1px solid ${GB}`, display:"flex", gap:"8px", alignItems:"center" }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:G }} />
              <span style={{ fontSize:"12px", color:"rgba(26,26,46,.5)" }}>With Admin</span>
              <span style={{ fontSize:"16px", fontWeight:800, color:G }}>{assignedBranches}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:"relative", marginTop:"16px", maxWidth: "min(340px, 100%)" }}>
          <svg style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.35)" strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organizations…"
            style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:"11px", border:"1.5px solid rgba(26,26,46,.12)", fontSize:"13px", boxSizing:"border-box", outline:"none", background:"#fff" }}
            onFocus={e => e.target.style.borderColor = P}
            onBlur={e => e.target.style.borderColor = "rgba(26,26,46,.12)"}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"12px", padding:"80px", color:"rgba(26,26,46,.4)" }}>
          <Spinner />
          <span style={{ fontSize:"14px" }}>Loading organizations…</span>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div style={{ ...card, padding:"60px 40px", textAlign:"center" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🏢</div>
          <div style={{ fontSize:"16px", fontWeight:700, color:"rgba(26,26,46,.5)", marginBottom:"6px" }}>
            {search ? "No organizations match your search" : "No organizations found"}
          </div>
          <div style={{ fontSize:"13px", color:"rgba(26,26,46,.35)" }}>
            {search ? "Try a different search term" : "Create organizations from the Organization Control page first"}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {filteredOrgs.map(org => (
            <OrgSection
              key={org._id}
              org={org}
              branches={branches}
              showToast={showToast}
              onRefresh={() => setRefreshKey(k => k + 1)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}