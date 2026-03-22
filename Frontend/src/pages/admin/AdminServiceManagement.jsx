import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../services/axiosInstance";
import { getUsers } from "../../services/adminService";
import useAuth from "../../hooks/useAuth";

const C = {
  blue: "#0369a1", blueL: "rgba(3,105,161,.08)", blueB: "rgba(3,105,161,.22)",
  green: "#047857", greenL: "rgba(4,120,87,.08)", greenB: "rgba(4,120,87,.22)",
  red: "#b91c1c", redL: "rgba(185,28,28,.08)", redB: "rgba(185,28,28,.2)",
  amber: "#d97706", amberL: "rgba(245,158,11,.08)", amberB: "rgba(245,158,11,.2)",
  orange: "#ea580c", orangeL: "rgba(234,88,12,.08)",
  ink: "#0f172a", inkSoft: "rgba(15,18,42,.45)", inkFaint: "rgba(15,18,42,.07)",
  teal: "#0f766e", tealL: "rgba(15,118,110,.08)",
};

const STATUS_CFG = {
  SUBMITTED:           { label:"Submitted",           color:"#0284c7", bg:"rgba(2,132,199,.1)",  step:1 },
  ACKNOWLEDGED:        { label:"Acknowledged",        color:"#7c3aed", bg:"rgba(124,58,237,.1)", step:2 },
  TECHNICIAN_ASSIGNED: { label:"Technician Assigned", color:"#d97706", bg:"rgba(245,158,11,.1)", step:3 },
  IN_PROGRESS:         { label:"In Progress",         color:"#ea580c", bg:"rgba(234,88,12,.1)",  step:4 },
  RESOLVED:            { label:"Resolved",            color:"#059669", bg:"rgba(5,150,105,.1)",  step:5 },
  CLOSED:              { label:"Closed",              color:"#047857", bg:"rgba(4,120,87,.1)",   step:6 },
  CANCELLED:           { label:"Cancelled",           color:"#b91c1c", bg:"rgba(185,28,28,.1)",  step:-1 },
};
const PRIORITY_CFG = {
  LOW:    { label:"Low",    color:"#047857", bg:"rgba(4,120,87,.08)"   },
  MEDIUM: { label:"Medium", color:"#d97706", bg:"rgba(245,158,11,.08)" },
  HIGH:   { label:"High",   color:"#ea580c", bg:"rgba(234,88,12,.08)"  },
  URGENT: { label:"Urgent", color:"#b91c1c", bg:"rgba(185,28,28,.08)"  },
};
const W_STATUS = {
  ACTIVE:  { label:"Active",  color:"#047857", bg:"rgba(4,120,87,.1)"  },
  EXPIRED: { label:"Expired", color:"#b91c1c", bg:"rgba(185,28,28,.1)" },
  VOID:    { label:"Void",    color:"rgba(15,18,42,.4)", bg:"rgba(15,18,42,.06)" },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtDT   = d => d ? new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

function Badge({ status, cfg }) {
  const s = cfg[status] || { label: status, color:"#888", bg:"#f0f0f0" };
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:s.bg, color:s.color, whiteSpace:"nowrap" }}>{s.label}</span>;
}

function StaffDropdown({ staffList, loading, selected, onSelect }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedStaff = staffList.find(s => s._id === selected);
  const filtered = staffList.filter(s =>
    (s.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone||"").includes(search) ||
    (s.email||"").toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inp = { width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ ...inp, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", userSelect:"none" }}
      >
        {loading ? (
          <span style={{ color:"rgba(15,18,42,.35)", fontSize:13 }}>Loading staff...</span>
        ) : selectedStaff ? (
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#0369a1,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{selectedStaff.name?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>{selectedStaff.name}</div>
              <div style={{ fontSize:10, color:"rgba(15,18,42,.45)" }}>{selectedStaff.phone || selectedStaff.email}</div>
            </div>
          </div>
        ) : (
          <span style={{ color:"rgba(15,18,42,.35)", fontSize:13 }}>Select staff member...</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(15,18,42,.4)" style={{ flexShrink:0, transform: open?"rotate(180deg)":"none", transition:"transform .15s" }}>
          <path d="M7 10l5 5 5-5H7z"/>
        </svg>
      </div>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#fff", borderRadius:12, border:"1.5px solid rgba(15,18,42,.1)", boxShadow:"0 8px 32px rgba(15,18,42,.12)", zIndex:999, overflow:"hidden", maxHeight:260 }}>
          <div style={{ padding:"10px 10px 6px" }}>
            <input
              autoFocus
              placeholder="Search by name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ ...inp, borderColor:"rgba(3,105,161,.3)", fontSize:12 }}
            />
          </div>
          <div style={{ overflowY:"auto", maxHeight:190 }}>
            {selected && (
              <div
                onClick={() => { onSelect(null); setOpen(false); setSearch(""); }}
                style={{ padding:"9px 14px", cursor:"pointer", fontSize:12, color:"rgba(185,28,28,.8)", fontWeight:600, borderBottom:"1px solid rgba(15,18,42,.05)", display:"flex", alignItems:"center", gap:7 }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(185,28,28,.05)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#b91c1c"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                Clear assignment
              </div>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding:"18px 14px", textAlign:"center", color:"rgba(15,18,42,.35)", fontSize:12 }}>No staff found</div>
            ) : filtered.map(s => (
              <div
                key={s._id}
                onClick={() => { onSelect(s._id); setOpen(false); setSearch(""); }}
                style={{ padding:"10px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, background: selected===s._id ? "rgba(3,105,161,.07)" : "transparent", borderBottom:"1px solid rgba(15,18,42,.04)" }}
                onMouseEnter={e=>{ if(selected!==s._id) e.currentTarget.style.background="rgba(15,18,42,.03)"; }}
                onMouseLeave={e=>{ if(selected!==s._id) e.currentTarget.style.background="transparent"; }}
              >
                <div style={{ width:30, height:30, borderRadius:"50%", background:`linear-gradient(135deg,#0369a1,#0284c7)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 6px rgba(3,105,161,.25)" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{s.name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", display:"flex", alignItems:"center", gap:6 }}>
                    {s.name}
                    {selected===s._id && <svg width="12" height="12" viewBox="0 0 24 24" fill="#059669"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>}
                  </div>
                  <div style={{ fontSize:11, color:"rgba(15,18,42,.45)", display:"flex", gap:8, marginTop:1 }}>
                    {s.phone && <span>{s.phone}</span>}
                    {s.email && <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{s.email}</span>}
                  </div>
                </div>
                <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:"rgba(5,150,105,.1)", color:"#059669", whiteSpace:"nowrap" }}>STAFF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineUpdatePanel({ request, onClose, onSaved }) {
  const [status, setStatus]       = useState(request.status);
  const [note, setNote]           = useState("");
  const [assignedId, setAssignedId] = useState(null); // resolved after staff loads
  const [resolution, setRes]      = useState(request.resolutionNote || "");
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  // Derive the raw value from request — could be an object {_id,name}, a plain _id string, or a name string
  const rawAssigned = request.assignedTo?._id || request.assignedToId || request.assignedTo || null;

  useEffect(() => {
    const fetchStaff = async () => {
      setStaffLoading(true);
      try {
        const res = await getUsers({ role: "STAFF", limit: 200 });
        const list = Array.isArray(res) ? res : (res?.data || []);
        setStaffList(list);

        // Once staff is loaded, resolve the assignedId:
        // 1. Try direct _id match
        // 2. Fall back to name match (when backend stored name string)
        if (rawAssigned) {
          const byId   = list.find(s => s._id === rawAssigned);
          const byName = list.find(s => s.name?.toLowerCase() === (rawAssigned?.name || rawAssigned)?.toLowerCase?.());
          const match  = byId || byName;
          if (match) setAssignedId(match._id);
        }
      } catch { setStaffList([]); }
      finally { setStaffLoading(false); }
    };
    fetchStaff();
  }, []); // eslint-disable-line

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const selectedStaff = staffList.find(s => s._id === assignedId);
      await axiosInstance.patch(`/service/requests/update/${request._id}`, {
        status,
        note,
        assignedTo: selectedStaff?.name || "",
        assignedToId: assignedId || null,
        resolutionNote: resolution
      });
      onSaved();
    } catch(e) { setErr(e?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const inp = { width:"100%", padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const selectedStaff = staffList.find(s => s._id === assignedId);

  return (
    <tr>
      <td colSpan={9} style={{ padding:"0 16px 16px", background:"rgba(3,105,161,.03)", borderBottom:"2px solid rgba(3,105,161,.15)" }}>
        <div style={{ padding:"18px", background:"#fff", borderRadius:14, border:"1.5px solid rgba(3,105,161,.15)", marginTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ fontWeight:800, fontSize:14, color:C.ink }}>Update: {request.ticketNo}</span>
            <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.inkSoft, fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              Close
            </button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>New Status</label>
              <select value={status} onChange={e=>setStatus(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
                {Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>
                Assign Technician / Staff
                {staffList.length > 0 && <span style={{ marginLeft:6, fontSize:9, fontWeight:600, padding:"1px 6px", borderRadius:99, background:"rgba(5,150,105,.1)", color:"#059669" }}>{staffList.length} available</span>}
              </label>
              <StaffDropdown staffList={staffList} loading={staffLoading} selected={assignedId} onSelect={setAssignedId}/>
            </div>
          </div>

          {/* Selected staff preview card */}
          {selectedStaff && (
            <div style={{ marginBottom:12, padding:"11px 14px", background:"rgba(3,105,161,.05)", borderRadius:10, border:"1px solid rgba(3,105,161,.15)", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#0369a1,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 3px 10px rgba(3,105,161,.3)" }}>
                <span style={{ fontSize:15, fontWeight:800, color:"#fff" }}>{selectedStaff.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>
                  {selectedStaff.name}
                  <span style={{ marginLeft:8, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99, background:"rgba(5,150,105,.12)", color:"#059669" }}>ASSIGNED</span>
                </div>
                <div style={{ fontSize:11, color:C.inkSoft, marginTop:2, display:"flex", gap:12 }}>
                  {selectedStaff.phone && <span>📞 {selectedStaff.phone}</span>}
                  {selectedStaff.email && <span>✉ {selectedStaff.email}</span>}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Status Note</label>
              <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Note visible in customer activity log" style={{ ...inp, resize:"vertical" }}/>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Resolution Note</label>
              <textarea value={resolution} onChange={e=>setRes(e.target.value)} rows={2} placeholder="What action was taken?" style={{ ...inp, resize:"vertical" }}/>
            </div>
          </div>

          {err && <div style={{ marginBottom:10, color:C.red, fontSize:12, background:C.redL, padding:"8px 12px", borderRadius:8 }}>{err}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onClose} style={{ padding:"9px 18px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", background:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", color:C.ink }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:"9px 22px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.blue},#075985)`, color:"#fff", fontSize:13, fontWeight:800, cursor:saving?"not-allowed":"pointer" }}>
              {saving ? "Saving..." : "Save Update"}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function AdminServiceManagement() {
  const [tab, setTab]             = useState("requests");
  const [requests, setRequests]   = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpanded] = useState(null);
  const [srqFilter, setSrqFilter] = useState({ status:"all", priority:"all", search:"" });
  const [wFilter, setWFilter]     = useState({ status:"all", search:"" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, wRes] = await Promise.all([
        axiosInstance.get("/service/requests/all"),
        axiosInstance.get("/service/warranty/all"),
      ]);
      setRequests(Array.isArray(rRes.data) ? rRes.data : []);
      setWarranties(Array.isArray(wRes.data) ? wRes.data : []);
    } catch { setRequests([]); setWarranties([]); }
    finally { setLoading(false); }
  };

  const stats = {
    open:     requests.filter(r => !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    urgent:   requests.filter(r => r.priority==="URGENT" && !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    resolved: requests.filter(r => ["RESOLVED","CLOSED"].includes(r.status)).length,
    activeW:  warranties.filter(w => w.status==="ACTIVE").length,
  };

  const filteredRequests = requests.filter(r => {
    const s = (r.ticketNo||"").toLowerCase() + (r.productName||"").toLowerCase() + (r.contactName||"").toLowerCase();
    return (srqFilter.status==="all" || r.status===srqFilter.status)
      && (srqFilter.priority==="all" || r.priority===srqFilter.priority)
      && s.includes(srqFilter.search.toLowerCase());
  });
  const filteredWarranties = warranties.filter(w => {
    const s = (w.productName||"").toLowerCase() + (w.serialNumber||"") + (w.customer?.name||"").toLowerCase();
    return (wFilter.status==="all" || w.status===wFilter.status)
      && s.includes(wFilter.search.toLowerCase());
  });

  const inp  = { padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.1)", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff" };
  const cell = { padding:"13px 16px", fontSize:13, color:C.ink, borderBottom:"1px solid rgba(15,18,42,.05)", verticalAlign:"middle" };

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", animation:"fadeUp .35s ease both" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:C.ink, margin:0, letterSpacing:"-.05em" }}>Service Management</h1>
          <p style={{ fontSize:13, color:C.inkSoft, margin:"4px 0 0" }}>Manage service requests and warranties for your branch</p>
        </div>
        <button onClick={fetchAll} style={{ padding:"9px 16px", borderRadius:10, border:`1.5px solid ${C.blueB}`, background:C.blueL, color:C.blue, fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.blue} strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:22 }}>
        {[
          { label:"Open Requests", value:stats.open,     color:C.blue,  bg:C.blueL,  border:"rgba(3,105,161,.2)", icon:"M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label:"Urgent",        value:stats.urgent,   color:C.red,   bg:C.redL,   border:C.redB, icon:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
          { label:"Resolved",      value:stats.resolved, color:C.green, bg:C.greenL, border:C.greenB, icon:"M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label:"Active Warranties", value:stats.activeW, color:C.teal, bg:C.tealL, border:"rgba(15,118,110,.2)", icon:"M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623" },
        ].map(k => (
          <div key={k.label} style={{ flex:"1 1 150px", background:"#fff", borderRadius:14, border:`1.5px solid ${k.border}`, padding:"16px 18px", boxShadow:"0 2px 10px rgba(15,18,42,.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:k.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={k.color} strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d={k.icon}/></svg>
              </div>
              <span style={{ fontSize:11.5, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em" }}>{k.label}</span>
            </div>
            <div style={{ fontSize:26, fontWeight:900, color:k.color, letterSpacing:"-.04em" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"rgba(15,18,42,.04)", borderRadius:11, padding:4, width:"fit-content", marginBottom:18 }}>
        {[["requests","Service Requests"],["warranties","Warranties"]].map(([key,label]) => (
          <button key={key} onClick={()=>{setTab(key);setExpanded(null);}} style={{ padding:"7px 18px", borderRadius:8, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", background:tab===key?"#fff":"transparent", color:tab===key?C.blue:C.inkSoft, boxShadow:tab===key?"0 1px 5px rgba(15,18,42,.1)":"none", transition:"all .15s" }}>{label}</button>
        ))}
      </div>

      {/* ══ SERVICE REQUESTS TABLE ══ */}
      {tab === "requests" && (
        <div style={{ background:"#fff", borderRadius:18, border:"1px solid rgba(15,18,42,.07)", overflow:"hidden", boxShadow:"0 2px 14px rgba(15,18,42,.04)" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(15,18,42,.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input placeholder="Search ticket, product, customer..." value={srqFilter.search} onChange={e=>setSrqFilter(f=>({...f,search:e.target.value}))} style={{ ...inp, flex:"1 1 200px", minWidth:0 }}/>
            <select value={srqFilter.status}   onChange={e=>setSrqFilter(f=>({...f,status:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Status</option>
              {Object.keys(STATUS_CFG).map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <select value={srqFilter.priority} onChange={e=>setSrqFilter(f=>({...f,priority:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Priority</option>
              {["LOW","MEDIUM","HIGH","URGENT"].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {loading ? <div style={{ textAlign:"center", padding:50, color:C.inkSoft }}>Loading requests...</div> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(15,18,42,.025)" }}>
                    {["Ticket","Customer","Product / S.N.","Issue","Priority","Status","Technician","Date","Action"].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:C.inkSoft }}>No requests found</td></tr>
                  ) : filteredRequests.map(r => [
                    <tr key={r._id} style={{ transition:"background .12s", background: expandedId===r._id?"rgba(3,105,161,.03)":"transparent" }}
                      onMouseEnter={e=>{ if(expandedId!==r._id) e.currentTarget.style.background="rgba(15,18,42,.02)"; }}
                      onMouseLeave={e=>{ if(expandedId!==r._id) e.currentTarget.style.background="transparent"; }}>
                      <td style={cell}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, color:C.blue }}>{r.ticketNo}</span></td>
                      <td style={cell}><div style={{ fontWeight:600, fontSize:13 }}>{r.contactName}</div><div style={{ fontSize:11, color:C.inkSoft }}>{r.contactPhone}</div></td>
                      <td style={cell}><div style={{ fontWeight:600 }}>{r.productName}</div>{r.serialNumber&&<div style={{ fontSize:11, color:C.inkSoft, fontFamily:"'DM Mono',monospace" }}>{r.serialNumber}</div>}</td>
                      <td style={cell}><span style={{ fontSize:12 }}>{(r.issueType||"").replace(/_/g," ")}</span></td>
                      <td style={cell}><Badge status={r.priority} cfg={PRIORITY_CFG}/></td>
                      <td style={cell}><Badge status={r.status}   cfg={STATUS_CFG}/></td>
                      <td style={cell}>
                        {r.assignedTo ? (
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#0369a1,#0284c7)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 6px rgba(3,105,161,.2)" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{(r.assignedTo?.name||r.assignedTo||"?").charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:C.ink }}>{r.assignedTo?.name||r.assignedTo}</div>
                              {r.assignedTo?.phone && <div style={{ fontSize:10, color:C.inkSoft }}>{r.assignedTo.phone}</div>}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize:12, color:C.inkSoft, fontStyle:"italic" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={cell}><span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:C.inkSoft }}>{fmtDate(r.createdAt)}</span></td>
                      <td style={cell}>
                        <button onClick={()=>setExpanded(expandedId===r._id?null:r._id)} style={{ padding:"5px 12px", borderRadius:8, border:`1.5px solid ${expandedId===r._id?"rgba(15,18,42,.15)":C.blueB}`, background:expandedId===r._id?"rgba(15,18,42,.06)":C.blueL, color:expandedId===r._id?C.inkSoft:C.blue, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          {expandedId===r._id ? "Close" : "Update"}
                        </button>
                      </td>
                    </tr>,
                    expandedId===r._id && <InlineUpdatePanel key={`edit-${r._id}`} request={r} onClose={()=>setExpanded(null)} onSaved={()=>{ setExpanded(null); fetchAll(); }}/>
                  ])}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ WARRANTIES TABLE ══ */}
      {tab === "warranties" && (
        <div style={{ background:"#fff", borderRadius:18, border:"1px solid rgba(15,18,42,.07)", overflow:"hidden", boxShadow:"0 2px 14px rgba(15,18,42,.04)" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(15,18,42,.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input placeholder="Search product, serial, customer..." value={wFilter.search} onChange={e=>setWFilter(f=>({...f,search:e.target.value}))} style={{ ...inp, flex:"1 1 200px", minWidth:0 }}/>
            <select value={wFilter.status} onChange={e=>setWFilter(f=>({...f,status:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Status</option>
              {Object.keys(W_STATUS).map(s=><option key={s} value={s}>{W_STATUS[s].label}</option>)}
            </select>
          </div>
          {loading ? <div style={{ textAlign:"center", padding:50, color:C.inkSoft }}>Loading warranties...</div> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(15,18,42,.025)" }}>
                    {["Customer","Product","Serial No.","Purchase Date","Expiry","Period","Status"].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:C.inkSoft }}>No warranties found</td></tr>
                  ) : filteredWarranties.map(w => (
                    <tr key={w._id} style={{ transition:"background .12s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(15,18,42,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={cell}><div style={{ fontWeight:600 }}>{w.customer?.name||"—"}</div><div style={{ fontSize:11, color:C.inkSoft }}>{w.customer?.phone}</div></td>
                      <td style={cell}><span style={{ fontWeight:600 }}>{w.productName}</span></td>
                      <td style={cell}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>{w.serialNumber}</span></td>
                      <td style={cell}><span style={{ fontSize:12 }}>{fmtDate(w.purchaseDate)}</span></td>
                      <td style={cell}>
                        <span style={{ fontSize:12, color:w.status==="EXPIRED"?C.red:C.ink }}>{fmtDate(w.expiryDate)}</span>
                        {w.daysLeft>0 && w.status==="ACTIVE" && w.daysLeft<=30 && <div style={{ fontSize:10, color:C.amber, fontWeight:700 }}>⚠ {w.daysLeft}d left</div>}
                      </td>
                      <td style={cell}><span style={{ fontSize:12 }}>{w.warrantyYears}yr</span></td>
                      <td style={cell}><Badge status={w.status} cfg={W_STATUS}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
