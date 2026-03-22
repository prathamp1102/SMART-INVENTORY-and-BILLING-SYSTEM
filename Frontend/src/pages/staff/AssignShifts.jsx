import ConfirmModal from "../../components/ui/ConfirmModal";
import { useState, useEffect } from "react";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS as ISBase, SS, FieldLabel, FormError } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const NK="#475569",NKL="rgba(71,85,105,.08)",NKB="rgba(71,85,105,.2)";

const IS={...ISBase,height:"42px",marginBottom:"0"};
const SHIFTS=["MORNING","AFTERNOON","EVENING","NIGHT","FULL_DAY"];
const SHIFT_META={
  MORNING:  {start:"06:00",end:"14:00",color:AM,bg:AML,border:AMB},
  AFTERNOON:{start:"14:00",end:"22:00",color:B, bg:BL, border:BB },
  EVENING:  {start:"17:00",end:"23:00",color:V, bg:VL, border:VB },
  NIGHT:    {start:"22:00",end:"06:00",color:NK,bg:NKL,border:NKB},
  FULL_DAY: {start:"09:00",end:"18:00",color:P, bg:PL, border:PB },
};
const STATUS_META={
  SCHEDULED:{color:B,bg:BL,border:BB},
  COMPLETED:{color:P,bg:PL,border:PB},
  CANCELLED:{color:RD,bg:RDL,border:RDB},
};
const DAY_NAMES=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function ShiftBadge({type}){const m=SHIFT_META[type]||SHIFT_META.MORNING;return <span style={{padding:"2px 8px",borderRadius:"99px",background:m.bg,border:`1px solid ${m.border}`,color:m.color,fontSize:"9.5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{type}</span>;}
function StatusBadge({status}){const m=STATUS_META[status]||STATUS_META.SCHEDULED;return <span style={{padding:"2px 8px",borderRadius:"99px",background:m.bg,border:`1px solid ${m.border}`,color:m.color,fontSize:"9.5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{status}</span>;}

function getMonday(d){const dd=new Date(d);const day=dd.getDay();const diff=dd.getDate()-day+(day===0?-6:1);dd.setDate(diff);return dd;}

// Week grid component
function WeekGrid({shifts,staff,weekStart,onEdit}){
  const days=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d;});
  const todayStr=new Date().toISOString().split("T")[0];
  return(
    <div style={{overflowX:"auto"}}>
      <div style={{minWidth:"700px"}}>
        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"150px repeat(7,1fr)",gap:"2px",marginBottom:"2px"}}>
          <div/>
          {days.map((d,i)=>{
            const ds=d.toISOString().split("T")[0];
            const isToday=ds===todayStr;
            return(
              <div key={i} style={{padding:"8px 6px",textAlign:"center",borderRadius:"9px",background:isToday?VL:"rgba(26,26,46,.03)",border:isToday?`1px solid ${VB}`:"1px solid transparent"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8.5px",color:isToday?V:"rgba(26,26,46,.35)",letterSpacing:".1em"}}>{DAY_NAMES[i]}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:"16px",fontWeight:800,color:isToday?V:"#1a1a2e",marginTop:"1px"}}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        {/* Staff rows */}
        {staff.map((st,si)=>(
          <div key={st._id} style={{display:"grid",gridTemplateColumns:"150px repeat(7,1fr)",gap:"2px",marginBottom:"2px"}}>
            <div style={{padding:"8px 12px",borderRadius:"9px",background:si%2===0?"#fff":"rgba(26,26,46,.012)",display:"flex",alignItems:"center",gap:"8px",border:"1px solid rgba(26,26,46,.05)"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${P},#047857)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"11px",fontWeight:800,color:"#fff"}}>{st.name?.charAt(0)?.toUpperCase()}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:"11.5px",fontWeight:700,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{st.name}</div>
                <div style={{fontSize:"9.5px",color:"rgba(26,26,46,.38)"}}>{st.role}</div>
              </div>
            </div>
            {days.map((d,di)=>{
              const ds=d.toISOString().split("T")[0];
              const dayShifts=shifts.filter(s=>String(s.staff?._id||s.staff)===st._id&&s.date===ds);
              return(
                <div key={di} style={{padding:"4px",borderRadius:"9px",background:si%2===0?"#fff":"rgba(26,26,46,.012)",minHeight:"52px",border:"1px solid rgba(26,26,46,.05)"}}>
                  {dayShifts.map(sh=>{
                    const m=SHIFT_META[sh.shiftType]||SHIFT_META.MORNING;
                    return(
                      <div key={sh._id} onClick={()=>onEdit(sh)} style={{padding:"3px 6px",borderRadius:"6px",background:m.bg,border:`1px solid ${m.border}`,marginBottom:"2px",cursor:"pointer"}}>
                        <div style={{fontSize:"9px",fontFamily:"'DM Mono',monospace",color:m.color,fontWeight:700}}>{sh.shiftType}</div>
                        <div style={{fontSize:"8.5px",color:"rgba(26,26,46,.48)"}}>{sh.startTime}–{sh.endTime}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
        {staff.length===0&&(
          <div style={{padding:"48px",textAlign:"center",color:"rgba(26,26,46,.35)",fontSize:"13px"}}>No staff members found</div>
        )}
      </div>
    </div>
  );
}

export default function AssignShifts(){
  const now=new Date();
  const [staff,setStaff]=useState([]);
  const [shifts,setShifts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("week");
  const [showForm,setShowForm]=useState(false);
  const [editShift,setEditShift]=useState(null);
  const [apiErr,setApiErr]=useState("");
  const [saving,setSaving]=useState(false);
  const [weekStart,setWeekStart]=useState(getMonday(now));

  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);

  const blank={staff:"",date:now.toISOString().split("T")[0],shiftType:"MORNING",startTime:"09:00",endTime:"18:00",notes:"",status:"SCHEDULED"};
  const [form,setForm]=useState(blank);

  const load=()=>{
    setLoading(true);
    const ws=weekStart.toISOString().split("T")[0];
    const we=weekEnd.toISOString().split("T")[0];
    Promise.all([
      axiosInstance.get("/shifts",{params:{week:ws,weekEnd:we}}),
      axiosInstance.get("/admin/users",{params:{limit:100}}).catch(()=>({data:[]})),
    ]).then(([sh,us])=>{
      setShifts(sh.data||[]);
      const usArr=Array.isArray(us.data)?us.data:Array.isArray(us.data?.data)?us.data.data:[];setStaff(usArr.filter(u=>["STAFF","ADMIN"].includes(u.role)&&u.isActive!==false));
    }).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(()=>{load();},[weekStart.toISOString()]);

  const setF=k=>e=>{
    const val=e.target.value;
    setForm(p=>{
      const next={...p,[k]:val};
      if(k==="shiftType"){const def=SHIFT_META[val];if(def){next.startTime=def.start;next.endTime=def.end;}}
      return next;
    });
  };

  const openEdit=sh=>{
    setEditShift(sh);
    setForm({staff:sh.staff?._id||sh.staff,date:sh.date,shiftType:sh.shiftType,startTime:sh.startTime,endTime:sh.endTime,notes:sh.notes||"",status:sh.status});
    setShowForm(true);
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const handleSubmit=async()=>{
    if(!form.staff||!form.date){setApiErr("Staff and date are required.");return;}
    setSaving(true);setApiErr("");
    try{
      if(editShift)await axiosInstance.put(`/shifts/${editShift._id}`,form);
      else await axiosInstance.post("/shifts",form);
      setShowForm(false);setEditShift(null);setForm(blank);load();
    }catch(err){setApiErr(err?.response?.data?.message||"Failed to save shift.");}
    finally{setSaving(false);}
  };

  const handleDelete=async id=>{
    setDelError(null); setDelModal({id});
  };

  const prevWeek=()=>{const d=new Date(weekStart);d.setDate(d.getDate()-7);setWeekStart(d);};
  const nextWeek=()=>{const d=new Date(weekStart);d.setDate(d.getDate()+7);setWeekStart(d);};
  const thisWeek=()=>setWeekStart(getMonday(now));

  const weekLabel=`${weekStart.toLocaleDateString("en-IN",{day:"numeric",month:"short"})} – ${weekEnd.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`;
  const sel={padding:"7px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.12)",background:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:600,color:"rgba(26,26,46,.65)"};
  const thS={padding:"10px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.35)",letterSpacing:".12em",textTransform:"uppercase",fontWeight:500};

  return(
    <PageShell title="Assign Shifts" subtitle="Schedule and manage staff shifts for the week">
      {/* Stats */}
      <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
        {[[shifts.length,"Total Shifts",V,VL,VB],[shifts.filter(s=>s.status==="SCHEDULED").length,"Scheduled",B,BL,BB],[shifts.filter(s=>s.status==="COMPLETED").length,"Completed",P,PL,PB],[staff.length,"Staff Members",AM,AML,AMB]].map(([val,label,color,bg,border])=>(
          <div key={label} style={{padding:"9px 16px",borderRadius:"12px",background:bg,border:`1.5px solid ${border}`,display:"flex",gap:"9px",alignItems:"center"}}>
            <span style={{fontFamily:"'Fraunces',serif",fontSize:"17px",fontWeight:900,color}}>{val}</span>
            <span style={{fontSize:"11px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.5)",letterSpacing:".05em"}}>{label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{background:"#fff",borderRadius:"13px",padding:"12px 16px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"14px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={prevWeek} style={{...sel,padding:"7px 11px"}}>‹</button>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#1a1a2e",fontWeight:600,minWidth:"190px",textAlign:"center"}}>{weekLabel}</span>
        <button onClick={nextWeek} style={{...sel,padding:"7px 11px"}}>›</button>
        <button onClick={thisWeek} style={sel}>Today</button>
        <div style={{width:1,height:22,background:"rgba(26,26,46,.1)"}}/>
        <div style={{display:"flex",borderRadius:"9px",overflow:"hidden",border:"1px solid rgba(26,26,46,.12)"}}>
          {[["week","Calendar"],["list","List"]].map(([k,label])=>(
            <button key={k} onClick={()=>setView(k)} style={{padding:"7px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",background:view===k?`linear-gradient(135deg,${V},#6d28d9)`:"#fff",color:view===k?"#fff":"rgba(26,26,46,.48)"}}>{label}</button>
          ))}
        </div>
        <button onClick={load} style={{...sel}}>↻ Refresh</button>
        <div style={{marginLeft:"auto"}}>
          <button onClick={()=>{setEditShift(null);setForm(blank);setShowForm(v=>!v);}} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:showForm&&!editShift?RD:`linear-gradient(135deg,${V},#6d28d9)`,color:"#fff",fontSize:"13px",fontWeight:700,boxShadow:`0 4px 14px ${showForm&&!editShift?"rgba(220,38,38,.3)":"rgba(124,58,237,.28)"}`}}>
            {showForm&&!editShift?"✕ Cancel":<>+ Assign Shift</>}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm&&(
        <Card style={{marginBottom:"16px"}}>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"16px",fontWeight:800,color:"#1a1a2e",marginBottom:"14px"}}>{editShift?"Edit Shift":"Assign New Shift"}</div>
          <FormError message={apiErr}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(170px, 100%), 1fr))",gap:"12px",marginBottom:"12px"}}>
            <div><FieldLabel>Staff Member *</FieldLabel><select value={form.staff} onChange={setF("staff")} style={{...SS,height:"42px",marginBottom:0}}><option value="">— Select Staff —</option>{staff.map(s=><option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}</select></div>
            <div><FieldLabel>Date *</FieldLabel><input type="date" value={form.date} onChange={setF("date")} style={{...IS}}/></div>
            <div><FieldLabel>Shift Type</FieldLabel><select value={form.shiftType} onChange={setF("shiftType")} style={{...SS,height:"42px",marginBottom:0}}>{SHIFTS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
            <div><FieldLabel>Start Time</FieldLabel><input type="time" value={form.startTime} onChange={setF("startTime")} style={{...IS}}/></div>
            <div><FieldLabel>End Time</FieldLabel><input type="time" value={form.endTime} onChange={setF("endTime")} style={{...IS}}/></div>
            {editShift&&<div><FieldLabel>Status</FieldLabel><select value={form.status} onChange={setF("status")} style={{...SS,height:"42px",marginBottom:0}}>{["SCHEDULED","COMPLETED","CANCELLED"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>}
          </div>
          <div><FieldLabel>Notes (optional)</FieldLabel><textarea value={form.notes} onChange={setF("notes")} placeholder="Any special instructions…" style={{...ISBase,height:"56px",padding:"10px 12px",resize:"vertical",marginBottom:"14px"}}/></div>
          {form.shiftType&&(
            <div style={{display:"flex",alignItems:"center",gap:"9px",padding:"9px 13px",borderRadius:"10px",background:SHIFT_META[form.shiftType]?.bg,border:`1px solid ${SHIFT_META[form.shiftType]?.border}`,marginBottom:"14px"}}>
              <ShiftBadge type={form.shiftType}/>
              <span style={{fontSize:"12px",color:"rgba(26,26,46,.55)",fontFamily:"'DM Mono',monospace"}}>{form.startTime} – {form.endTime}</span>
              {form.staff&&<span style={{fontSize:"12px",color:"rgba(26,26,46,.45)"}}>· {staff.find(s=>s._id===form.staff)?.name||""}</span>}
            </div>
          )}
          <div style={{display:"flex",gap:"8px"}}>
            <Button onClick={handleSubmit} loading={saving} accent={V} glow="rgba(124,58,237,.25)">{editShift?"Update Shift":"Assign Shift"}</Button>
            <Button variant="secondary" onClick={()=>{setShowForm(false);setEditShift(null);}}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Content */}
      <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 16px rgba(26,26,46,.05)"}}>
        {loading?(
          <div style={{padding:"60px",textAlign:"center",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>Loading shifts…</div>
        ):view==="week"?(
          <div style={{padding:"14px"}}>
            <WeekGrid shifts={shifts} staff={staff} weekStart={weekStart} onEdit={openEdit}/>
          </div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>
                {["Date","Staff","Shift Type","Time","Status","Notes","Actions"].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>
                {shifts.length===0?(
                  <tr><td colSpan={7} style={{padding:"60px",textAlign:"center"}}>
                    <div style={{fontSize:"32px",marginBottom:"10px"}}>📅</div>
                    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No shifts this week</div>
                    <div style={{fontSize:"12px",color:"rgba(26,26,46,.3)",marginTop:"4px"}}>Click "Assign Shift" to schedule</div>
                  </td></tr>
                ):[...shifts].sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime)).map((sh,i)=>(
                  <tr key={sh._id} style={{borderBottom:"1px solid rgba(26,26,46,.042)",background:i%2===0?"#fff":"rgba(26,26,46,.01)"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.018)"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"rgba(26,26,46,.01)"}>
                    <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>
                      {new Date(sh.date+"T12:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
                    </td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{fontSize:"13px",fontWeight:700,color:"#1a1a2e"}}>{sh.staff?.name||"—"}</div>
                      <div style={{fontSize:"11px",color:"rgba(26,26,46,.38)"}}>{sh.staff?.role}</div>
                    </td>
                    <td style={{padding:"11px 14px"}}><ShiftBadge type={sh.shiftType}/></td>
                    <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>{sh.startTime} – {sh.endTime}</td>
                    <td style={{padding:"11px 14px"}}><StatusBadge status={sh.status}/></td>
                    <td style={{padding:"11px 14px",fontSize:"12px",color:"rgba(26,26,46,.45)"}}>{sh.notes||"—"}</td>
                    <td style={{padding:"11px 14px"}}>
                      <div style={{display:"flex",gap:"6px"}}>
                        <button onClick={()=>openEdit(sh)} style={{padding:"5px 10px",borderRadius:"7px",border:`1.5px solid ${VB}`,background:VL,color:V,fontSize:"11.5px",fontWeight:700,cursor:"pointer"}}>Edit</button>
                        <button onClick={()=>handleDelete(sh._id)} style={{padding:"5px 10px",borderRadius:"7px",border:`1.5px solid ${RDB}`,background:RDL,color:RD,fontSize:"11.5px",fontWeight:700,cursor:"pointer"}}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
