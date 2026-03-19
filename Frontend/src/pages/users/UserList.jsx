import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import BranchScopeBanner from "../../components/ui/BranchScopeBanner";
import axiosInstance from "../../services/axiosInstance";
import { getOrganizations, getBranches } from "../../services/organizationService";
import useAuth from "../../hooks/useAuth";
import ExcelExport from "../../components/ui/ExcelExport";

/* ─── palette ─────────────────────────────────────────────────── */
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const G="#059669",GL="rgba(5,150,105,.08)",GB="rgba(5,150,105,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const OR="#ea580c",ORL="rgba(234,88,12,.08)",ORB="rgba(234,88,12,.2)";

const ROLE={
  SUPER_ADMIN:{ color:V, bg:VL, border:VB, label:"Super Admin" },
  ADMIN:      { color:B, bg:BL, border:BB, label:"Admin" },
  STAFF:      { color:G, bg:GL, border:GB, label:"Staff" },
  CUSTOMER:   { color:AM, bg:AML, border:AMB, label:"Customer" },
};

const thS={padding:"11px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.35)",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"};

function Chip({label,color,bg,border,small}){
  return <span style={{padding:small?"2px 8px":"3px 10px",borderRadius:"99px",background:bg,border:`1px solid ${border}`,color,fontSize:small?"10px":"11px",fontFamily:"'DM Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
}

function RoleBadge({role}){
  const r=ROLE[role]||{color:"rgba(26,26,46,.5)",bg:"rgba(26,26,46,.06)",border:"rgba(26,26,46,.15)",label:role};
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"3px 10px",borderRadius:"99px",background:r.bg,border:`1px solid ${r.border}`,color:r.color,fontSize:"11px",fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:".06em"}}>
    {r.label.replace("_"," ")}
  </span>;
}

function StatusDot({active}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"2px 9px",borderRadius:"99px",background:active?GL:RDL,border:`1px solid ${active?GB:RDB}`,color:active?G:RD,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>
    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"currentColor"}}/>
    {active?"Active":"Inactive"}
  </span>;
}

function UserRow({u,onDelete,showOrgBranch,meId,isSA}){
  const navigate=useNavigate();
  const r=ROLE[u.role]||{color:"rgba(26,26,46,.5)",bg:"rgba(26,26,46,.06)",border:"rgba(26,26,46,.15)"};
  return <tr style={{borderBottom:"1px solid rgba(26,26,46,.042)",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.016)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:r.bg,border:`1.5px solid ${r.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:800,color:r.color,fontFamily:"'Fraunces',serif"}}>
          {u.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:"13.5px",fontWeight:700,color:"#1a1a2e"}}>{u.name}</div>
          <div style={{fontSize:"11px",color:"rgba(26,26,46,.4)",marginTop:"1px"}}>{u.email}</div>
        </div>
      </div>
    </td>
    <td style={{padding:"12px 14px",minWidth:"160px"}}>
      <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
        {u.phone
          ?<div style={{display:"flex",alignItems:"center",gap:"5px"}}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.4)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
            <span style={{fontSize:"11.5px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.65)"}}>{u.phone}</span>
          </div>
          :<span style={{fontSize:"11px",color:"rgba(26,26,46,.2)"}}>—</span>
        }
        {u.address&&<div style={{display:"flex",alignItems:"flex-start",gap:"5px"}}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.4)" strokeWidth="2" style={{marginTop:"1px",flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
          <span style={{fontSize:"11px",color:"rgba(26,26,46,.45)",lineHeight:1.4,maxWidth: "min(130px, 100%)",wordBreak:"break-word"}}>{u.address}</span>
        </div>}
      </div>
    </td>
    <td style={{padding:"12px 14px"}}><RoleBadge role={u.role}/></td>
    {showOrgBranch&&<>
      <td style={{padding:"12px 14px"}}>
        {(u.organization?.name||u.branch?.organization?.name)
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{u.organization?.name||u.branch?.organization?.name}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>—</span>}
      </td>
      <td style={{padding:"12px 14px"}}>
        {u.branch?.branchName
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{u.branch.branchName}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>—</span>}
      </td>
    </>}
    <td style={{padding:"12px 14px"}}><StatusDot active={u.isActive}/></td>
    <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"rgba(26,26,46,.4)"}}>
      {u.createdAt?new Date(u.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
    </td>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={()=>navigate(`/users/edit/${u._id}`)} style={{padding:"5px 12px",borderRadius:"8px",border:"1.5px solid rgba(26,26,46,.14)",background:"#fff",color:"rgba(26,26,46,.7)",fontSize:"12px",fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=VB;e.currentTarget.style.color=V;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(26,26,46,.14)";e.currentTarget.style.color="rgba(26,26,46,.7)";}}>Edit</button>
        {isSA&&u._id!==meId&&<button onClick={()=>onDelete(u)} style={{padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${RDB}`,background:RDL,color:RD,fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Delete</button>}
      </div>
    </td>
  </tr>;
}

function BranchBlock({brName,brCity,users,onDelete,meId,isSA}){
  const [open,setOpen]=useState(true);
  const COLS=["User","Phone & Address","Role","Status","Created","Actions"];
  const activeCount=users.filter(u=>u.isActive).length;
  const roleBreakdown=[...new Set(users.map(u=>u.role))].map(r=>({role:r,count:users.filter(u=>u.role===r).length}));
  return <div style={{border:`1px solid ${BB}`,borderRadius:"13px",overflow:"hidden"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"10px 16px",background:`linear-gradient(135deg,${BL},rgba(2,132,199,.02))`,borderBottom:open?`1px solid ${BB}`:"none",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",userSelect:"none"}}>
      <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
      <span style={{fontWeight:700,fontSize:"13px",color:B}}>{brName==="No Branch"?"No Specific Branch":brName}</span>
      {brCity&&<span style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)"}}>· {brCity}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
        <Chip label={`${users.length} users`} color={B} bg={BL} border={BB} small/>
        <Chip label={`${activeCount} active`} color={G} bg={GL} border={GB} small/>
        {roleBreakdown.map(({role,count})=>{
          const r=ROLE[role]||{color:"rgba(26,26,46,.5)",bg:"rgba(26,26,46,.06)",border:"rgba(26,26,46,.15)"};
          return <Chip key={role} label={`${count} ${role.replace("_"," ").toLowerCase()}`} color={r.color} bg={r.bg} border={r.border} small/>;
        })}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="14" height="14" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.025)",borderBottom:"1px solid rgba(26,26,46,.06)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>{users.map(u=><UserRow key={u._id} u={u} onDelete={onDelete} showOrgBranch={false} meId={meId} isSA={isSA}/>)}</tbody>
      </table>
    </div>}
  </div>;
}

function OrgBlock({orgId,orgName,branches,onDelete,meId,isSA}){
  const [open,setOpen]=useState(true);
  const allUsers=Object.values(branches).flatMap(b=>b.users);
  const activeCount=allUsers.filter(u=>u.isActive).length;
  const roleBreakdown=[...new Set(allUsers.map(u=>u.role))].map(r=>({role:r,count:allUsers.filter(u=>u.role===r).length}));
  return <div style={{background:"#fff",borderRadius:"18px",border:`1px solid ${VB}`,overflow:"hidden",boxShadow:"0 2px 14px rgba(124,58,237,.07)"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"14px 20px",background:`linear-gradient(135deg,${VL},rgba(124,58,237,.03))`,borderBottom:open?`1px solid ${VB}`:"none",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",userSelect:"none"}}>
      <div style={{width:38,height:38,borderRadius:"11px",background:`linear-gradient(135deg,${V},#6d28d9)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,.3)"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="17" height="17"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:"16px",color:"#1a1a2e",letterSpacing:"-.01em"}}>{orgId==="global"?"Global / No Organization":orgName}</div>
        <div style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)",marginTop:"2px"}}>{Object.keys(branches).length} branch{Object.keys(branches).length!==1?"es":""} · {allUsers.length} users</div>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
        <Chip label={`${allUsers.length} users`} color={B} bg={BL} border={BB}/>
        <Chip label={`${activeCount} active`} color={G} bg={GL} border={GB}/>
        {roleBreakdown.map(({role,count})=>{
          const r=ROLE[role]||{color:"rgba(26,26,46,.5)",bg:"rgba(26,26,46,.06)",border:"rgba(26,26,46,.15)"};
          return <Chip key={role} label={`${count} ${role.replace("_"," ").toLowerCase()}`} color={r.color} bg={r.bg} border={r.border}/>;
        })}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="16" height="16" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
      {Object.entries(branches).map(([brId,{brName,brCity,users}])=>(
        <BranchBlock key={brId} brName={brName} brCity={brCity} users={users} onDelete={onDelete} meId={meId} isSA={isSA}/>
      ))}
    </div>}
  </div>;
}

function GroupedView({users,onDelete,meId,isSA}){
  const tree=useMemo(()=>{
    const map={};
    users.forEach(u=>{
      const orgId=u.organization?._id||u.branch?.organization?._id||"global";
      const orgName=u.organization?.name||u.branch?.organization?.name||"No Organization";
      const brId=u.branch?._id||"none";
      const brName=u.branch?.branchName||"No Branch";
      const brCity=u.branch?.city||"";
      if(!map[orgId])map[orgId]={orgName,branches:{}};
      if(!map[orgId].branches[brId])map[orgId].branches[brId]={brName,brCity,users:[]};
      map[orgId].branches[brId].users.push(u);
    });
    return map;
  },[users]);
  if(users.length===0)return <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)"}}>
    <div style={{fontSize:"32px",marginBottom:"10px"}}>👤</div>
    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No users found</div>
  </div>;
  return <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
    {Object.entries(tree).map(([orgId,{orgName,branches}])=>(
      <OrgBlock key={orgId} orgId={orgId} orgName={orgName} branches={branches} onDelete={onDelete} meId={meId} isSA={isSA}/>
    ))}
  </div>;
}

function FlatView({users,onDelete,meId,isSA}){
  const COLS=isSA
    ?["User","Phone & Address","Role","Organization","Branch","Status","Created","Actions"]
    :["User","Phone & Address","Role","Organization","Branch","Status","Created","Actions"];
  return <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 16px rgba(26,26,46,.05)"}}>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {users.length===0
            ?<tr><td colSpan={COLS.length} style={{padding:"60px",textAlign:"center"}}>
              <div style={{fontSize:"32px",marginBottom:"10px"}}>👤</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No users found</div>
            </td></tr>
            :users.map(u=><UserRow key={u._id} u={u} onDelete={onDelete} showOrgBranch={true} meId={meId} isSA={isSA}/>)}
        </tbody>
      </table>
    </div>
  </div>;
}

/* ─── Delete Modal ──────────────────────────────────────────────── */
function DeleteModal({user,onConfirm,onClose,deleting}){
  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(26,26,46,.5)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeUp .2s ease both"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:"#fff",borderRadius:"20px",padding:"32px",width:"100%",maxWidth: "min(400px, 100%)",margin:"0 16px",boxShadow:"0 24px 64px rgba(0,0,0,.18)",border:`1px solid ${RDB}`}}>
      <div style={{width:"52px",height:"52px",borderRadius:"14px",background:RDL,border:`1px solid ${RDB}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"18px"}}>
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={RD} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
      </div>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:900,color:"#1a1a2e",marginBottom:"8px"}}>Delete User?</div>
      <div style={{fontSize:"13.5px",color:"rgba(26,26,46,.55)",lineHeight:1.6,marginBottom:"24px"}}>
        You're about to permanently delete <strong style={{color:"#1a1a2e"}}>{user.name}</strong>. This action cannot be undone.
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:"11px",border:"1.5px solid rgba(26,26,46,.12)",background:"transparent",color:"rgba(26,26,46,.6)",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"'Figtree',sans-serif"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.04)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={deleting} style={{flex:1,padding:"11px",borderRadius:"11px",border:"none",background:deleting?"rgba(239,68,68,.5)":`linear-gradient(135deg,${RD},#b91c1c)`,color:"#fff",fontSize:"13px",fontWeight:700,cursor:deleting?"not-allowed":"pointer",fontFamily:"'Figtree',sans-serif",boxShadow:`0 4px 14px rgba(220,38,38,.3)`}}>
          {deleting?"Deleting…":"Yes, Delete"}
        </button>
      </div>
    </div>
  </div>;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function UserList(){
  const {user:me}=useAuth();
  const navigate=useNavigate();
  const isSA=me?.role==="SUPER_ADMIN";

  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [roleFilter,setRoleFilter]=useState("ALL");
  const [orgs,setOrgs]=useState([]);
  const [branches,setBranches]=useState([]);
  const [selOrg,setSelOrg]=useState("all");
  const [selBranch,setSelBranch]=useState("all");
  const [viewMode,setViewMode]=useState("grouped");
  const [profile,setProfile]=useState(null);
  const [deleteModal,setDeleteModal]=useState(null);
  const [deleting,setDeleting]=useState(false);
  const [error,setError]=useState("");

  const loadUsers=()=>{
    setLoading(true);
    axiosInstance.get("/auth/users")
      .then(r=>{setUsers(r.data);setError("");})
      .catch(err=>setError(err?.response?.data?.message||"Failed to load users."))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{loadUsers();},[]);
  useEffect(()=>{
    if(!isSA)return;
    Promise.all([getOrganizations(),getBranches()]).then(([o,b])=>{setOrgs(o);setBranches(b);}).catch(console.error);
  },[isSA]);
  useEffect(()=>{
    if(me?.role==="ADMIN"){axiosInstance.get("/auth/me").then(r=>setProfile(r.data)).catch(()=>{});}
  },[me]);
  useEffect(()=>{setSelBranch("all");},[selOrg]);

  const filteredBranches=useMemo(()=>{
    if(selOrg==="all")return branches;
    return branches.filter(b=>String(b.organization?._id||b.organization)===selOrg);
  },[branches,selOrg]);

  const filtered=useMemo(()=>{
    return users.filter(u=>{
      const q=search.toLowerCase();
      const matchSearch=!q||u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q)||u.phone?.toLowerCase().includes(q)||u.address?.toLowerCase().includes(q)||u.organization?.name?.toLowerCase().includes(q)||u.branch?.organization?.name?.toLowerCase().includes(q)||u.branch?.branchName?.toLowerCase().includes(q);
      const matchRole=roleFilter==="ALL"?true:u.role===roleFilter;
      const matchOrg=!isSA||selOrg==="all"?true:String(u.organization?._id||u.branch?.organization?._id)===selOrg;
      const matchBranch=!isSA||selBranch==="all"?true:String(u.branch?._id)===selBranch;
      return matchSearch&&matchRole&&matchOrg&&matchBranch;
    });
  },[users,search,roleFilter,selOrg,selBranch,isSA]);

  const handleDelete=async()=>{
    if(!deleteModal)return;
    setDeleting(true);
    try{
      await axiosInstance.delete(`/auth/users/${deleteModal._id}`);
      setUsers(prev=>prev.filter(u=>u._id!==deleteModal._id));
      setDeleteModal(null);
    }catch(err){setError(err?.response?.data?.message||"Failed to delete user.");setDeleteModal(null);}
    finally{setDeleting(false);}
  };

  /* ── computed stats ── */
  const roleStats=["SUPER_ADMIN","ADMIN","STAFF","CUSTOMER"].map(r=>({role:r,...(ROLE[r]||{}),count:users.filter(u=>u.role===r).length}));
  const activeCount=users.filter(u=>u.isActive).length;
  const totalOrgs=isSA?new Set(users.map(u=>u.organization?._id||u.branch?.organization?._id).filter(Boolean)).size:0;
  const totalBranches=isSA?new Set(users.map(u=>u.branch?._id).filter(Boolean)).size:0;
  const showGrouped=isSA&&viewMode==="grouped"&&selBranch==="all";
  const currentOrgName=orgs.find(o=>o._id===selOrg)?.name;
  const currentBranchName=branches.find(b=>b._id===selBranch)?.branchName;
  const orgName=profile?.organization?.name||profile?.branch?.organization?.name;
  const branchName=profile?.branch?.branchName;

  return <PageShell title="Users" subtitle={isSA?"All users across all organizations & branches":"Manage users in your branch"}>

    {/* ── Summary stat pills ── */}
    <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
      {/* All / Active pills */}
      {[
        ["All",users.length,"rgba(26,26,46,.06)","rgba(26,26,46,.15)","#1a1a2e"],
        ["Active",activeCount,GL,GB,G],
        ["Inactive",users.length-activeCount,RDL,RDB,RD],
      ].map(([label,count,bg,border,color])=>(
        <div key={label} style={{padding:"9px 17px",borderRadius:"12px",background:bg,border:`1.5px solid ${border}`,display:"flex",gap:"9px",alignItems:"center"}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color}}>{count}</span>
          <span style={{fontSize:"11.5px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.55)",letterSpacing:".06em"}}>{label}</span>
        </div>
      ))}

      {/* Role pills — clickable filter */}
      <div style={{width:"1px",height:"28px",background:"rgba(26,26,46,.1)",flexShrink:0}}/>
      {roleStats.filter(r=>r.count>0).map(r=>(
        <div key={r.role} onClick={()=>setRoleFilter(roleFilter===r.role?"ALL":r.role)} style={{padding:"9px 17px",borderRadius:"12px",background:roleFilter===r.role?r.border:r.bg,border:`1.5px solid ${r.border}`,cursor:"pointer",transition:"all .18s",display:"flex",gap:"9px",alignItems:"center"}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color:r.color}}>{r.count}</span>
          <span style={{fontSize:"11.5px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.55)",letterSpacing:".06em"}}>{r.label}</span>
        </div>
      ))}

      {/* Org / Branch mini stats */}
      {isSA&&<div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:VL,border:`1px solid ${VB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:V}}>{totalOrgs}</div>
          <div style={{fontSize:"9px",color:V,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>ORGS</div>
        </div>
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:BL,border:`1px solid ${BB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:B}}>{totalBranches}</div>
          <div style={{fontSize:"9px",color:B,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>BRANCHES</div>
        </div>
      </div>}
    </div>

    <BranchScopeBanner branchName={branchName} orgName={orgName}/>

    {/* ── Toolbar ── */}
    <div style={{background:"#fff",borderRadius:"14px",padding:"13px 18px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"16px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
      {isSA&&<>
        {/* View toggle */}
        <div style={{display:"flex",borderRadius:"9px",overflow:"hidden",border:"1px solid rgba(26,26,46,.12)",flexShrink:0}}>
          {[["grouped","Grouped"],["flat","Flat"]].map(([k,label])=>(
            <button key={k} onClick={()=>setViewMode(k)} style={{padding:"6px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all .15s",background:viewMode===k?`linear-gradient(135deg,${V},#6d28d9)`:"#fff",color:viewMode===k?"#fff":"rgba(26,26,46,.5)"}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{width:"1px",height:"24px",background:"rgba(26,26,46,.1)",flexShrink:0}}/>

        {/* Org / Branch selectors */}
        <select value={selOrg} onChange={e=>setSelOrg(e.target.value)} style={{padding:"7px 13px",borderRadius:"9px",border:"1px solid rgba(26,26,46,.14)",fontSize:"13px",background:"#fff",cursor:"pointer",outline:"none"}}>
          <option value="all">All Organizations</option>
          {orgs.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}
        </select>
        <select value={selBranch} onChange={e=>setSelBranch(e.target.value)} style={{padding:"7px 13px",borderRadius:"9px",border:"1px solid rgba(26,26,46,.14)",fontSize:"13px",background:"#fff",cursor:"pointer",outline:"none",opacity:selOrg==="all"?0.5:1}} disabled={selOrg==="all"}>
          <option value="all">All Branches</option>
          {filteredBranches.map(b=><option key={b._id} value={b._id}>{b.branchName}{b.city?` — ${b.city}`:""}</option>)}
        </select>

        {/* Active filter chips */}
        {(selOrg!=="all"||selBranch!=="all")&&<div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {currentOrgName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentOrgName}</span>}
          {currentBranchName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentBranchName}</span>}
          <button onClick={()=>{setSelOrg("all");setSelBranch("all");}} style={{padding:"3px 10px",borderRadius:"99px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>✕ Clear</button>
        </div>}

        {/* Active role chip */}
        {roleFilter!=="ALL"&&<div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          {(()=>{const r=ROLE[roleFilter]||{};return <span style={{padding:"3px 11px",borderRadius:"99px",background:r.bg,border:`1px solid ${r.border}`,color:r.color,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{roleFilter.replace("_"," ")}</span>;})()}
          <button onClick={()=>setRoleFilter("ALL")} style={{padding:"3px 10px",borderRadius:"99px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>✕</button>
        </div>}
      </>}

      {/* Search + count + refresh + add */}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search name, email, org…" value={search} onChange={e=>setSearch(e.target.value)} style={{height:"36px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",outline:"none",paddingLeft:"32px",paddingRight:"12px",fontSize:"13px",fontFamily:"'Figtree',sans-serif",color:"#1a1a2e",background:"#fff",width:"220px"}}
            onFocus={e=>e.target.style.borderColor=VB} onBlur={e=>e.target.style.borderColor="rgba(26,26,46,.12)"}/>
        </div>
        <span style={{fontSize:"12px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{filtered.length} user{filtered.length!==1?"s":""}</span>
        <button onClick={loadUsers} style={{padding:"7px 11px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",background:"#fff",fontSize:"14px",cursor:"pointer"}}>↻</button>
        <ExcelExport
          data={filtered}
          filename="users_export"
          sheetName="Users"
          accent={{color:V,light:VL,border:VB}}
          columns={[
            {key:"name",label:"Name"},
            {key:"email",label:"Email"},
            {key:"phone",label:"Phone"},
            {key:"role",label:"Role"},
            {key:"isActive",label:"Status",format:v=>v?"Active":"Inactive"},
            {key:"branch.branchName",label:"Branch"},
            {key:"branch.organization.name",label:"Organization"},
          ]}
        />
        <button onClick={()=>navigate("/users/add")} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${V},#6d28d9)`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"'Figtree',sans-serif",boxShadow:"0 4px 14px rgba(124,58,237,.3)",whiteSpace:"nowrap"}}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add User
        </button>
      </div>
    </div>

    {/* Error */}
    {error&&<div style={{padding:"10px 14px",borderRadius:"10px",marginBottom:"14px",background:RDL,border:`1px solid ${RDB}`,fontSize:"12px",color:RD,fontFamily:"'DM Mono',monospace"}}>{error}</div>}

    {/* Content */}
    {loading
      ?<div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.35)",fontSize:"13px"}}>Loading users…</div>
      :showGrouped
        ?<GroupedView users={filtered} onDelete={setDeleteModal} meId={me?.id||me?._id} isSA={isSA}/>
        :<FlatView users={filtered} onDelete={setDeleteModal} meId={me?.id||me?._id} isSA={isSA}/>
    }

    {/* Delete modal */}
    {deleteModal&&<DeleteModal user={deleteModal} onConfirm={handleDelete} onClose={()=>setDeleteModal(null)} deleting={deleting}/>}

    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </PageShell>;
}
