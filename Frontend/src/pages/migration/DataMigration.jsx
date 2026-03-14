import { useEffect, useState, useCallback } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";

const purple = "#7c3aed"; const purpleL = "rgba(124,58,237,.08)"; const purpleB = "rgba(124,58,237,.2)";
const blue   = "#0284c7"; const blueL   = "rgba(2,132,199,.08)";   const blueB   = "rgba(2,132,199,.2)";
const green  = "#059669"; const greenL  = "rgba(5,150,105,.08)";   const greenB  = "rgba(5,150,105,.2)";
const red    = "#dc2626";

function Toast({ msg, type }) {
  return <div style={{ position:"fixed",bottom:28,right:28,background:type==="error"?red:green,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:700,boxShadow:"0 8px 28px rgba(0,0,0,.18)",zIndex:9999,animation:"fadeUp .2s ease both",maxWidth:340 }}>{type==="error"?"✗":"✓"} {msg}</div>;
}
function Spinner({ size=18, color=blue }) {
  return <div style={{ width:size,height:size,borderRadius:"50%",border:`2px solid rgba(2,132,199,.15)`,borderTopColor:color,animation:"spin .7s linear infinite",flexShrink:0 }} />;
}
function StatPill({ label, value, color, bg, border }) {
  return (
    <div style={{ background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,flex:1,minWidth:140 }}>
      <div style={{ fontSize:32,fontWeight:800,color,fontFamily:"'Figtree',sans-serif",lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11,fontWeight:700,color,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".1em",lineHeight:1.4 }}>{label}<br/>Unassigned</div>
    </div>
  );
}

export default function DataMigration() {
  const [summary,        setSummary]        = useState(null);
  const [branches,       setBranches]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [assigning,      setAssigning]      = useState(false);
  const [toast,          setToast]          = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [types, setTypes] = useState({ products:true, categories:true, suppliers:true });

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/migration/unassigned-summary");
      setSummary(data);
      setBranches(data.branches || []);
    } catch { showToast("Failed to load summary","error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const totalUnassigned = (summary?.products||0)+(summary?.categories||0)+(summary?.suppliers||0);

  const handleBulkAssign = async () => {
    if (!selectedBranch) { showToast("Please select a branch first","error"); return; }
    const selectedTypes = Object.entries(types).filter(([,v])=>v).map(([k])=>k);
    if (!selectedTypes.length) { showToast("Select at least one data type","error"); return; }
    setAssigning(true);
    try {
      const { data } = await axiosInstance.post("/migration/assign-branch", { branchId: selectedBranch, types: selectedTypes });
      const counts = Object.entries(data.updated).map(([k,v])=>`${v} ${k}`).join(", ");
      showToast(`Assigned ${counts} → ${data.branch.branchName} (${data.branch.organization?.name})`);
      await loadSummary();
    } catch (err) { showToast(err?.response?.data?.message||"Assignment failed","error"); }
    finally { setAssigning(false); }
  };

  const branchById = branches.reduce((acc,b)=>{ acc[b._id]=b; return acc; }, {});
  const selectedBranchObj = selectedBranch ? branchById[selectedBranch] : null;

  const orgGroups = branches.reduce((acc,b) => {
    const orgName = b.organization?.name || "No Organization";
    if (!acc[orgName]) acc[orgName] = [];
    acc[orgName].push(b);
    return acc;
  }, {});

  return (
    <PageShell title="Branch Assignment" subtitle="Assign existing unassigned records to their correct branch & organization">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Alert banner */}
      {!loading && totalUnassigned > 0 && (
        <div style={{ display:"flex",alignItems:"flex-start",gap:14,padding:"16px 20px",borderRadius:16,background:"rgba(239,68,68,.06)",border:"1.5px solid rgba(239,68,68,.2)",marginBottom:24,animation:"fadeUp .3s ease both" }}>
          <div style={{ width:36,height:36,borderRadius:10,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={red} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Figtree',sans-serif",fontSize:14,fontWeight:800,color:red,marginBottom:4 }}>{totalUnassigned} record{totalUnassigned!==1?"s":""} have no branch assigned</div>
            <div style={{ fontSize:12.5,color:"rgba(26,26,46,.55)",lineHeight:1.6 }}>These records were created before branch scoping was enabled. Use the tool below to bulk-assign them to the correct branch. Products, Categories and Suppliers pages will show "Unassigned" until fixed.</div>
          </div>
        </div>
      )}
      {!loading && totalUnassigned === 0 && (
        <div style={{ display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:16,background:greenL,border:`1.5px solid ${greenB}`,marginBottom:24 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={green} strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div style={{ fontSize:14,fontWeight:700,color:green }}>All records are assigned to a branch. No action needed.</div>
        </div>
      )}

      {/* Stats */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(26,26,46,.35)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:14 }}>Unassigned Record Summary</div>
        {loading ? <div style={{ display:"flex",justifyContent:"center",padding:40 }}><Spinner size={24} /></div> : (
          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <StatPill label="Products"   value={summary?.products||0}   color={blue}   bg={blueL}   border={blueB} />
            <StatPill label="Categories" value={summary?.categories||0} color={purple} bg={purpleL} border={purpleB} />
            <StatPill label="Suppliers"  value={summary?.suppliers||0}  color={green}  bg={greenL}  border={greenB} />
            <div style={{ background:"rgba(26,26,46,.04)",border:"1.5px solid rgba(26,26,46,.1)",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:14,flex:1,minWidth:140 }}>
              <div style={{ fontSize:32,fontWeight:800,color:totalUnassigned>0?red:green,fontFamily:"'Figtree',sans-serif",lineHeight:1 }}>{totalUnassigned}</div>
              <div style={{ fontSize:11,fontWeight:700,color:totalUnassigned>0?red:green,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",letterSpacing:".1em",lineHeight:1.4 }}>Total<br/>Unassigned</div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Assignment Tool */}
      <div style={{ background:"#fff",borderRadius:20,border:"1px solid rgba(26,26,46,.08)",boxShadow:"0 2px 20px rgba(26,26,46,.05)",overflow:"hidden",marginBottom:24 }}>
        <div style={{ padding:"18px 24px",borderBottom:"1px solid rgba(26,26,46,.06)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:blueL,border:`1px solid ${blueB}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={blue} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Figtree',sans-serif",fontSize:15,fontWeight:800,color:"#1a1a2e" }}>Bulk Branch Assignment</div>
            <div style={{ fontSize:11.5,color:"rgba(26,26,46,.4)",marginTop:1 }}>Assign all unassigned records to a selected branch at once</div>
          </div>
        </div>

        <div style={{ padding:"24px" }}>
          {/* Step 1 — Branch selector */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,color:"rgba(26,26,46,.45)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10 }}>Step 1 — Select Target Branch</div>
            <select value={selectedBranch} onChange={e=>setSelectedBranch(e.target.value)}
              style={{ width:"100%",maxWidth:500,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${selectedBranch?blueB:"rgba(26,26,46,.12)"}`,fontSize:13,outline:"none",color:"#1a1a2e",fontFamily:"'Figtree',sans-serif",background:"#fafafa",cursor:"pointer" }}>
              <option value="">— Choose a branch —</option>
              {Object.entries(orgGroups).map(([orgName, brs]) => (
                <optgroup key={orgName} label={`📍 ${orgName}`}>
                  {brs.map(b=><option key={b._id} value={b._id}>{b.branchName}{b.city?` (${b.city})`:""}</option>)}
                </optgroup>
              ))}
            </select>
            {selectedBranchObj && (
              <div style={{ marginTop:10,display:"inline-flex",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:12,background:blueL,border:`1px solid ${blueB}`,animation:"fadeUp .2s ease both" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:blue }} />
                <div style={{ fontSize:12.5,fontWeight:600,color:"#1a1a2e" }}>
                  <span style={{ color:"rgba(26,26,46,.45)",fontWeight:400 }}>{selectedBranchObj.organization?.name} · </span>
                  {selectedBranchObj.branchName}
                  {selectedBranchObj.city&&<span style={{ color:"rgba(26,26,46,.4)",fontWeight:400 }}> · {selectedBranchObj.city}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Type checkboxes */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,color:"rgba(26,26,46,.45)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10 }}>Step 2 — Select Data Types to Assign</div>
            <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
              {[
                { key:"products",   label:"Products",   count:summary?.products||0,   color:blue,   bg:blueL,   border:blueB },
                { key:"categories", label:"Categories", count:summary?.categories||0, color:purple, bg:purpleL, border:purpleB },
                { key:"suppliers",  label:"Suppliers",  count:summary?.suppliers||0,  color:green,  bg:greenL,  border:greenB },
              ].map(({ key,label,count,color,bg,border }) => {
                const checked = types[key];
                return (
                  <div key={key} onClick={()=>setTypes(t=>({...t,[key]:!t[key]}))}
                    style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderRadius:12,border:`1.5px solid ${checked?border:"rgba(26,26,46,.1)"}`,background:checked?bg:"transparent",cursor:"pointer",transition:"all .15s",minWidth:160 }}>
                    <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${checked?color:"rgba(26,26,46,.2)"}`,background:checked?color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s" }}>
                      {checked&&<svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:checked?"#1a1a2e":"rgba(26,26,46,.4)" }}>{label}</div>
                      <div style={{ fontSize:10.5,fontFamily:"'DM Mono',monospace",color:checked?color:"rgba(26,26,46,.3)" }}>{count} unassigned</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assign button */}
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <button onClick={handleBulkAssign} disabled={assigning||!selectedBranch||totalUnassigned===0}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"12px 28px",borderRadius:13,border:"none",cursor:(assigning||!selectedBranch||totalUnassigned===0)?"not-allowed":"pointer",background:selectedBranch&&totalUnassigned>0?`linear-gradient(135deg,${blue},#0369a1)`:"rgba(26,26,46,.08)",color:selectedBranch&&totalUnassigned>0?"#fff":"rgba(26,26,46,.3)",fontSize:14,fontWeight:700,fontFamily:"'Figtree',sans-serif",boxShadow:selectedBranch&&totalUnassigned>0?`0 4px 18px ${blueB}`:"none",transition:"all .2s",opacity:assigning?.8:1 }}>
              {assigning?<Spinner size={14} color="#fff"/>:<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>}
              {assigning?"Assigning…":"Assign Branch to All Unassigned"}
            </button>
            <button onClick={loadSummary} disabled={loading}
              style={{ padding:"12px 18px",borderRadius:13,border:"1.5px solid rgba(26,26,46,.12)",background:"transparent",color:"rgba(26,26,46,.5)",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Figtree',sans-serif" }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Branch reference list */}
      <div style={{ background:"#fff",borderRadius:20,border:"1px solid rgba(26,26,46,.08)",overflow:"hidden" }}>
        <div style={{ padding:"18px 24px",borderBottom:"1px solid rgba(26,26,46,.06)",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:32,height:32,borderRadius:9,background:purpleL,border:`1px solid ${purpleB}`,display:"flex",alignItems:"center",justifyContent:"center" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={purple} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/></svg>
          </div>
          <span style={{ fontFamily:"'Figtree',sans-serif",fontSize:15,fontWeight:800,color:"#1a1a2e" }}>All Branches ({branches.length})</span>
        </div>
        <div style={{ padding:"20px 24px" }}>
          {loading ? <div style={{ display:"flex",justifyContent:"center",padding:30 }}><Spinner size={20} /></div>
          : branches.length===0 ? <div style={{ textAlign:"center",padding:"30px 20px",color:"rgba(26,26,46,.4)",fontSize:13 }}>No branches found. Create branches first in Organization Control.</div>
          : Object.entries(orgGroups).map(([orgName,brs])=>(
            <div key={orgName} style={{ marginBottom:20 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:10 }}>
                <div style={{ width:24,height:24,borderRadius:7,background:purpleL,border:`1px solid ${purpleB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={purple} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/></svg>
                </div>
                <span style={{ fontFamily:"'Figtree',sans-serif",fontSize:13,fontWeight:800,color:"#1a1a2e" }}>{orgName}</span>
                <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9.5,color:purple,background:purpleL,border:`1px solid ${purpleB}`,borderRadius:99,padding:"1px 8px" }}>{brs.length} branch{brs.length!==1?"es":""}</span>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8,marginLeft:32 }}>
                {brs.map(b=>(
                  <div key={b._id} style={{ padding:"12px 14px",borderRadius:12,border:`1px solid ${greenB}`,background:greenL,display:"flex",alignItems:"flex-start",gap:10 }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:"#fff",border:`1px solid ${greenB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={green} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:12.5,fontWeight:700,color:"#1a1a2e",marginBottom:2 }}>{b.branchName}</div>
                      {b.city&&<div style={{ fontSize:11,color:"rgba(26,26,46,.4)" }}>{b.city}{b.state?`, ${b.state}`:""}</div>}
                      <div style={{ marginTop:5,display:"flex",alignItems:"center",gap:5 }}>
                        <span style={{ fontSize:9.5,fontWeight:700,color:b.status==="ACTIVE"?green:"#b45309",background:b.status==="ACTIVE"?greenL:"rgba(180,83,9,.08)",border:`1px solid ${b.status==="ACTIVE"?greenB:"rgba(180,83,9,.2)"}`,borderRadius:99,padding:"1px 7px",fontFamily:"'DM Mono',monospace" }}>{b.status}</span>
                        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(26,26,46,.25)" }}>…{String(b._id).slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
    </PageShell>
  );
}
