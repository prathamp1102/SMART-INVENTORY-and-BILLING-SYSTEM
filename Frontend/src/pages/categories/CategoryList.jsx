import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, deleteCategory } from "../../services/productService";

/* ─── Delete Confirm Modal ────────────────────────────────────── */
function DeleteModal({ categoryName, onConfirm, onCancel, deleting, error }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0, background: "rgba(10,10,26,.55)",
          backdropFilter: "blur(4px)", zIndex: 1000,
          animation: "fadeIn .18s ease",
        }}
      />
      {/* Modal card */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 1001, width: "min(420px, calc(100vw - 32px))",
        background: "#fff", borderRadius: "22px",
        boxShadow: "0 24px 80px rgba(10,10,26,.22), 0 4px 24px rgba(220,38,38,.08)",
        overflow: "hidden",
        animation: "popIn .22s cubic-bezier(.34,1.4,.64,1)",
      }}>
        {/* Red top strip */}
        <div style={{
          height: "5px",
          background: "linear-gradient(90deg,#dc2626,#ef4444,#f87171)",
        }} />

        <div style={{ padding: "28px 28px 24px" }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: "16px",
            background: "rgba(239,68,68,.1)", border: "1.5px solid rgba(239,68,68,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "18px",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Poppins',sans-serif", fontSize: "18px",
            fontWeight: 700, color: "#1a1a2e", marginBottom: "8px",
            letterSpacing: "-.02em",
          }}>
            Delete Category
          </div>

          {/* Body */}
          <div style={{ fontSize: "13.5px", color: "rgba(26,26,46,.55)", lineHeight: 1.6, marginBottom: "6px" }}>
            You're about to permanently delete
          </div>
          {categoryName && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "6px 13px", borderRadius: "10px",
              background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.18)",
              marginBottom: "14px",
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
              </svg>
              <span style={{
                fontFamily: "'DM Mono',monospace", fontSize: "13px",
                fontWeight: 700, color: "#dc2626",
              }}>{categoryName}</span>
            </div>
          )}
          <div style={{ fontSize: "13px", color: "rgba(26,26,46,.42)", lineHeight: 1.55 }}>
            This action <strong style={{ color: "#dc2626" }}>cannot be undone</strong>. All data associated with this category will be permanently removed.
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "14px", padding: "10px 14px", borderRadius: "10px",
              background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)",
              color: "#dc2626", fontSize: "12.5px", display: "flex", gap: "7px", alignItems: "center",
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              onClick={onCancel}
              disabled={deleting}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: "1.5px solid rgba(26,26,46,.14)", background: "#fff",
                color: "rgba(26,26,46,.6)", fontSize: "13.5px", fontWeight: 600,
                cursor: deleting ? "not-allowed" : "pointer",
                fontFamily: "'Poppins',sans-serif", transition: "all .15s",
              }}
              onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = "rgba(26,26,46,.04)"; e.currentTarget.style.borderColor = "rgba(26,26,46,.22)"; }}}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(26,26,46,.14)"; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: "none",
                background: deleting ? "rgba(220,38,38,.5)" : "linear-gradient(135deg,#dc2626,#b91c1c)",
                color: "#fff", fontSize: "13.5px", fontWeight: 700,
                cursor: deleting ? "not-allowed" : "pointer",
                fontFamily: "'Poppins',sans-serif",
                boxShadow: deleting ? "none" : "0 4px 18px rgba(220,38,38,.35)",
                transition: "all .15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
              }}
              onMouseEnter={e => { if (!deleting) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {deleting ? (
                <>
                  <svg style={{ animation: "spin .7s linear infinite" }} viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Deleting…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes popIn  { from { opacity:0; transform:translate(-50%,-50%) scale(.92) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
        @keyframes spin   { to { transform:rotate(360deg) } }
      `}</style>
    </>
  );
}
import { getOrganizations, getBranches } from "../../services/organizationService";
import { PageShell } from "../../components/ui/PageShell";
import BranchScopeBanner from "../../components/ui/BranchScopeBanner";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

/* ─── palette ─────────────────────────────────────────────────── */
const P="#7c3aed",PL="rgba(124,58,237,.08)",PB="rgba(124,58,237,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const G="#059669",GL="rgba(5,150,105,.08)",GB="rgba(5,150,105,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";

const thS={padding:"11px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.35)",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"};

function Chip({label,color,bg,border,small}){
  return <span style={{padding:small?"2px 8px":"3px 10px",borderRadius:"99px",background:bg,border:`1px solid ${border}`,color,fontSize:small?"10px":"11px",fontFamily:"'DM Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
}

function StatusDot({active}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"2px 9px",borderRadius:"99px",background:active?GL:RDL,border:`1px solid ${active?GB:RDB}`,color:active?G:RD,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>
    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"currentColor"}}/>
    {active?"Active":"Inactive"}
  </span>;
}

function CategoryRow({c,onDelete,showOrgBranch}){
  const navigate=useNavigate();
  return <tr style={{borderBottom:"1px solid rgba(26,26,46,.042)",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.016)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{width:32,height:32,borderRadius:"9px",background:`linear-gradient(135deg,${P},#6d28d9)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 2px 8px rgba(124,58,237,.25)`}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>
        </div>
        <div>
          <div style={{fontSize:"13.5px",fontWeight:700,color:"#1a1a2e"}}>{c.name}</div>
          {c.description&&<div style={{fontSize:"11px",color:"rgba(26,26,46,.38)",marginTop:"2px",maxWidth: "min(180px, 100%)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.description}</div>}
        </div>
      </div>
    </td>
    {showOrgBranch&&<>
      <td style={{padding:"12px 14px"}}>
        {c.branch?.organization?.name
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:PL,border:`1px solid ${PB}`,color:P,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{c.branch.organization.name}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>Global</span>}
      </td>
      <td style={{padding:"12px 14px"}}>
        {c.branch?.branchName
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{c.branch.branchName}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>—</span>}
      </td>
    </>}
    <td style={{padding:"12px 14px"}}><StatusDot active={c.isActive}/></td>
    <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"rgba(26,26,46,.4)"}}>
      {c.createdAt?new Date(c.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"}
    </td>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={()=>navigate(`/categories/edit/${c._id}`)} style={{padding:"5px 12px",borderRadius:"8px",border:"1.5px solid rgba(26,26,46,.14)",background:"#fff",color:"rgba(26,26,46,.7)",fontSize:"12px",fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=PB;e.currentTarget.style.color=P;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(26,26,46,.14)";e.currentTarget.style.color="rgba(26,26,46,.7)";}}>Edit</button>
        <button onClick={()=>onDelete(c._id, c.name)} style={{padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${RDB}`,background:RDL,color:RD,fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Delete</button>
      </div>
    </td>
  </tr>;
}

function BranchBlock({brName,brCity,categories,onDelete}){
  const [open,setOpen]=useState(true);
  const COLS=["Category","Status","Created","Actions"];
  const activeCount=categories.filter(c=>c.isActive).length;
  return <div style={{border:`1px solid ${BB}`,borderRadius:"13px",overflow:"hidden"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"10px 16px",background:`linear-gradient(135deg,${BL},rgba(2,132,199,.02))`,borderBottom:open?`1px solid ${BB}`:"none",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",userSelect:"none"}}>
      <svg viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
      <span style={{fontWeight:700,fontSize:"13px",color:B}}>{brName==="No Branch"?"No Specific Branch":brName}</span>
      {brCity&&<span style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)"}}>· {brCity}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
        <Chip label={`${categories.length} categories`} color={B} bg={BL} border={BB} small/>
        {activeCount<categories.length&&<Chip label={`${categories.length-activeCount} inactive`} color={AM} bg={AML} border={AMB} small/>}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="14" height="14" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.025)",borderBottom:"1px solid rgba(26,26,46,.06)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>{categories.map(c=><CategoryRow key={c._id} c={c} onDelete={onDelete} showOrgBranch={false}/>)}</tbody>
      </table>
    </div>}
  </div>;
}

function OrgBlock({orgId,orgName,branches,onDelete}){
  const [open,setOpen]=useState(true);
  const allCats=Object.values(branches).flatMap(b=>b.categories);
  const activeCount=allCats.filter(c=>c.isActive).length;
  return <div style={{background:"#fff",borderRadius:"18px",border:`1px solid ${PB}`,overflow:"hidden",boxShadow:"0 2px 14px rgba(124,58,237,.07)"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"14px 20px",background:`linear-gradient(135deg,${PL},rgba(124,58,237,.03))`,borderBottom:open?`1px solid ${PB}`:"none",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",userSelect:"none"}}>
      <div style={{width:38,height:38,borderRadius:"11px",background:`linear-gradient(135deg,${P},#6d28d9)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,.3)"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="17" height="17"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:"16px",color:"#1a1a2e",letterSpacing:"-.01em"}}>{orgId==="global"?"Global / No Organization":orgName}</div>
        <div style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)",marginTop:"2px"}}>{Object.keys(branches).length} branch{Object.keys(branches).length!==1?"es":""} · {allCats.length} categories</div>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        <Chip label={`${allCats.length} categories`} color={B} bg={BL} border={BB}/>
        <Chip label={`${activeCount} active`} color={G} bg={GL} border={GB}/>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="16" height="16" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
      {Object.entries(branches).map(([brId,{brName,brCity,categories}])=>(
        <BranchBlock key={brId} brName={brName} brCity={brCity} categories={categories} onDelete={onDelete}/>
      ))}
    </div>}
  </div>;
}

function GroupedView({categories,onDelete}){
  const tree=useMemo(()=>{
    const map={};
    categories.forEach(c=>{
      const orgId=c.branch?.organization?._id||"global";
      const orgName=c.branch?.organization?.name||"No Organization";
      const brId=c.branch?._id||"none";
      const brName=c.branch?.branchName||"No Branch";
      const brCity=c.branch?.city||"";
      if(!map[orgId])map[orgId]={orgName,branches:{}};
      if(!map[orgId].branches[brId])map[orgId].branches[brId]={brName,brCity,categories:[]};
      map[orgId].branches[brId].categories.push(c);
    });
    return map;
  },[categories]);
  if(categories.length===0)return <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)"}}>
    <div style={{fontSize:"32px",marginBottom:"10px"}}>🏷️</div>
    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No categories found</div>
  </div>;
  return <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
    {Object.entries(tree).map(([orgId,{orgName,branches}])=>(
      <OrgBlock key={orgId} orgId={orgId} orgName={orgName} branches={branches} onDelete={onDelete}/>
    ))}
  </div>;
}

function FlatView({categories,onDelete,isSA}){
  const COLS=isSA
    ?["Category","Organization","Branch","Status","Created","Actions"]
    :["Category","Status","Created","Actions"];
  return <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 16px rgba(26,26,46,.05)"}}>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {categories.length===0
            ?<tr><td colSpan={COLS.length} style={{padding:"60px",textAlign:"center"}}>
              <div style={{fontSize:"32px",marginBottom:"10px"}}>🏷️</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No categories found</div>
            </td></tr>
            :categories.map(c=><CategoryRow key={c._id} c={c} onDelete={onDelete} showOrgBranch={isSA}/>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export default function CategoryList(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const isSA=user?.role==="SUPER_ADMIN";

  const [categories,setCategories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [orgs,setOrgs]=useState([]);
  const [branches,setBranches]=useState([]);
  const [selOrg,setSelOrg]=useState("all");
  const [selBranch,setSelBranch]=useState("all");
  const [viewMode,setViewMode]=useState("grouped");
  const [profile,setProfile]=useState(null);
  const [deleteModal,setDeleteModal]=useState(null); // { id, name }
  const [deleting,setDeleting]=useState(false);
  const [deleteError,setDeleteError]=useState(null);

  const loadData=()=>{
    setLoading(true);
    getCategories().then(d=>{setCategories(d);}).catch(()=>{}).finally(()=>setLoading(false));
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
    return categories.filter(c=>{
      const q=search.toLowerCase();
      const matchSearch=!q||c.name?.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q)||c.branch?.branchName?.toLowerCase().includes(q)||c.branch?.organization?.name?.toLowerCase().includes(q);
      const matchStatus=statusFilter==="all"?true:statusFilter==="active"?c.isActive:!c.isActive;
      const matchOrg=!isSA||selOrg==="all"?true:String(c.branch?.organization?._id)===selOrg;
      const matchBranch=!isSA||selBranch==="all"?true:String(c.branch?._id)===selBranch;
      return matchSearch&&matchStatus&&matchOrg&&matchBranch;
    });
  },[categories,search,statusFilter,selOrg,selBranch,isSA]);

  const handleDelete = (id, name) => {
    setDeleteError(null);
    setDeleteModal({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(deleteModal.id);
      setCategories(prev => prev.filter(c => c._id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || "Failed to delete. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const totalOrgs=isSA?new Set(categories.map(c=>c.branch?.organization?._id).filter(Boolean)).size:0;
  const totalBranches=isSA?new Set(categories.map(c=>c.branch?._id).filter(Boolean)).size:0;
  const activeCount=categories.filter(c=>c.isActive).length;
  const showGrouped=isSA&&viewMode==="grouped"&&selBranch==="all";
  const currentOrgName=orgs.find(o=>o._id===selOrg)?.name;
  const currentBranchName=branches.find(b=>b._id===selBranch)?.branchName;
  const orgName=profile?.organization?.name||profile?.branch?.organization?.name;
  const branchName=profile?.branch?.branchName;

  return <PageShell title="Categories" subtitle={isSA?"All categories across all organizations & branches":"Manage your branch categories"}>
    {deleteModal && (
      <DeleteModal
        categoryName={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteModal(null); setDeleteError(null); }}
        deleting={deleting}
        error={deleteError}
      />
    )}

    {/* SA summary pills */}
    {isSA&&<div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
      {[
        ["All",categories.length,"rgba(26,26,46,.06)","rgba(26,26,46,.15)","#1a1a2e","all"],
        ["Active",activeCount,GL,GB,G,"active"],
        ["Inactive",categories.length-activeCount,RDL,RDB,RD,"inactive"],
      ].map(([label,count,bg,border,color,key])=>(
        <div key={key} onClick={()=>setStatusFilter(key)} style={{padding:"9px 17px",borderRadius:"12px",background:statusFilter===key?border:bg,border:`1.5px solid ${border}`,cursor:"pointer",transition:"all .18s",display:"flex",gap:"9px",alignItems:"center"}}>
          <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color}}>{count}</span>
          <span style={{fontSize:"11.5px",fontFamily:"'DM Mono',monospace",color:"rgba(26,26,46,.55)",letterSpacing:".06em"}}>{label}</span>
        </div>
      ))}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px"}}>
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:PL,border:`1px solid ${PB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:P}}>{totalOrgs}</div>
          <div style={{fontSize:"9px",color:P,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>ORGS</div>
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
            <button key={k} onClick={()=>setViewMode(k)} style={{padding:"6px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all .15s",background:viewMode===k?`linear-gradient(135deg,${P},#6d28d9)`:"#fff",color:viewMode===k?"#fff":"rgba(26,26,46,.5)"}}>
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
          {currentOrgName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:PL,border:`1px solid ${PB}`,color:P,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentOrgName}</span>}
          {currentBranchName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentBranchName}</span>}
          <button onClick={()=>{setSelOrg("all");setSelBranch("all");}} style={{padding:"3px 10px",borderRadius:"99px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>✕ Clear</button>
        </div>}
      </>}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search categories…" value={search} onChange={e=>setSearch(e.target.value)} style={{height:"36px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",outline:"none",paddingLeft:"32px",paddingRight:"12px",fontSize:"13px",fontFamily:"'Poppins',sans-serif",color:"#1a1a2e",background:"#fff",width:"210px"}}
            onFocus={e=>e.target.style.borderColor=PB} onBlur={e=>e.target.style.borderColor="rgba(26,26,46,.12)"}/>
        </div>
        <span style={{fontSize:"12px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{filtered.length} categor{filtered.length!==1?"ies":"y"}</span>
        <button onClick={loadData} style={{padding:"7px 11px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",background:"#fff",fontSize:"14px",cursor:"pointer"}}>↻</button>
        <ExcelExport
          data={filtered}
          filename="categories_export"
          sheetName="Categories"
          accent={{color:P,light:PL,border:PB}}
          columns={[
            {key:"name",label:"Category Name"},
            {key:"description",label:"Description"},
            {key:"isActive",label:"Status",format:v=>v?"Active":"Inactive"},
            {key:"branch.organization.name",label:"Organization"},
            {key:"branch.branchName",label:"Branch"},
            {key:"branch.city",label:"Branch City"},
            {key:"branch.state",label:"Branch State"},
          ]}
        />
        <button onClick={()=>navigate("/categories/add")} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${P},#6d28d9)`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"'Poppins',sans-serif",boxShadow:"0 4px 14px rgba(124,58,237,.3)",whiteSpace:"nowrap"}}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Category
        </button>
      </div>
    </div>

    {loading
      ?<div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.35)",fontSize:"13px"}}>Loading categories…</div>
      :showGrouped
        ?<GroupedView categories={filtered} onDelete={handleDelete}/>
        :<FlatView categories={filtered} onDelete={handleDelete} isSA={isSA}/>
    }
    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </PageShell>;
}