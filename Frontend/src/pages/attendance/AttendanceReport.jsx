import { useState, useEffect, useMemo } from "react";
import { getAllAttendanceApi, getAttendanceSummaryApi, updateAttendanceApi } from "../../services/attendanceService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import { PageShell } from "../../components/ui/PageShell";
import useAuth from "../../hooks/useAuth";
import ExcelExport from "../../components/ui/ExcelExport";

/* ── Helpers ─────────────────────────────────────────────────── */
function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtDuration(mins) {
  if (!mins && mins !== 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ST = {
  PRESENT:  { bg: "rgba(5,150,105,.1)",  color: "#059669", label: "Present"  },
  HALF_DAY: { bg: "rgba(245,158,11,.1)", color: "#d97706", label: "Half Day" },
  ABSENT:   { bg: "rgba(239,68,68,.1)",  color: "#dc2626", label: "Absent"   },
};

/* ── Main Component ──────────────────────────────────────────── */
export default function AttendanceReport() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const now = new Date();

  /* tabs */
  const [tab, setTab] = useState("daily");

  /* filters */
  const [date,   setDate]   = useState(now.toISOString().slice(0, 10));
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());
  const [selOrg,    setSelOrg]    = useState("all");
  const [selBranch, setSelBranch] = useState("all");

  /* data */
  const [orgs,     setOrgs]     = useState([]);
  const [branches, setBranches] = useState([]);
  const [records,  setRecords]  = useState([]);
  const [summary,  setSummary]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* edit modal */
  const [editRec,  setEditRec]  = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving,   setSaving]   = useState(false);

  /* load org/branch lists once */
  useEffect(() => {
    if (!isSuperAdmin) return;
    Promise.all([getOrganizations(), getBranches()]).then(([o, b]) => {
      setOrgs(o);
      setBranches(b);
    }).catch(console.error);
  }, [isSuperAdmin]);

  /* reset branch when org changes */
  useEffect(() => { setSelBranch("all"); }, [selOrg]);

  /* filtered branch list */
  const filteredBranches = useMemo(() => {
    if (!isSuperAdmin || selOrg === "all") return branches;
    return branches.filter(b =>
      String(b.organization?._id || b.organization) === selOrg
    );
  }, [branches, selOrg, isSuperAdmin]);

  /* load data — depend on primitive values, not object reference */
  useEffect(() => {
    const orgId    = isSuperAdmin && selOrg    !== "all" ? selOrg    : undefined;
    const branchId = isSuperAdmin && selBranch !== "all" ? selBranch : undefined;

    if (tab === "daily") {
      setLoading(true);
      getAllAttendanceApi({ date, organizationId: orgId, branchId })
        .then(setRecords).catch(console.error).finally(() => setLoading(false));
    } else {
      setLoading(true);
      getAttendanceSummaryApi(month, year, { organizationId: orgId, branchId })
        .then(setSummary).catch(console.error).finally(() => setLoading(false));
    }
  }, [tab, date, month, year, selOrg, selBranch, isSuperAdmin]);

  /* edit handlers */
  const openEdit = (r) => {
    setEditRec(r);
    const toLocal = d => d
      ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0,16)
      : "";
    setEditForm({ loginTime: toLocal(r.loginTime), logoutTime: toLocal(r.logoutTime), status: r.status, note: r.note || "" });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await updateAttendanceApi(editRec._id, {
        loginTime:  editForm.loginTime  ? new Date(editForm.loginTime).toISOString()  : undefined,
        logoutTime: editForm.logoutTime ? new Date(editForm.logoutTime).toISOString() : undefined,
        status: editForm.status,
        note:   editForm.note,
      });
      setEditRec(null);
      const orgId    = isSuperAdmin && selOrg    !== "all" ? selOrg    : undefined;
      const branchId = isSuperAdmin && selBranch !== "all" ? selBranch : undefined;
      getAllAttendanceApi({ date, organizationId: orgId, branchId }).then(setRecords);
    } catch (e) { console.error("Update failed", e); }
    finally { setSaving(false); }
  };

  /* stats for daily header */
  const stats = useMemo(() => ({
    total:   records.length,
    present: records.filter(r => r.status === "PRESENT").length,
    half:    records.filter(r => r.status === "HALF_DAY").length,
    absent:  records.filter(r => r.status === "ABSENT").length,
  }), [records]);

  return (
    <PageShell title="Attendance Report">

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        {[["daily","Daily View"],["summary","Monthly Summary"]].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:"8px 22px", borderRadius:"10px", border:"none", cursor:"pointer",
            fontSize:"13px", fontWeight:700, transition:"all .18s",
            background: tab===k ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(26,26,46,.06)",
            color: tab===k ? "#fff" : "rgba(26,26,46,.55)",
          }}>{label}</button>
        ))}
        <div style={{marginLeft:"auto"}}>
          <ExcelExport
          data={records}
          filename={`attendance_${date}`}
          sheetName="Attendance"
          accent={{color:"#7c3aed",light:"rgba(124,58,237,.08)",border:"rgba(124,58,237,.2)"}}
          columns={[
            {key:"user.name",label:"Employee Name"},
            {key:"user.email",label:"Email"},
            {key:"user.role",label:"Role"},
            {key:"branch.branchName",label:"Branch"},
            {key:"branch.organization.name",label:"Organization"},
            {key:"date",label:"Date",format:v=>v?new Date(v).toLocaleDateString("en-IN"):""},
            {key:"checkIn",label:"Check In"},
            {key:"checkOut",label:"Check Out"},
            {key:"status",label:"Status"},
            {key:"totalMinutes",label:"Duration (mins)"},
          ]}
        />
        </div>
      </div>

      {/* ── Org/Branch Filter Bar (Super Admin only) ─────────── */}
      {isSuperAdmin && (
        <div style={{
          background:"#fff", borderRadius:"14px", padding:"16px 20px",
          border:"1px solid rgba(26,26,46,.08)", marginBottom:"16px",
          display:"flex", gap:"12px", flexWrap:"wrap", alignItems:"center",
        }}>
          {/* Org icon */}
          <div style={{ display:"flex", alignItems:"center", gap:"7px", color:"rgba(26,26,46,.4)", fontSize:"12px", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            Filter
          </div>

          <select value={selOrg} onChange={e => setSelOrg(e.target.value)} style={selStyle}>
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </select>

          <select value={selBranch} onChange={e => setSelBranch(e.target.value)} style={selStyle} disabled={selOrg === "all" && filteredBranches.length === 0}>
            <option value="all">All Branches</option>
            {filteredBranches.map(b => <option key={b._id} value={b._id}>{b.branchName} — {b.city}</option>)}
          </select>

          {(selOrg !== "all" || selBranch !== "all") && (
            <button onClick={() => { setSelOrg("all"); setSelBranch("all"); }} style={{
              padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(239,68,68,.25)",
              background:"rgba(239,68,68,.06)", color:"#dc2626", fontSize:"12px", fontWeight:600, cursor:"pointer",
            }}>
              Clear Filter
            </button>
          )}

          {/* Active filter badge */}
          {selOrg !== "all" && (
            <div style={{ marginLeft:"auto", display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {selOrg !== "all" && (
                <span style={{ padding:"4px 12px", borderRadius:"20px", background:"rgba(124,58,237,.1)", color:"#7c3aed", fontSize:"12px", fontWeight:700 }}>
                  {orgs.find(o => o._id === selOrg)?.name || "Org"}
                </span>
              )}
              {selBranch !== "all" && (
                <span style={{ padding:"4px 12px", borderRadius:"20px", background:"rgba(2,132,199,.1)", color:"#0284c7", fontSize:"12px", fontWeight:700 }}>
                  {filteredBranches.find(b => b._id === selBranch)?.branchName || "Branch"}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Date / Month+Year pickers ─────────────────────────── */}
      <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        {tab === "daily" ? (
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={selStyle} />
        ) : (
          <>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}

        {/* Stats pills (daily only) */}
        {tab === "daily" && !loading && (
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <Pill label="Total"   value={stats.total}   color="#0284c7" />
            <Pill label="Present" value={stats.present} color="#059669" />
            <Pill label="Half Day" value={stats.half}   color="#d97706" />
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      {loading ? (
        <LoadingBox />
      ) : tab === "daily" ? (
        <DailyView records={records} isSuperAdmin={isSuperAdmin} onEdit={openEdit} selOrg={selOrg} selBranch={selBranch} />
      ) : (
        <SummaryView summary={summary} isSuperAdmin={isSuperAdmin} month={month} year={year} selOrg={selOrg} selBranch={selBranch} />
      )}

      {/* ── Edit Modal ────────────────────────────────────────── */}
      {editRec && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:"20px", padding:"32px", width:"420px", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <h3 style={{ margin:"0 0 6px", fontSize:"18px", fontWeight:800, color:"#1a1a2e" }}>Edit Attendance</h3>
            <p style={{ margin:"0 0 20px", fontSize:"12px", color:"rgba(26,26,46,.4)" }}>
              {editRec.user?.name} — {editRec.date}
              {editRec.branch?.branchName && ` · ${editRec.branch.branchName}`}
            </p>
            <label style={lbl}>Login Time</label>
            <input type="datetime-local" value={editForm.loginTime} onChange={e => setEditForm(p=>({...p,loginTime:e.target.value}))} style={inp} />
            <label style={lbl}>Logout Time</label>
            <input type="datetime-local" value={editForm.logoutTime} onChange={e => setEditForm(p=>({...p,logoutTime:e.target.value}))} style={inp} />
            <label style={lbl}>Status</label>
            <select value={editForm.status} onChange={e => setEditForm(p=>({...p,status:e.target.value}))} style={inp}>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>
            <label style={lbl}>Note</label>
            <input value={editForm.note} onChange={e => setEditForm(p=>({...p,note:e.target.value}))} placeholder="Optional note…" style={inp} />
            <div style={{ display:"flex", gap:"10px", marginTop:"24px" }}>
              <button onClick={() => setEditRec(null)} style={{ flex:1, padding:"10px", borderRadius:"10px", border:"1px solid rgba(26,26,46,.15)", background:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={{ flex:1, padding:"10px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#7c3aed,#6d28d9)", color:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ── Daily View — grouped by Org → Branch ───────────────────── */
function DailyView({ records, isSuperAdmin, onEdit, selOrg, selBranch }) {
  if (records.length === 0)
    return <EmptyBox text="No records found for this date" />;

  if (!isSuperAdmin || selBranch !== "all") {
    // flat table when already filtered to one branch (or admin)
    return <FlatTable records={records} onEdit={onEdit} showBranch={isSuperAdmin} />;
  }

  // group: org → branch → records
  const grouped = {};
  records.forEach(r => {
    const orgId   = r.organization?._id  || r.organization  || "unknown";
    const orgName = r.organization?.name || "No Organization";
    const brId    = r.branch?._id        || r.branch        || "unknown";
    const brName  = r.branch?.branchName || "No Branch";
    const brCity  = r.branch?.city       || "";

    if (!grouped[orgId]) grouped[orgId] = { orgName, branches: {} };
    if (!grouped[orgId].branches[brId]) grouped[orgId].branches[brId] = { brName, brCity, records: [] };
    grouped[orgId].branches[brId].records.push(r);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {Object.entries(grouped).map(([orgId, { orgName, branches }]) => (
        <OrgSection key={orgId} orgName={orgName} branches={branches} onEdit={onEdit} />
      ))}
    </div>
  );
}

function OrgSection({ orgName, branches, onEdit }) {
  const totalPresent = Object.values(branches).flatMap(b => b.records).filter(r => r.status === "PRESENT").length;
  const totalAll     = Object.values(branches).flatMap(b => b.records).length;

  return (
    <div style={{ background:"#fff", borderRadius:"18px", border:"1px solid rgba(124,58,237,.18)", overflow:"hidden", boxShadow:"0 2px 12px rgba(124,58,237,.06)" }}>
      {/* Org header */}
      <div style={{ padding:"14px 20px", background:"linear-gradient(135deg,rgba(124,58,237,.07),rgba(109,40,217,.04))", borderBottom:"1px solid rgba(124,58,237,.12)", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"linear-gradient(135deg,#7c3aed,#6d28d9)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="15" height="15">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize:"15px", fontWeight:800, color:"#1a1a2e" }}>{orgName}</div>
          <div style={{ fontSize:"11px", color:"rgba(26,26,46,.4)", marginTop:"1px" }}>{Object.keys(branches).length} branch{Object.keys(branches).length !== 1 ? "es" : ""} · {totalPresent}/{totalAll} present</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
          <Pill label="Present"  value={totalPresent}         color="#059669" small />
          <Pill label="Total"    value={totalAll}             color="#0284c7" small />
        </div>
      </div>

      {/* Branches */}
      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:"12px" }}>
        {Object.entries(branches).map(([brId, { brName, brCity, records }]) => (
          <BranchSection key={brId} brName={brName} brCity={brCity} records={records} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function BranchSection({ brName, brCity, records, onEdit }) {
  const [open, setOpen] = useState(true);
  const present = records.filter(r => r.status === "PRESENT").length;
  const half    = records.filter(r => r.status === "HALF_DAY").length;

  return (
    <div style={{ border:"1px solid rgba(2,132,199,.15)", borderRadius:"12px", overflow:"hidden" }}>
      {/* Branch header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding:"10px 16px", background:"rgba(2,132,199,.04)", borderBottom: open ? "1px solid rgba(2,132,199,.1)" : "none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", userSelect:"none" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" width="14" height="14">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21" />
        </svg>
        <span style={{ fontWeight:700, fontSize:"13px", color:"#0284c7" }}>{brName}</span>
        {brCity && <span style={{ fontSize:"11.5px", color:"rgba(26,26,46,.4)" }}>· {brCity}</span>}
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px", alignItems:"center" }}>
          <span style={{ fontSize:"11px", padding:"2px 9px", borderRadius:"20px", background:"rgba(5,150,105,.1)", color:"#059669", fontWeight:700 }}>{present} present</span>
          {half > 0 && <span style={{ fontSize:"11px", padding:"2px 9px", borderRadius:"20px", background:"rgba(245,158,11,.1)", color:"#d97706", fontWeight:700 }}>{half} half day</span>}
          <span style={{ fontSize:"11px", color:"rgba(26,26,46,.35)", marginLeft:"4px" }}>{records.length} total</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.35)" strokeWidth="2" width="14" height="14" style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {open && <FlatTable records={records} onEdit={onEdit} showBranch={false} compact />}
    </div>
  );
}

/* ── Summary View — grouped by Org → Branch ─────────────────── */
function SummaryView({ summary, isSuperAdmin, month, year, selOrg, selBranch }) {
  if (summary.length === 0) return <EmptyBox text="No data for this period" />;

  if (!isSuperAdmin || selBranch !== "all") {
    return <SummaryTable rows={summary} showBranch={isSuperAdmin} month={month} year={year} />;
  }

  const grouped = {};
  summary.forEach(s => {
    const orgId   = s.user.organization?._id  || s.user.organization  || "unknown";
    const orgName = s.user.organization?.name || "No Organization";
    const brId    = s.user.branch?._id        || s.user.branch        || "unknown";
    const brName  = s.user.branch?.branchName || "No Branch";
    const brCity  = s.user.branch?.city       || "";
    if (!grouped[orgId]) grouped[orgId] = { orgName, branches: {} };
    if (!grouped[orgId].branches[brId]) grouped[orgId].branches[brId] = { brName, brCity, rows: [] };
    grouped[orgId].branches[brId].rows.push(s);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      {Object.entries(grouped).map(([orgId, { orgName, branches }]) => {
        const allRows = Object.values(branches).flatMap(b => b.rows);
        const totalPresent = allRows.reduce((a, r) => a + r.present, 0);
        const totalHours   = Math.round(allRows.reduce((a, r) => a + r.totalHours, 0) * 10) / 10;
        return (
          <div key={orgId} style={{ background:"#fff", borderRadius:"18px", border:"1px solid rgba(124,58,237,.18)", overflow:"hidden", boxShadow:"0 2px 12px rgba(124,58,237,.06)" }}>
            {/* Org header */}
            <div style={{ padding:"14px 20px", background:"linear-gradient(135deg,rgba(124,58,237,.07),rgba(109,40,217,.04))", borderBottom:"1px solid rgba(124,58,237,.12)", display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"linear-gradient(135deg,#7c3aed,#6d28d9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="15" height="15">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a1a2e" }}>{orgName}</div>
                <div style={{ fontSize:"11px", color:"rgba(26,26,46,.4)", marginTop:"1px" }}>{MONTHS[month-1]} {year} · {allRows.length} staff</div>
              </div>
              <div style={{ marginLeft:"auto", display:"flex", gap:"8px" }}>
                <Pill label="Present Days" value={totalPresent} color="#059669" small />
                <Pill label="Total Hours"  value={`${totalHours}h`} color="#0284c7" small />
              </div>
            </div>
            {/* Branches */}
            <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:"12px" }}>
              {Object.entries(branches).map(([brId, { brName, brCity, rows }]) => (
                <BranchSummarySection key={brId} brName={brName} brCity={brCity} rows={rows} month={month} year={year} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BranchSummarySection({ brName, brCity, rows, month, year }) {
  const [open, setOpen] = useState(true);
  const totalPresent = rows.reduce((a, r) => a + r.present, 0);
  const totalHours   = Math.round(rows.reduce((a, r) => a + r.totalHours, 0) * 10) / 10;

  return (
    <div style={{ border:"1px solid rgba(2,132,199,.15)", borderRadius:"12px", overflow:"hidden" }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding:"10px 16px", background:"rgba(2,132,199,.04)", borderBottom: open ? "1px solid rgba(2,132,199,.1)" : "none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", userSelect:"none" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" width="14" height="14">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21" />
        </svg>
        <span style={{ fontWeight:700, fontSize:"13px", color:"#0284c7" }}>{brName}</span>
        {brCity && <span style={{ fontSize:"11.5px", color:"rgba(26,26,46,.4)" }}>· {brCity}</span>}
        <div style={{ marginLeft:"auto", display:"flex", gap:"6px", alignItems:"center" }}>
          <span style={{ fontSize:"11px", padding:"2px 9px", borderRadius:"20px", background:"rgba(5,150,105,.1)", color:"#059669", fontWeight:700 }}>{totalPresent} days</span>
          <span style={{ fontSize:"11px", padding:"2px 9px", borderRadius:"20px", background:"rgba(2,132,199,.1)", color:"#0284c7", fontWeight:700 }}>{totalHours}h</span>
          <span style={{ fontSize:"11px", color:"rgba(26,26,46,.35)" }}>{rows.length} staff</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.35)" strokeWidth="2" width="14" height="14" style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      {open && <SummaryTable rows={rows} showBranch={false} month={month} year={year} />}
    </div>
  );
}

/* ── Flat Table (daily records) ─────────────────────────────── */
function FlatTable({ records, onEdit, showBranch, compact }) {
  const cols = ["Employee", showBranch && "Branch", "Login","Logout","Duration","Status",""].filter(Boolean);
  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ background:"rgba(26,26,46,.03)", borderBottom:"1px solid rgba(26,26,46,.07)" }}>
          {cols.map(h => (
            <th key={h} style={{ padding: compact ? "9px 14px" : "12px 16px", textAlign:"left", fontSize:"10px", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(26,26,46,.4)", fontWeight:600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={r._id} style={{ borderBottom:"1px solid rgba(26,26,46,.04)", background: i%2===0 ? "#fff" : "rgba(26,26,46,.008)" }}>
            <td style={{ padding: compact ? "9px 14px" : "12px 16px" }}>
              <div style={{ fontWeight:700, fontSize:"13px", color:"#1a1a2e" }}>{r.user?.name || "—"}</div>
              <div style={{ fontSize:"11px", color:"rgba(26,26,46,.38)", marginTop:"1px" }}>{r.user?.email}</div>
            </td>
            {showBranch && (
              <td style={{ padding: compact ? "9px 14px" : "12px 16px", fontSize:"12px", color:"rgba(26,26,46,.5)" }}>
                {r.branch?.branchName || "—"}
              </td>
            )}
            <td style={{ padding: compact ? "9px 14px" : "12px 16px", fontSize:"13px", color:"#059669", fontWeight:600 }}>{fmt(r.loginTime)}</td>
            <td style={{ padding: compact ? "9px 14px" : "12px 16px", fontSize:"13px", color: r.logoutTime ? "#7c3aed" : "rgba(26,26,46,.3)", fontWeight: r.logoutTime ? 600 : 400 }}>{fmt(r.logoutTime)}</td>
            <td style={{ padding: compact ? "9px 14px" : "12px 16px", fontSize:"13px", color:"#0284c7" }}>{fmtDuration(r.duration)}</td>
            <td style={{ padding: compact ? "9px 14px" : "12px 16px" }}>
              <span style={{ padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:700, background:ST[r.status]?.bg, color:ST[r.status]?.color }}>
                {ST[r.status]?.label || r.status}
              </span>
            </td>
            <td style={{ padding: compact ? "9px 14px" : "12px 16px" }}>
              {onEdit && <button onClick={() => onEdit(r)} style={{ padding:"4px 12px", borderRadius:"7px", border:"1px solid rgba(124,58,237,.25)", background:"rgba(124,58,237,.06)", color:"#7c3aed", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>Edit</button>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Summary Table ───────────────────────────────────────────── */
function SummaryTable({ rows, showBranch, month, year }) {
  const cols = ["Employee", showBranch && "Branch", "Present","Half Day","Total Days","Total Hours"].filter(Boolean);
  return (
    <table style={{ width:"100%", borderCollapse:"collapse" }}>
      <thead>
        <tr style={{ background:"rgba(26,26,46,.03)", borderBottom:"1px solid rgba(26,26,46,.07)" }}>
          {cols.map(h => (
            <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:"10px", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(26,26,46,.4)", fontWeight:600 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((s, i) => (
          <tr key={s.user.id} style={{ borderBottom:"1px solid rgba(26,26,46,.04)", background: i%2===0 ? "#fff" : "rgba(26,26,46,.008)" }}>
            <td style={{ padding:"10px 14px" }}>
              <div style={{ fontWeight:700, fontSize:"13px", color:"#1a1a2e" }}>{s.user.name}</div>
              <div style={{ fontSize:"11px", color:"rgba(26,26,46,.38)", marginTop:"1px" }}>{s.user.email}</div>
            </td>
            {showBranch && (
              <td style={{ padding:"10px 14px", fontSize:"12px", color:"rgba(26,26,46,.5)" }}>{s.user.branch?.branchName || "—"}</td>
            )}
            <td style={{ padding:"10px 14px" }}><span style={{ fontWeight:700, color:"#059669" }}>{s.present}</span></td>
            <td style={{ padding:"10px 14px" }}><span style={{ fontWeight:700, color:"#d97706" }}>{s.halfDay}</span></td>
            <td style={{ padding:"10px 14px", fontWeight:600, color:"#1a1a2e" }}>{s.totalDays}</td>
            <td style={{ padding:"10px 14px", fontWeight:700, color:"#0284c7" }}>{s.totalHours}h</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Small helpers ────────────────────────────────────────────── */
function Pill({ label, value, color, small }) {
  return (
    <div style={{ padding: small ? "4px 10px" : "6px 14px", borderRadius:"10px", background:`${color}18`, border:`1px solid ${color}33`, display:"flex", gap:"6px", alignItems:"center" }}>
      <span style={{ fontSize: small ? "10px" : "11px", color:"rgba(26,26,46,.5)" }}>{label}</span>
      <span style={{ fontSize: small ? "13px" : "14px", fontWeight:800, color }}>{value}</span>
    </div>
  );
}

function EmptyBox({ text }) {
  return (
    <div style={{ padding:"48px", textAlign:"center", background:"#fff", borderRadius:"16px", border:"1px solid rgba(26,26,46,.08)", color:"rgba(26,26,46,.4)", fontSize:"14px" }}>{text}</div>
  );
}

function LoadingBox() {
  return (
    <div style={{ padding:"48px", textAlign:"center", color:"rgba(26,26,46,.4)", fontSize:"14px" }}>
      <div style={{ display:"inline-block", width:"24px", height:"24px", border:"3px solid rgba(124,58,237,.2)", borderTop:"3px solid #7c3aed", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginBottom:"8px" }} />
      <div>Loading…</div>
    </div>
  );
}

const selStyle = { padding:"8px 14px", borderRadius:"10px", border:"1px solid rgba(26,26,46,.15)", fontSize:"13px", background:"#fff", cursor:"pointer" };
const lbl = { display:"block", fontSize:"10px", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", color:"rgba(26,26,46,.5)", marginBottom:"5px", marginTop:"13px" };
const inp = { width:"100%", padding:"9px 12px", borderRadius:"10px", border:"1px solid rgba(26,26,46,.15)", fontSize:"13px", boxSizing:"border-box" };
