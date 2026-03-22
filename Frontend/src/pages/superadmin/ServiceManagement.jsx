import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";

/* ── design tokens (match SuperAdmin purple theme) ── */
const C = {
  purple: "#6d28d9", purpleL: "rgba(109,40,217,.08)", purpleB: "rgba(109,40,217,.22)",
  blue:   "#0369a1", blueL:   "rgba(3,105,161,.08)",
  green:  "#047857", greenL:  "rgba(4,120,87,.08)",   greenB:  "rgba(4,120,87,.22)",
  red:    "#b91c1c", redL:    "rgba(185,28,28,.08)",   redB:    "rgba(185,28,28,.2)",
  amber:  "#92400e", amberL:  "rgba(146,64,14,.08)",   amberB:  "rgba(146,64,14,.2)",
  teal:   "#0f766e", tealL:   "rgba(15,118,110,.08)",
  ink:    "#0f172a", inkSoft: "rgba(15,18,42,.45)",    inkFaint:"rgba(15,18,42,.07)",
};

const STATUS_CFG = {
  SUBMITTED:           { label:"Submitted",           color:"#0284c7", bg:"rgba(2,132,199,.1)",   step:1 },
  ACKNOWLEDGED:        { label:"Acknowledged",        color:"#7c3aed", bg:"rgba(124,58,237,.1)",  step:2 },
  TECHNICIAN_ASSIGNED: { label:"Technician Assigned", color:"#d97706", bg:"rgba(245,158,11,.1)",  step:3 },
  IN_PROGRESS:         { label:"In Progress",         color:"#ea580c", bg:"rgba(234,88,12,.1)",   step:4 },
  RESOLVED:            { label:"Resolved",            color:"#059669", bg:"rgba(5,150,105,.1)",   step:5 },
  CLOSED:              { label:"Closed",              color:"#047857", bg:"rgba(4,120,87,.1)",    step:6 },
  CANCELLED:           { label:"Cancelled",           color:"#b91c1c", bg:"rgba(185,28,28,.1)",   step:-1 },
};
const W_STATUS = {
  ACTIVE:  { label:"Active",  color:"#047857", bg:"rgba(4,120,87,.1)"   },
  EXPIRED: { label:"Expired", color:"#b91c1c", bg:"rgba(185,28,28,.1)"  },
  VOID:    { label:"Void",    color:"rgba(15,18,42,.4)", bg:"rgba(15,18,42,.06)" },
};
const PRIORITY_CFG = {
  LOW:    { label:"Low",    color:"#047857", bg:"rgba(4,120,87,.08)"   },
  MEDIUM: { label:"Medium", color:"#d97706", bg:"rgba(245,158,11,.08)" },
  HIGH:   { label:"High",   color:"#ea580c", bg:"rgba(234,88,12,.08)"  },
  URGENT: { label:"Urgent", color:"#b91c1c", bg:"rgba(185,28,28,.08)"  },
};

const ALL_SRQ_STATUSES = Object.keys(STATUS_CFG);
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const fmtDT   = d => d ? new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

function KpiCard({ label, value, color, bg, border, icon }) {
  return (
    <div style={{ flex:"1 1 160px", background:"#fff", borderRadius:16, border:`1.5px solid ${border||"rgba(15,18,42,.08)"}`, padding:"18px 20px", boxShadow:"0 2px 12px rgba(15,18,42,.04)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d={icon}/></svg>
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em" }}>{label}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:900, color, letterSpacing:"-.04em" }}>{value ?? "—"}</div>
    </div>
  );
}

function Badge({ status, cfg }) {
  const s = cfg[status] || Object.values(cfg)[0];
  return <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99, background:s.bg, color:s.color, whiteSpace:"nowrap" }}>{s.label}</span>;
}

function StatusUpdateModal({ request, onClose, onSaved }) {
  const [status, setStatus]   = useState(request.status);
  const [note, setNote]       = useState("");
  const [assigned, setAssigned] = useState(request.assignedTo || "");
  const [resolution, setRes]  = useState(request.resolutionNote || "");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      await axiosInstance.patch(`/service/requests/update/${request._id}`, { status, note, assignedTo: assigned, resolutionNote: resolution });
      onSaved();
    } catch(e) { setErr(e?.response?.data?.message || "Failed to update"); }
    finally { setSaving(false); }
  };

  const inp = { width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,18,42,.5)", zIndex:500 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:500, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", background:"#fff", borderRadius:20, zIndex:501, padding:26, boxShadow:"0 24px 80px rgba(15,18,42,.22)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:C.ink }}>{request.ticketNo} — Update Status</h3>
          <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer" }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(15,18,42,.4)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>New Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
              {ALL_SRQ_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>Assign Technician</label>
            <input value={assigned} onChange={e=>setAssigned(e.target.value)} placeholder="Technician name" style={inp}/>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>Status Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} placeholder="Optional note visible in customer activity log" style={{ ...inp, resize:"vertical" }}/>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>Resolution Note</label>
            <textarea value={resolution} onChange={e=>setRes(e.target.value)} rows={2} placeholder="What was done to resolve the issue?" style={{ ...inp, resize:"vertical" }}/>
          </div>
        </div>
        {err && <div style={{ marginTop:12, color:C.red, fontSize:13, background:C.redL, padding:"10px 14px", borderRadius:9 }}>{err}</div>}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:11, border:"1.5px solid rgba(15,18,42,.12)", background:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:12, borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.purple},#5b21b6)`, color:"#fff", fontWeight:800, fontSize:13, cursor:saving?"not-allowed":"pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

function WarrantyUpdateModal({ warranty, onClose, onSaved }) {
  const [status, setStatus] = useState(warranty.status);
  const [notes, setNotes]   = useState(warranty.notes || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  const save = async () => {
    setSaving(true); setErr("");
    try {
      await axiosInstance.patch(`/service/warranty/update/${warranty._id}`, { status, notes });
      onSaved();
    } catch(e) { setErr(e?.response?.data?.message || "Failed to update"); }
    finally { setSaving(false); }
  };
  const inp = { width:"100%", padding:"10px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.12)", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,18,42,.5)", zIndex:500 }}/>
      <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:440, maxWidth:"95vw", background:"#fff", borderRadius:20, zIndex:501, padding:26, boxShadow:"0 24px 80px rgba(15,18,42,.22)" }}>
        <h3 style={{ margin:"0 0 18px", fontSize:17, fontWeight:800, color:C.ink }}>Update Warranty</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ ...inp, cursor:"pointer" }}>
              {Object.keys(W_STATUS).map(s => <option key={s} value={s}>{W_STATUS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:6 }}>Admin Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{ ...inp, resize:"vertical" }} placeholder="Internal notes..."/>
          </div>
        </div>
        {err && <div style={{ marginTop:12, color:C.red, fontSize:13, background:C.redL, padding:"10px 14px", borderRadius:9 }}>{err}</div>}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:11, border:"1.5px solid rgba(15,18,42,.12)", background:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:2, padding:12, borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.purple},#5b21b6)`, color:"#fff", fontWeight:800, fontSize:13, cursor:saving?"not-allowed":"pointer" }}>
            {saving ? "Saving..." : "Update Warranty"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function ServiceManagement() {
  const [tab, setTab]             = useState("requests"); // "requests" | "warranties"
  const [requests, setRequests]   = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [srqFilter, setSrqFilter] = useState({ status:"all", priority:"all", search:"" });
  const [wFilter, setWFilter]     = useState({ status:"all", search:"" });
  const [editSrq, setEditSrq]     = useState(null);
  const [editW, setEditW]         = useState(null);

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

  /* ── KPI stats ── */
  const stats = {
    totalRequests:  requests.length,
    open:           requests.filter(r => !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    resolved:       requests.filter(r => ["RESOLVED","CLOSED"].includes(r.status)).length,
    urgent:         requests.filter(r => r.priority === "URGENT" && !["RESOLVED","CLOSED","CANCELLED"].includes(r.status)).length,
    totalWarranties: warranties.length,
    activeW:         warranties.filter(w => w.status === "ACTIVE").length,
    expiredW:        warranties.filter(w => w.status === "EXPIRED").length,
  };

  /* ── filtered lists ── */
  const filteredRequests = requests.filter(r => {
    const s = (r.ticketNo||"").toLowerCase() + (r.productName||"").toLowerCase() + (r.customerName||"") + (r.customer?.name||"");
    return (srqFilter.status === "all" || r.status === srqFilter.status)
      && (srqFilter.priority === "all" || r.priority === srqFilter.priority)
      && s.includes(srqFilter.search.toLowerCase());
  });
  const filteredWarranties = warranties.filter(w => {
    const s = (w.productName||"").toLowerCase() + (w.serialNumber||"") + (w.customer?.name||"").toLowerCase();
    return (wFilter.status === "all" || w.status === wFilter.status)
      && s.includes(wFilter.search.toLowerCase());
  });

  const inp  = { padding:"9px 12px", borderRadius:9, border:"1.5px solid rgba(15,18,42,.1)", fontSize:13, fontFamily:"inherit", outline:"none", background:"#fff" };
  const cell = { padding:"14px 16px", fontSize:13, color:C.ink, borderBottom:"1px solid rgba(15,18,42,.05)", verticalAlign:"middle" };

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif", animation:"fadeUp .35s ease both" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}`}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:C.purpleL, border:`1px solid ${C.purpleB}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="1.9"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63"/></svg>
            </div>
            <h1 style={{ fontSize:24, fontWeight:900, color:C.ink, margin:0, letterSpacing:"-.05em" }}>Service Management</h1>
          </div>
          <p style={{ fontSize:13, color:C.inkSoft, margin:0 }}>System-wide view of all warranties and service requests</p>
        </div>
        <button onClick={fetchAll} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:11, border:`1.5px solid ${C.purpleB}`, background:C.purpleL, color:C.purple, fontSize:13, fontWeight:700, cursor:"pointer" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.purple} strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
          Refresh
        </button>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:24 }}>
        <KpiCard label="Total Requests"  value={stats.totalRequests}  color={C.purple} bg={C.purpleL} border={C.purpleB} icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108"/>
        <KpiCard label="Open"            value={stats.open}           color={C.blue}   bg={C.blueL}   border="rgba(3,105,161,.2)" icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        <KpiCard label="Resolved"        value={stats.resolved}       color={C.green}  bg={C.greenL}  border={C.greenB} icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        <KpiCard label="Urgent Open"     value={stats.urgent}         color={C.red}    bg={C.redL}    border={C.redB}   icon="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        <KpiCard label="Active Warranties" value={stats.activeW}      color={C.teal}   bg={C.tealL}   border="rgba(15,118,110,.2)" icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
        <KpiCard label="Expired Warranties" value={stats.expiredW}    color={C.amber}  bg={C.amberL}  border={C.amberB} icon="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:4, background:"rgba(15,18,42,.04)", borderRadius:12, padding:4, width:"fit-content", marginBottom:20 }}>
        {[["requests","Service Requests"],["warranties","Warranties"]].map(([key,label]) => (
          <button key={key} onClick={()=>setTab(key)} style={{ padding:"8px 20px", borderRadius:9, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", background:tab===key?"#fff":"transparent", color:tab===key?C.purple:C.inkSoft, boxShadow:tab===key?"0 1px 6px rgba(15,18,42,.1)":"none", transition:"all .15s" }}>{label}</button>
        ))}
      </div>

      {/* ══════════ SERVICE REQUESTS TAB ══════════ */}
      {tab === "requests" && (
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid rgba(15,18,42,.07)", boxShadow:"0 2px 16px rgba(15,18,42,.04)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(15,18,42,.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input placeholder="Search ticket, product, customer..." value={srqFilter.search} onChange={e=>setSrqFilter(f=>({...f,search:e.target.value}))} style={{ ...inp, flex:"1 1 200px", minWidth:0 }}/>
            <select value={srqFilter.status} onChange={e=>setSrqFilter(f=>({...f,status:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Status</option>
              {ALL_SRQ_STATUSES.map(s=><option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <select value={srqFilter.priority} onChange={e=>setSrqFilter(f=>({...f,priority:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Priority</option>
              {["LOW","MEDIUM","HIGH","URGENT"].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ fontSize:12, color:C.inkSoft, fontFamily:"'DM Mono',monospace" }}>{filteredRequests.length} records</span>
          </div>
          {loading ? <div style={{ textAlign:"center", padding:50, color:C.inkSoft }}>Loading...</div> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(15,18,42,.025)" }}>
                    {["Ticket","Customer","Product","Issue Type","Priority","Status","Technician","Submitted","Action"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign:"center", padding:40, color:C.inkSoft, fontSize:13 }}>No service requests found</td></tr>
                  ) : filteredRequests.map(r => (
                    <tr key={r._id} style={{ transition:"background .12s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(15,18,42,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={cell}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, fontWeight:600, color:C.purple }}>{r.ticketNo}</span></td>
                      <td style={cell}><div style={{ fontSize:13, fontWeight:600 }}>{r.customer?.name || r.contactName}</div><div style={{ fontSize:11, color:C.inkSoft }}>{r.contactPhone}</div></td>
                      <td style={cell}><div style={{ fontWeight:600 }}>{r.productName}</div>{r.serialNumber && <div style={{ fontSize:11, color:C.inkSoft, fontFamily:"'DM Mono',monospace" }}>S/N: {r.serialNumber}</div>}</td>
                      <td style={cell}><span style={{ fontSize:12 }}>{(r.issueType||"").replace(/_/g," ")}</span></td>
                      <td style={cell}><Badge status={r.priority} cfg={PRIORITY_CFG}/></td>
                      <td style={cell}><Badge status={r.status}   cfg={STATUS_CFG}/></td>
                      <td style={cell}><span style={{ fontSize:12, color:r.assignedTo?C.ink:C.inkSoft }}>{r.assignedTo || "—"}</span></td>
                      <td style={cell}><span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:C.inkSoft }}>{fmtDate(r.createdAt)}</span></td>
                      <td style={cell}>
                        <button onClick={()=>setEditSrq(r)} style={{ padding:"5px 12px", borderRadius:8, border:`1.5px solid ${C.purpleB}`, background:C.purpleL, color:C.purple, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ WARRANTIES TAB ══════════ */}
      {tab === "warranties" && (
        <div style={{ background:"#fff", borderRadius:20, border:"1px solid rgba(15,18,42,.07)", boxShadow:"0 2px 16px rgba(15,18,42,.04)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(15,18,42,.06)", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <input placeholder="Search product, serial, customer..." value={wFilter.search} onChange={e=>setWFilter(f=>({...f,search:e.target.value}))} style={{ ...inp, flex:"1 1 200px", minWidth:0 }}/>
            <select value={wFilter.status} onChange={e=>setWFilter(f=>({...f,status:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              <option value="all">All Status</option>
              {Object.keys(W_STATUS).map(s=><option key={s} value={s}>{W_STATUS[s].label}</option>)}
            </select>
            <span style={{ fontSize:12, color:C.inkSoft, fontFamily:"'DM Mono',monospace" }}>{filteredWarranties.length} records</span>
          </div>
          {loading ? <div style={{ textAlign:"center", padding:50, color:C.inkSoft }}>Loading...</div> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(15,18,42,.025)" }}>
                    {["Customer","Product","Serial No.","Purchase Date","Expiry Date","Period","Status","Action"].map(h => (
                      <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:C.inkSoft, textTransform:"uppercase", letterSpacing:".07em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:C.inkSoft, fontSize:13 }}>No warranties found</td></tr>
                  ) : filteredWarranties.map(w => (
                    <tr key={w._id} style={{ transition:"background .12s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(15,18,42,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={cell}><div style={{ fontWeight:600 }}>{w.customer?.name || "—"}</div><div style={{ fontSize:11, color:C.inkSoft }}>{w.customer?.email}</div></td>
                      <td style={cell}><span style={{ fontWeight:600 }}>{w.productName}</span></td>
                      <td style={cell}><span style={{ fontFamily:"'DM Mono',monospace", fontSize:12 }}>{w.serialNumber}</span></td>
                      <td style={cell}><span style={{ fontSize:12, fontFamily:"'DM Mono',monospace" }}>{fmtDate(w.purchaseDate)}</span></td>
                      <td style={cell}>
                        <span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color: w.status==="EXPIRED" ? C.red : C.ink }}>{fmtDate(w.expiryDate)}</span>
                        {w.daysLeft > 0 && w.status==="ACTIVE" && w.daysLeft <= 30 && <div style={{ fontSize:10, color:C.amber, fontWeight:700 }}>⚠ {w.daysLeft}d left</div>}
                      </td>
                      <td style={cell}><span style={{ fontSize:12 }}>{w.warrantyYears}yr</span></td>
                      <td style={cell}><Badge status={w.status} cfg={W_STATUS}/></td>
                      <td style={cell}>
                        <button onClick={()=>setEditW(w)} style={{ padding:"5px 12px", borderRadius:8, border:`1.5px solid ${C.purpleB}`, background:C.purpleL, color:C.purple, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {editSrq && <StatusUpdateModal request={editSrq} onClose={()=>setEditSrq(null)} onSaved={()=>{ setEditSrq(null); fetchAll(); }}/>}
      {editW   && <WarrantyUpdateModal warranty={editW} onClose={()=>setEditW(null)}  onSaved={()=>{ setEditW(null); fetchAll(); }}/>}
    </div>
  );
}
