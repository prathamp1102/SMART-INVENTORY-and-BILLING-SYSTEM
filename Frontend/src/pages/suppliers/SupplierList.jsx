import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSuppliers, deleteSupplier } from "../../services/productService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import { PageShell } from "../../components/ui/PageShell";
import BranchScopeBanner from "../../components/ui/BranchScopeBanner";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";
import ConfirmModal from "../../components/ui/ConfirmModal";


/* ─── palette ─────────────────────────────────────────────────── */
const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";

const thS={padding:"11px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.35)",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"};

function Chip({label,color,bg,border,small}){
  return <span style={{padding:small?"2px 8px":"3px 10px",borderRadius:"99px",background:bg,border:`1px solid ${border}`,color,fontSize:small?"10px":"11px",fontFamily:"'DM Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
}

function StatusDot({status}){
  const isActive=status==="ACTIVE";
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"2px 9px",borderRadius:"99px",background:isActive?PL:RDL,border:`1px solid ${isActive?PB:RDB}`,color:isActive?P:RD,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>
    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"currentColor"}}/>
    {status}
  </span>;
}

function SupplierRow({s,onDelete,showOrgBranch,isSA}){
  const navigate=useNavigate();
  return <tr style={{borderBottom:"1px solid rgba(26,26,46,.042)",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.016)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${P},#047857)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 2px 8px rgba(5,150,105,.25)`}}>
          <span style={{fontSize:"12px",fontWeight:800,color:"#fff"}}>{s.supplierName?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <div style={{fontSize:"13.5px",fontWeight:700,color:"#1a1a2e"}}>{s.supplierName}</div>
          {s.companyName&&<div style={{fontSize:"11px",color:"rgba(26,26,46,.4)",marginTop:"2px"}}>{s.companyName}</div>}
        </div>
      </div>
    </td>
    <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.6)"}}>{s.phoneNumber||"—"}</td>
    <td style={{padding:"12px 14px",fontSize:"12px",color:"rgba(26,26,46,.5)"}}>{s.email||<span style={{color:"rgba(26,26,46,.25)"}}>—</span>}</td>
    <td style={{padding:"12px 14px",fontSize:"12px",color:"rgba(26,26,46,.5)"}}>{s.city||"—"}</td>
    <td style={{padding:"12px 14px"}}>
      {s.gstNumber
        ?<span style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"rgba(26,26,46,.6)"}}>{s.gstNumber}</span>
        :<span style={{color:"rgba(26,26,46,.25)"}}>—</span>}
    </td>
    <td style={{padding:"12px 14px"}}>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:s.openingBalance>0?B:"rgba(26,26,46,.4)"}}>₹{(s.openingBalance||0).toLocaleString("en-IN")}</span>
    </td>
    {showOrgBranch&&<>
      <td style={{padding:"12px 14px"}}>
        {s.branch?.organization?.name
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{s.branch.organization.name}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>Global</span>}
      </td>
      <td style={{padding:"12px 14px"}}>
        {s.branch?.branchName
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{s.branch.branchName}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>—</span>}
      </td>
    </>}
    <td style={{padding:"12px 14px"}}><StatusDot status={s.status}/></td>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={()=>navigate(`/suppliers/edit/${s._id}`)} style={{padding:"5px 12px",borderRadius:"8px",border:"1.5px solid rgba(26,26,46,.14)",background:"#fff",color:"rgba(26,26,46,.7)",fontSize:"12px",fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=PB;e.currentTarget.style.color=P;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(26,26,46,.14)";e.currentTarget.style.color="rgba(26,26,46,.7)";}}>Edit</button>
        {isSA&&<button onClick={()=>onDelete(s._id, s.name)} style={{padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${RDB}`,background:RDL,color:RD,fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Delete</button>}
      </div>
    </td>
  </tr>;
}

function BranchBlock({brName,brCity,suppliers,onDelete,isSA}){
  const [open,setOpen]=useState(true);
  const COLS=["Supplier","Phone","Email","City","GST No.","Balance","Status","Actions"];
  const activeCount=suppliers.filter(s=>s.status==="ACTIVE").length;
  return <div style={{border:`1px solid ${BB}`,borderRadius:"13px",overflow:"hidden"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"10px 16px",background:`linear-gradient(135deg,${BL},rgba(2,132,199,.02))`,borderBottom:open?`1px solid ${BB}`:"none",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",userSelect:"none"}}>
      <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
      <span style={{fontWeight:700,fontSize:"13px",color:B}}>{brName==="No Branch"?"No Specific Branch":brName}</span>
      {brCity&&<span style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)"}}>· {brCity}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
        <Chip label={`${suppliers.length} suppliers`} color={B} bg={BL} border={BB} small/>
        <Chip label={`${activeCount} active`} color={P} bg={PL} border={PB} small/>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="14" height="14" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.025)",borderBottom:"1px solid rgba(26,26,46,.06)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>{suppliers.map(s=><SupplierRow key={s._id} s={s} onDelete={onDelete} showOrgBranch={false} isSA={isSA}/>)}</tbody>
      </table>
    </div>}
  </div>;
}

function OrgBlock({orgId,orgName,branches,onDelete,isSA}){
  const [open,setOpen]=useState(true);
  const allSuppliers=Object.values(branches).flatMap(b=>b.suppliers);
  const activeCount=allSuppliers.filter(s=>s.status==="ACTIVE").length;
  const totalBalance=allSuppliers.reduce((sum,s)=>sum+(s.openingBalance||0),0);
  return <div style={{background:"#fff",borderRadius:"18px",border:`1px solid ${VB}`,overflow:"hidden",boxShadow:"0 2px 14px rgba(124,58,237,.07)"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"14px 20px",background:`linear-gradient(135deg,${VL},rgba(124,58,237,.03))`,borderBottom:open?`1px solid ${VB}`:"none",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",userSelect:"none"}}>
      <div style={{width:38,height:38,borderRadius:"11px",background:`linear-gradient(135deg,${V},#6d28d9)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,.3)"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="17" height="17"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:"16px",color:"#1a1a2e",letterSpacing:"-.01em"}}>{orgId==="global"?"Global / No Organization":orgName}</div>
        <div style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)",marginTop:"2px"}}>{Object.keys(branches).length} branch{Object.keys(branches).length!==1?"es":""} · {allSuppliers.length} suppliers</div>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        <Chip label={`${allSuppliers.length} suppliers`} color={B} bg={BL} border={BB}/>
        <Chip label={`${activeCount} active`} color={P} bg={PL} border={PB}/>
        {totalBalance>0&&<Chip label={`₹${totalBalance.toLocaleString("en-IN")}`} color={B} bg={BL} border={BB}/>}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="16" height="16" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
      {Object.entries(branches).map(([brId,{brName,brCity,suppliers}])=>(
        <BranchBlock key={brId} brName={brName} brCity={brCity} suppliers={suppliers} onDelete={onDelete} isSA={isSA}/>
      ))}
    </div>}
  </div>;
}

function GroupedView({suppliers,onDelete,isSA}){
  const tree=useMemo(()=>{
    const map={};
    suppliers.forEach(s=>{
      const orgId=s.branch?.organization?._id||"global";
      const orgName=s.branch?.organization?.name||"No Organization";
      const brId=s.branch?._id||"none";
      const brName=s.branch?.branchName||"No Branch";
      const brCity=s.branch?.city||"";
      if(!map[orgId])map[orgId]={orgName,branches:{}};
      if(!map[orgId].branches[brId])map[orgId].branches[brId]={brName,brCity,suppliers:[]};
      map[orgId].branches[brId].suppliers.push(s);
    });
    return map;
  },[suppliers]);
  if(suppliers.length===0)return <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)"}}>
    <div style={{fontSize:"32px",marginBottom:"10px"}}>🤝</div>
    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No suppliers found</div>
  </div>;
  return <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
    {Object.entries(tree).map(([orgId,{orgName,branches}])=>(
      <OrgBlock key={orgId} orgId={orgId} orgName={orgName} branches={branches} onDelete={onDelete} isSA={isSA}/>
    ))}
  </div>;
}

function FlatView({suppliers,onDelete,isSA}){
  const COLS=isSA
    ?["Supplier","Phone","Email","City","GST No.","Balance","Organization","Branch","Status","Actions"]
    :["Supplier","Phone","Email","City","GST No.","Balance","Status","Actions"];
  return <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 16px rgba(26,26,46,.05)"}}>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {suppliers.length===0
            ?<tr><td colSpan={COLS.length} style={{padding:"60px",textAlign:"center"}}>
              <div style={{fontSize:"32px",marginBottom:"10px"}}>🤝</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No suppliers found</div>
            </td></tr>
            :suppliers.map(s=><SupplierRow key={s._id} s={s} onDelete={onDelete} showOrgBranch={isSA} isSA={isSA}/>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export default function SupplierList(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const isSA=user?.role==="SUPER_ADMIN";

  const [suppliers,setSuppliers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [delModal,setDelModal]=useState(null);
  const [deleting,setDeleting]=useState(false);
  const [delError,setDelError]=useState(null);
  const [statusFilter,setStatusFilter]=useState("all");
  const [orgs,setOrgs]=useState([]);
  const [branches,setBranches]=useState([]);
  const [selOrg,setSelOrg]=useState("all");
  const [selBranch,setSelBranch]=useState("all");
  const [viewMode,setViewMode]=useState("grouped");
  const [profile,setProfile]=useState(null);

  const loadData=()=>{
    setLoading(true);
    getSuppliers().then(d=>{setSuppliers(d);}).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{loadData();},[]);
  useEffect(()=>{
    if(!isSA)return;
    Promise.all([getOrganizations(),getBranches()]).then(([o,b])=>{setOrgs(o);setBranches(b);}).catch(console.error);
  },[isSA]);
  useEffect(()=>{
    if(user?.role==="ADMIN"){axiosInstance.get("/auth/me").then(r=>setProfile(r.data)).catch(()=>{});}
  },[user]);
  useEffect(()=>{setSelBranch("all");},[selOrg]);

  const filteredBranches=useMemo(()=>{
    if(selOrg==="all")return branches;
    return branches.filter(b=>String(b.organization?._id||b.organization)===selOrg);
  },[branches,selOrg]);

  const filtered=useMemo(()=>{
    return suppliers.filter(s=>{
      const q=search.toLowerCase();
      const matchSearch=!q||s.supplierName?.toLowerCase().includes(q)||s.companyName?.toLowerCase().includes(q)||s.city?.toLowerCase().includes(q)||s.gstNumber?.toLowerCase().includes(q)||s.branch?.branchName?.toLowerCase().includes(q)||s.branch?.organization?.name?.toLowerCase().includes(q);
      const matchStatus=statusFilter==="all"?true:statusFilter==="active"?s.status==="ACTIVE":s.status!=="ACTIVE";
      const matchOrg=!isSA||selOrg==="all"?true:String(s.branch?.organization?._id)===selOrg;
      const matchBranch=!isSA||selBranch==="all"?true:String(s.branch?._id)===selBranch;
      return matchSearch&&matchStatus&&matchOrg&&matchBranch;
    });
  },[suppliers,search,statusFilter,selOrg,selBranch,isSA]);

  const handleDelete=(id,name)=>{ setDelError(null); setDelModal({id,name}); };
  const confirmDelete=async()=>{
    if(!delModal)return;
    setDeleting(true); setDelError(null);
    try{ await deleteSupplier(delModal.id); setSuppliers(prev=>prev.filter(s=>s._id!==delModal.id)); setDelModal(null); }
    catch(err){ setDelError(err?.response?.data?.message||"Failed to delete."); }
    finally{ setDeleting(false); }
  };

  const totalOrgs=isSA?new Set(suppliers.map(s=>s.branch?.organization?._id).filter(Boolean)).size:0;
  const totalBranches=isSA?new Set(suppliers.map(s=>s.branch?._id).filter(Boolean)).size:0;
  const activeCount=suppliers.filter(s=>s.status==="ACTIVE").length;
  const showGrouped=isSA&&viewMode==="grouped"&&selBranch==="all";
  const currentOrgName=orgs.find(o=>o._id===selOrg)?.name;
  const currentBranchName=branches.find(b=>b._id===selBranch)?.branchName;
  const orgName=profile?.organization?.name||profile?.branch?.organization?.name;
  const branchName=profile?.branch?.branchName;

  return <>
    {delModal&&<ConfirmModal title="Delete Supplier" message="You're about to permanently delete" itemName={delModal.name} variant="danger" loading={deleting} error={delError} onConfirm={confirmDelete} onCancel={()=>{setDelModal(null);setDelError(null);}} confirmLabel="Delete Supplier"/>}
    <PageShell title="Suppliers" subtitle={isSA?"All suppliers across all organizations & branches":"Manage your branch supplier network"}>

    {/* SA summary pills */}
    {isSA&&<div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
      {[
        ["All",suppliers.length,"rgba(26,26,46,.06)","rgba(26,26,46,.15)","#1a1a2e","all"],
        ["Active",activeCount,PL,PB,P,"active"],
        ["Inactive",suppliers.length-activeCount,RDL,RDB,RD,"inactive"],
      ].map(([label,count,bg,border,color,key])=>(
        <div key={key} onClick={()=>setStatusFilter(key)} style={{padding:"9px 17px",borderRadius:"12px",background:statusFilter===key?border:bg,border:`1.5px solid ${border}`,cursor:"pointer",transition:"all .18s",display:"flex",gap:"9px",alignItems:"center"}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color}}>{count}</span>
          <span style={{fontSize:"11.5px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.55)",letterSpacing:".06em"}}>{label}</span>
        </div>
      ))}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:VL,border:`1px solid ${VB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:V}}>{totalOrgs}</div>
          <div style={{fontSize:"9px",color:V,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>ORGS</div>
        </div>
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:BL,border:`1px solid ${BB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:B}}>{totalBranches}</div>
          <div style={{fontSize:"9px",color:B,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>BRANCHES</div>
        </div>
      </div>
    </div>}

    <BranchScopeBanner branchName={branchName} orgName={orgName}/>

    {/* Toolbar */}
    <div style={{background:"#fff",borderRadius:"14px",padding:"13px 18px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"16px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
      {isSA&&<>
        <div style={{display:"flex",borderRadius:"9px",overflow:"hidden",border:"1px solid rgba(26,26,46,.12)",flexShrink:0}}>
          {[["grouped","Grouped"],["flat","Flat"]].map(([k,label])=>(
            <button key={k} onClick={()=>setViewMode(k)} style={{padding:"6px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all .15s",background:viewMode===k?`linear-gradient(135deg,${V},#6d28d9)`:"#fff",color:viewMode===k?"#fff":"rgba(26,26,46,.5)"}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{width:"1px",height:"24px",background:"rgba(26,26,46,.1)",flexShrink:0}}/>
        <select value={selOrg} onChange={e=>setSelOrg(e.target.value)} style={{padding:"7px 13px",borderRadius:"9px",border:"1px solid rgba(26,26,46,.14)",fontSize:"13px",background:"#fff",cursor:"pointer",outline:"none"}}>
          <option value="all">All Organizations</option>
          {orgs.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}
        </select>
        <select value={selBranch} onChange={e=>setSelBranch(e.target.value)} style={{padding:"7px 13px",borderRadius:"9px",border:"1px solid rgba(26,26,46,.14)",fontSize:"13px",background:"#fff",cursor:"pointer",outline:"none",opacity:selOrg==="all"?0.5:1}} disabled={selOrg==="all"}>
          <option value="all">All Branches</option>
          {filteredBranches.map(b=><option key={b._id} value={b._id}>{b.branchName}{b.city?` — ${b.city}`:""}</option>)}
        </select>
        {(selOrg!=="all"||selBranch!=="all")&&<div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {currentOrgName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentOrgName}</span>}
          {currentBranchName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentBranchName}</span>}
          <button onClick={()=>{setSelOrg("all");setSelBranch("all");}} style={{padding:"3px 10px",borderRadius:"99px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>✕ Clear</button>
        </div>}
      </>}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search suppliers…" value={search} onChange={e=>setSearch(e.target.value)} style={{height:"36px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",outline:"none",paddingLeft:"32px",paddingRight:"12px",fontSize:"13px",fontFamily:"'Poppins',sans-serif",color:"#1a1a2e",background:"#fff",width:"210px"}}
            onFocus={e=>e.target.style.borderColor=PB} onBlur={e=>e.target.style.borderColor="rgba(26,26,46,.12)"}/>
        </div>
        <span style={{fontSize:"12px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{filtered.length} supplier{filtered.length!==1?"s":""}</span>
        <button onClick={loadData} style={{padding:"7px 11px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",background:"#fff",fontSize:"14px",cursor:"pointer"}}>↻</button>
        <ExcelExport
          data={filtered}
          filename="suppliers_export"
          sheetName="Suppliers"
          accent={{color:P,light:PL,border:PB}}
          columns={[
            {key:"supplierName",label:"Supplier Name"},
            {key:"companyName",label:"Company Name"},
            {key:"phoneNumber",label:"Phone"},
            {key:"email",label:"Email"},
            {key:"address",label:"Address"},
            {key:"city",label:"City"},
            {key:"state",label:"State"},
            {key:"gstNumber",label:"GST Number"},
            {key:"openingBalance",label:"Opening Balance (₹)"},
            {key:"status",label:"Status"},
            {key:"branch.branchName",label:"Branch"},
            {key:"branch.organization.name",label:"Organization"},
          ]}
        />
        <button onClick={()=>navigate("/suppliers/add")} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${P},#047857)`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"'Poppins',sans-serif",boxShadow:"0 4px 14px rgba(5,150,105,.3)",whiteSpace:"nowrap"}}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Supplier
        </button>
      </div>
    </div>

    {loading
      ?<div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.35)",fontSize:"13px"}}>Loading suppliers…</div>
      :showGrouped
        ?<GroupedView suppliers={filtered} onDelete={handleDelete} isSA={isSA}/>
        :<FlatView suppliers={filtered} onDelete={handleDelete} isSA={isSA}/>
    }
    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </PageShell>
  </>;
}