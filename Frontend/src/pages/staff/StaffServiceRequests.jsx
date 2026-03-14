import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

const C = {
  green: "#047857", greenL: "rgba(4,120,87,.08)", greenB: "rgba(4,120,87,.22)",
  blue: "#0369a1", blueL: "rgba(3,105,161,.08)", blueB: "rgba(3,105,161,.22)",
  red: "#b91c1c", redL: "rgba(185,28,28,.08)", redB: "rgba(185,28,28,.2)",
  amber: "#d97706", amberL: "rgba(245,158,11,.08)",
  orange: "#ea580c", orangeL: "rgba(234,88,12,.08)",
  ink: "#0f172a", inkSoft: "rgba(15,18,42,.45)", inkFaint: "rgba(15,18,42,.07)",
};
const STATUS_CFG = {
  SUBMITTED:           { label:"Submitted",           color:"#0284c7", bg:"rgba(2,132,199,.1)" },
  ACKNOWLEDGED:        { label:"Acknowledged",        color:"#7c3aed", bg:"rgba(124,58,237,.1)" },
  TECHNICIAN_ASSIGNED: { label:"Assigned to Me",      color:"#d97706", bg:"rgba(245,158,11,.1)" },
  IN_PROGRESS:         { label:"In Progress",         color:"#ea580c", bg:"rgba(234,88,12,.1)" },
  RESOLVED:            { label:"Resolved",            color:"#059669", bg:"rgba(5,150,105,.1)" },
  CLOSED:              { label:"Closed",              color:"#047857", bg:"rgba(4,120,87,.1)" },
  CANCELLED:           { label:"Cancelled",           color:"#b91c1c", bg:"rgba(185,28,28,.1)" },
};
const PRIORITY_CFG = {
  LOW:    { label:"Low",    color:"#047857", bg:"rgba(4,120,87,.08)"   },
  MEDIUM: { label:"Medium", color:"#d97706", bg:"rgba(245,158,11,.08)" },
  HIGH:   { label:"High",   color:"#ea580c", bg:"rgba(234,88,12,.08)"  },
  URGENT: { label:"Urgent", color:"#b91c1c", bg:"rgba(185,28,28,.08)"  },
};
const NEXT_STATUS = {
  SUBMITTED:           "ACKNOWLEDGED",
  ACKNOWLEDGED:        "IN_PROGRESS",
  TECHNICIAN_ASSIGNED: "IN_PROGRESS",
  IN_PROGRESS:         "RESOLVED",
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";

function Badge({ status, cfg }) {
  const s = cfg[status] || { label:status, color:"#888", bg:"#f0f0f0" };
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:s.bg, color:s.color, whiteSpace:"nowrap" }}>{s.label}</span>;
}

function RequestCard({ request, onUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote]         = useState("");
  const [resolution, setRes]    = useState(request.resolutionNote || "");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const nextStatus = NEXT_STATUS[request.status];
  const canAct     = !!nextStatus;
  const isUrgent   = request.priority === "URGENT";
  const pr         = PRIORITY_CFG[request.priority] || PRIORITY_CFG.MEDIUM;
  const st         = STATUS_CFG[request.status]     || STATUS_CFG.SUBMITTED;

  const update = async (statusOverride) => {
    setSaving(true); setErr("");
    try {
      await axiosInstance.patch(`/service/requests/update/${request._id}`, {
        status: statusOverride || nextStatus,
        note: note.trim(),
        resolutionNote: resolution.trim(),
      });
      onUpdated();
    } catch(e) { setErr(e?.response?.data?.message || "Failed to update"); setSaving(false); }
  };

  const inp = { width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ background:"#fff", borderRadius:16, border:`1.5px solid ${isUrgent?"rgba(185,28,28,.25)":"rgba(15,18,42,.08)"}`, boxShadow:isUrgent?"0 0 0 3px rgba(185,28,28,.06)":"0 2px 12px rgba(15,18,42,.04)", overflow:"hidden", transition:"all .2s" }}>
      {/* Card Header */}
      <div style={{ padding:"16px 18px", display:"flex", alignItems:"flex-start", gap:14 }}>
        {/* Priority indicator */}
        <div style={{ width:4, alignSelf:"stretch", borderRadius:4, background:pr.color, flexShrink:0 }}/>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:C.blue }}>{request.ticketNo}</span>
              {isUrgent && <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:99, background:C.redL, color:C.red }}>URGENT</span>}
              {(request.assignedTo || request.assignedToId) && (
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"rgba(4,120,87,.1)", color:"#047857" }}>
                  ASSIGNED TO YOU
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <Badge status={request.priority} cfg={PRIORITY_CFG}/>
              <Badge status={request.status}   cfg={STATUS_CFG}/>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"8px 16px", marginBottom:10 }}>
            <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Product</span><div style={{ fontSize:13, fontWeight:700, color:C.ink, marginTop:2 }}>{request.productName}</div></div>
            {request.serialNumber && <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Serial</span><div style={{ fontSize:13, fontFamily:"'DM Mono',monospace", marginTop:2 }}>{request.serialNumber}</div></div>}
            <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Customer</span><div style={{ fontSize:13, fontWeight:600, marginTop:2 }}>{request.contactName}</div></div>
            <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Phone</span><div style={{ fontSize:13, marginTop:2 }}>{request.contactPhone}</div></div>
            <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Issue Type</span><div style={{ fontSize:13, marginTop:2 }}>{(request.issueType||"").replace(/_/g," ")}</div></div>
            <div><span style={{ fontSize:11, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", fontWeight:700 }}>Submitted</span><div style={{ fontSize:13, marginTop:2 }}>{fmtDate(request.createdAt)}</div></div>
          </div>

          <div style={{ padding:"10px 12px", borderRadius:9, background:"rgba(15,18,42,.03)", border:"1px solid rgba(15,18,42,.06)", marginBottom:10, fontSize:13, color:C.ink, lineHeight:1.55 }}>
            <span style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em" }}>Issue: </span>
            {request.issueDescription}
          </div>

          {request.contactAddress && (
            <div style={{ fontSize:12, color:C.inkSoft, marginBottom:10 }}>📍 {request.contactAddress}</div>
          )}
          {request.preferredDate && (
            <div style={{ fontSize:12, color:C.amber, fontWeight:600, marginBottom:10 }}>📅 Preferred: {fmtDate(request.preferredDate)}</div>
          )}

          {/* Action row */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {canAct && (
              <button onClick={()=>setExpanded(!expanded)} style={{ padding:"8px 16px", borderRadius:9, border:`1.5px solid ${C.greenB}`, background:C.greenL, color:C.green, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {expanded ? "▲ Hide Update" : `▼ Update → ${STATUS_CFG[nextStatus]?.label}`}
              </button>
            )}
            {request.status === "IN_PROGRESS" && (
              <button onClick={()=>{ setExpanded(true); }} style={{ padding:"8px 16px", borderRadius:9, border:`1.5px solid ${C.greenB}`, background:C.greenL, color:C.green, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                ✓ Mark Resolved
              </button>
            )}
            {["RESOLVED","CLOSED","CANCELLED"].includes(request.status) && (
              <span style={{ fontSize:12, color:C.inkSoft, fontStyle:"italic" }}>This request is {request.status.toLowerCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Expand: Update Panel */}
      {expanded && canAct && (
        <div style={{ padding:"16px 18px", borderTop:"1px solid rgba(15,18,42,.07)", background:"rgba(15,18,42,.015)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Update Note</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="What did you do? Customer will see this." style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Resolution Note</label>
              <textarea value={resolution} onChange={e=>setRes(e.target.value)} rows={2} placeholder="How was the issue resolved?" style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>
          {err && <div style={{ marginBottom:10, color:C.red, fontSize:12, background:C.redL, padding:"8px 12px", borderRadius:8 }}>{err}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>setExpanded(false)} style={{ padding:"8px 16px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", color:C.ink }}>Cancel</button>
            <button onClick={()=>update(nextStatus)} disabled={saving} style={{ padding:"8px 20px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.green},#065f46)`, color:"#fff", fontSize:13, fontWeight:800, cursor:saving?"not-allowed":"pointer" }}>
              {saving ? "Updating..." : `Mark as ${STATUS_CFG[nextStatus]?.label}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffServiceRequests() {
  const { user }        = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ status:"active", search:"" });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch all requests visible to staff — then filter client-side by assignment
      const res = await axiosInstance.get("/service/requests/all");
      const all = Array.isArray(res.data) ? res.data : [];
      setRequests(all);
    } catch {
      // Fallback to /service/requests if /all is not accessible
      try {
        const res2 = await axiosInstance.get("/service/requests");
        setRequests(Array.isArray(res2.data) ? res2.data : []);
      } catch { setRequests([]); }
    }
    finally { setLoading(false); }
  };

  const myId   = user?._id || "";
  const myName = (user?.name || "").toLowerCase().trim();

  // Check if a request is assigned to the current staff member
  // Handles: assignedToId (_id match), assignedTo as object {_id,name}, or assignedTo as name string
  const isAssignedToMe = (r) => {
    if (!myId && !myName) return false;
    if (myId) {
      if (r.assignedToId && r.assignedToId === myId) return true;
      if (r.assignedTo?._id && r.assignedTo._id === myId) return true;
    }
    if (myName) {
      const assignedName = (r.assignedTo?.name || r.assignedTo || "").toLowerCase().trim();
      if (assignedName && assignedName === myName) return true;
    }
    return false;
  };

  // Staff should only see requests assigned to them + unassigned open ones
  const myRequests = requests.filter(r => isAssignedToMe(r));
  const openUnassigned = requests.filter(r =>
    !r.assignedTo && !r.assignedToId &&
    !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)
  );
  const visibleRequests = [
    ...myRequests,
    ...openUnassigned.filter(r => !myRequests.find(m => m._id === r._id)),
  ];

  const filtered = visibleRequests.filter(r => {
    const isActive = !["RESOLVED","CLOSED","CANCELLED"].includes(r.status);
    const matchStatus = filter.status === "all"
      ? true
      : filter.status === "active"
      ? isActive
      : filter.status === "mine"
      ? isAssignedToMe(r)
      : r.status === filter.status;
    const s = (r.ticketNo||"").toLowerCase() + (r.productName||"").toLowerCase() + (r.contactName||"").toLowerCase();
    return matchStatus && s.includes(filter.search.toLowerCase());
  });

  // Sort: assigned-to-me first, then urgent, then by date
  const sorted = [...filtered].sort((a,b) => {
    const aIsmine = isAssignedToMe(a) ? 0 : 1;
    const bIsmine = isAssignedToMe(b) ? 0 : 1;
    if (aIsmine !== bIsmine) return aIsmine - bIsmine;
    const urgA = a.priority==="URGENT" ? 0 : a.priority==="HIGH" ? 1 : 2;
    const urgB = b.priority==="URGENT" ? 0 : b.priority==="HIGH" ? 1 : 2;
    if (urgA !== urgB) return urgA - urgB;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const stats = {
    open:     visibleRequests.filter(r => !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    mine:     myRequests.length,
    urgent:   myRequests.filter(r => r.priority==="URGENT" && !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    resolved: myRequests.filter(r => ["RESOLVED","CLOSED"].includes(r.status)).length,
  };

  const inp = { padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.1)", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff" };

  return (
    <div style={{ fontFamily:"'Figtree',sans-serif", animation:"fadeUp .35s ease both" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:C.ink, margin:0, letterSpacing:"-.05em" }}>My Service Requests</h1>
          <p style={{ fontSize:13, color:C.inkSoft, margin:"4px 0 0" }}>View and update service requests — urgent items shown first</p>
        </div>
        <button onClick={fetchRequests} style={{ padding:"9px 16px", borderRadius:10, border:`1.5px solid ${C.greenB}`, background:C.greenL, color:C.green, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.green} strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:22 }}>
        {[
          { label:"Open Requests", value:stats.open,     color:C.blue,  bg:C.blueL,  border:"rgba(3,105,161,.2)" },
          { label:"Assigned to Me", value:stats.mine,    color:C.green, bg:C.greenL, border:C.greenB },
          { label:"Urgent",         value:stats.urgent,  color:C.red,   bg:C.redL,   border:C.redB },
          { label:"Resolved",       value:stats.resolved, color:"#0f766e", bg:"rgba(15,118,110,.08)", border:"rgba(15,118,110,.2)" },
        ].map(k => (
          <div key={k.label} style={{ flex:"1 1 130px", background:"#fff", borderRadius:13, border:`1.5px solid ${k.border}`, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", marginBottom:7 }}>{k.label}</div>
            <div style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, alignItems:"center" }}>
        <input placeholder="Search ticket, product, customer..." value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))} style={{ ...inp, flex:"1 1 220px", minWidth:0 }}/>
        {[
          ["active","Active"],
          ["mine","Assigned to Me"],
          ["URGENT","Urgent Only"],
          ["all","All"],
        ].map(([val,label]) => (
          <button key={val} onClick={()=>setFilter(f=>({...f,status:val}))}
            style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${filter.status===val?C.greenB:"rgba(15,18,42,.1)"}`, background:filter.status===val?C.greenL:"#fff", color:filter.status===val?C.green:C.inkSoft, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {label}
          </button>
        ))}
        <span style={{ fontSize:12, color:C.inkSoft, fontFamily:"'DM Mono',monospace" }}>{sorted.length} shown</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.inkSoft }}>Loading service requests...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, background:"#fff", borderRadius:18, border:"1px solid rgba(15,18,42,.07)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:6 }}>All clear!</div>
          <div style={{ fontSize:13, color:C.inkSoft }}>No service requests match your filter.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {sorted.map(r => <RequestCard key={r._id} request={r} onUpdated={fetchRequests}/>)}
        </div>
      )}
    </div>
  );
}
