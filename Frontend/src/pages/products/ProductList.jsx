import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "../../services/productService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import { PageShell } from "../../components/ui/PageShell";
import BranchScopeBanner from "../../components/ui/BranchScopeBanner";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

/* ─── palette ─────────────────────────────────────────────────── */
const P="#0284c7",PL="rgba(2,132,199,.08)",PB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const G="#059669",GL="rgba(5,150,105,.08)",GB="rgba(5,150,105,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";

const thS={padding:"11px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.35)",letterSpacing:".14em",textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"};

function Chip({label,color,bg,border,small}){
  return <span style={{padding:small?"2px 8px":"3px 10px",borderRadius:"99px",background:bg,border:`1px solid ${border}`,color,fontSize:small?"10px":"11px",fontFamily:"'DM Mono',monospace",fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;
}

function StatusDot({active}){
  const c=active?G:RD;
  return <span style={{display:"inline-flex",alignItems:"center",gap:"5px",padding:"2px 9px",borderRadius:"99px",background:active?GL:RDL,border:`1px solid ${active?GB:RDB}`,color:c,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>
    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"currentColor"}}/>
    {active?"Active":"Inactive"}
  </span>;
}

function ProductRow({p,onDelete,showOrgBranch}){
  const navigate=useNavigate();
  const stockColor=p.stock===0?RD:p.stock<10?AM:G;
  return <tr style={{borderBottom:"1px solid rgba(26,26,46,.042)",transition:"background .12s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.016)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <td style={{padding:"12px 14px"}}>
      <div style={{fontSize:"13.5px",fontWeight:700,color:"#1a1a2e"}}>{p.name}</div>
      {p.barcode&&<div style={{fontSize:"10.5px",color:"rgba(26,26,46,.35)",fontFamily:"'DM Mono',monospace",marginTop:"2px"}}>{p.barcode}</div>}
    </td>
    <td style={{padding:"12px 14px"}}>
      {p.category?.name
        ?<span style={{padding:"2px 9px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontFamily:"'DM Mono',monospace"}}>{p.category.name}</span>
        :<span style={{color:"rgba(26,26,46,.25)"}}>—</span>}
    </td>
    <td style={{padding:"12px 14px",color:"rgba(26,26,46,.5)",fontSize:"12px"}}>
      {p.supplier?.supplierName||<span style={{color:"rgba(26,26,46,.25)"}}>—</span>}
    </td>
    {showOrgBranch&&<>
      <td style={{padding:"12px 14px"}}>
        {p.branch?.organization?.name
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{p.branch.organization.name}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>Global</span>}
      </td>
      <td style={{padding:"12px 14px"}}>
        {p.branch?.branchName
          ?<span style={{padding:"2px 9px",borderRadius:"99px",background:PL,border:`1px solid ${PB}`,color:P,fontSize:"11px",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{p.branch.branchName}</span>
          :<span style={{color:"rgba(26,26,46,.25)",fontSize:"11px"}}>—</span>}
      </td>
    </>}
    <td style={{padding:"12px 14px"}}>
      <span style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:G}}>₹{p.price?.toLocaleString("en-IN")}</span>
    </td>
    <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.45)"}}>
      ₹{p.costPrice?.toLocaleString("en-IN")||"—"}
    </td>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
        <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color:stockColor}}>{p.stock}</span>
        {p.stock===0&&<span style={{fontSize:"9px",fontFamily:"'DM Mono',monospace",color:RD,background:RDL,padding:"1px 6px",borderRadius:"99px",border:`1px solid ${RDB}`}}>OUT</span>}
        {p.stock>0&&p.stock<10&&<span style={{fontSize:"9px",fontFamily:"'DM Mono',monospace",color:AM,background:AML,padding:"1px 6px",borderRadius:"99px",border:`1px solid ${AMB}`}}>LOW</span>}
      </div>
    </td>
    <td style={{padding:"12px 14px"}}><StatusDot active={p.isActive}/></td>
    <td style={{padding:"12px 14px"}}>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={()=>navigate(`/products/edit/${p._id}`)} style={{padding:"5px 12px",borderRadius:"8px",border:"1.5px solid rgba(26,26,46,.14)",background:"#fff",color:"rgba(26,26,46,.7)",fontSize:"12px",fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=PB;e.currentTarget.style.color=P;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(26,26,46,.14)";e.currentTarget.style.color="rgba(26,26,46,.7)";}}>Edit</button>
        <button onClick={()=>onDelete(p._id)} style={{padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${RDB}`,background:RDL,color:RD,fontSize:"12px",fontWeight:600,cursor:"pointer"}}>Delete</button>
      </div>
    </td>
  </tr>;
}

function BranchBlock({brName,brCity,products,onDelete}){
  const [open,setOpen]=useState(true);
  const COLS=["Product","Category","Supplier","Price ₹","Cost ₹","Stock","Status","Actions"];
  const lowCount=products.filter(p=>p.stock>0&&p.stock<10).length;
  const outCount=products.filter(p=>p.stock===0).length;
  return <div style={{border:`1px solid ${PB}`,borderRadius:"13px",overflow:"hidden"}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"10px 16px",background:`linear-gradient(135deg,${PL},rgba(2,132,199,.02))`,borderBottom:open?`1px solid ${PB}`:"none",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",userSelect:"none"}}>
      <svg viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
      <span style={{fontWeight:700,fontSize:"13px",color:P}}>{brName==="No Branch"?"No Specific Branch":brName}</span>
      {brCity&&<span style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)"}}>· {brCity}</span>}
      <div style={{marginLeft:"auto",display:"flex",gap:"6px",alignItems:"center"}}>
        <Chip label={`${products.length} products`} color={P} bg={PL} border={PB} small/>
        {lowCount>0&&<Chip label={`${lowCount} low`} color={AM} bg={AML} border={AMB} small/>}
        {outCount>0&&<Chip label={`${outCount} out`} color={RD} bg={RDL} border={RDB} small/>}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="14" height="14" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.025)",borderBottom:"1px solid rgba(26,26,46,.06)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>{products.map(p=><ProductRow key={p._id} p={p} onDelete={onDelete} showOrgBranch={false}/>)}</tbody>
      </table>
    </div>}
  </div>;
}

function OrgBlock({orgId,orgName,branches,onDelete}){
  const [open,setOpen]=useState(true);
  const allProducts=Object.values(branches).flatMap(b=>b.products);
  const lowCount=allProducts.filter(p=>p.stock>0&&p.stock<10).length;
  const outCount=allProducts.filter(p=>p.stock===0).length;
  return <div style={{background:"#fff",borderRadius:"18px",border:`1px solid ${VB}`,overflow:"hidden",boxShadow:`0 2px 14px ${VL}`}}>
    <div onClick={()=>setOpen(v=>!v)} style={{padding:"14px 20px",background:`linear-gradient(135deg,${VL},rgba(124,58,237,.03))`,borderBottom:open?`1px solid ${VB}`:"none",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",userSelect:"none"}}>
      <div style={{width:38,height:38,borderRadius:"11px",background:`linear-gradient(135deg,${V},#6d28d9)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 12px rgba(124,58,237,.3)"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="17" height="17"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Fraunces',serif",fontWeight:800,fontSize:"16px",color:"#1a1a2e",letterSpacing:"-.01em"}}>{orgId==="global"?"Global / No Organization":orgName}</div>
        <div style={{fontSize:"11.5px",color:"rgba(26,26,46,.4)",marginTop:"2px"}}>{Object.keys(branches).length} branch{Object.keys(branches).length!==1?"es":""} · {allProducts.length} products</div>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        <Chip label={`${allProducts.length} total`} color={P} bg={PL} border={PB}/>
        {lowCount>0&&<Chip label={`${lowCount} low`} color={AM} bg={AML} border={AMB}/>}
        {outCount>0&&<Chip label={`${outCount} out`} color={RD} bg={RDL} border={RDB}/>}
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.3)" strokeWidth="2" width="16" height="16" style={{transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>
    </div>
    {open&&<div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>
      {Object.entries(branches).map(([brId,{brName,brCity,products}])=>(
        <BranchBlock key={brId} brName={brName} brCity={brCity} products={products} onDelete={onDelete}/>
      ))}
    </div>}
  </div>;
}

function GroupedView({products,onDelete}){
  const tree=useMemo(()=>{
    const map={};
    products.forEach(p=>{
      const orgId=p.branch?.organization?._id||"global";
      const orgName=p.branch?.organization?.name||"No Organization";
      const brId=p.branch?._id||"none";
      const brName=p.branch?.branchName||"No Branch";
      const brCity=p.branch?.city||"";
      if(!map[orgId])map[orgId]={orgName,branches:{}};
      if(!map[orgId].branches[brId])map[orgId].branches[brId]={brName,brCity,products:[]};
      map[orgId].branches[brId].products.push(p);
    });
    return map;
  },[products]);
  if(products.length===0)return <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)"}}>
    <div style={{fontSize:"32px",marginBottom:"10px"}}>📦</div>
    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No products found</div>
  </div>;
  return <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
    {Object.entries(tree).map(([orgId,{orgName,branches}])=>(
      <OrgBlock key={orgId} orgId={orgId} orgName={orgName} branches={branches} onDelete={onDelete}/>
    ))}
  </div>;
}

function FlatView({products,onDelete,isSA}){
  const COLS=isSA
    ?["Product","Category","Supplier","Organization","Branch","Price ₹","Cost ₹","Stock","Status","Actions"]
    :["Product","Category","Supplier","Price ₹","Cost ₹","Stock","Status","Actions"];
  return <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 16px rgba(26,26,46,.05)"}}>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>{COLS.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {products.length===0
            ?<tr><td colSpan={COLS.length} style={{padding:"60px",textAlign:"center"}}>
              <div style={{fontSize:"32px",marginBottom:"10px"}}>📦</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.5)"}}>No products found</div>
            </td></tr>
            :products.map(p=><ProductRow key={p._id} p={p} onDelete={onDelete} showOrgBranch={isSA}/>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export default function ProductList(){
  const {user}=useAuth();
  const navigate=useNavigate();
  const isSA=user?.role==="SUPER_ADMIN";

  const [products,setProducts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [orgs,setOrgs]=useState([]);
  const [branches,setBranches]=useState([]);
  const [selOrg,setSelOrg]=useState("all");
  const [selBranch,setSelBranch]=useState("all");
  const [viewMode,setViewMode]=useState("grouped");
  const [profile,setProfile]=useState(null);

  const loadData=()=>{
    setLoading(true);
    getProducts().then(d=>{setProducts(d);}).catch(()=>{}).finally(()=>setLoading(false));
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
    return products.filter(p=>{
      const q=search.toLowerCase();
      const matchSearch=!q||p.name?.toLowerCase().includes(q)||p.barcode?.includes(q)||p.category?.name?.toLowerCase().includes(q)||p.supplier?.supplierName?.toLowerCase().includes(q)||p.branch?.branchName?.toLowerCase().includes(q)||p.branch?.organization?.name?.toLowerCase().includes(q);
      const matchStatus=statusFilter==="all"?true:statusFilter==="active"?p.isActive:!p.isActive;
      const matchOrg=!isSA||selOrg==="all"?true:String(p.branch?.organization?._id)===selOrg;
      const matchBranch=!isSA||selBranch==="all"?true:String(p.branch?._id)===selBranch;
      return matchSearch&&matchStatus&&matchOrg&&matchBranch;
    });
  },[products,search,statusFilter,selOrg,selBranch,isSA]);

  const handleDelete=async(id)=>{
    if(!window.confirm("Delete this product?"))return;
    try{await deleteProduct(id);setProducts(prev=>prev.filter(p=>p._id!==id));}
    catch(err){alert(err?.response?.data?.message||"Failed to delete.");}
  };

  const totalOrgs=isSA?new Set(products.map(p=>p.branch?.organization?._id).filter(Boolean)).size:0;
  const totalBranches=isSA?new Set(products.map(p=>p.branch?._id).filter(Boolean)).size:0;
  const lowStock=products.filter(p=>p.stock>0&&p.stock<10).length;
  const outOfStock=products.filter(p=>p.stock===0).length;
  const showGrouped=isSA&&viewMode==="grouped"&&selBranch==="all";
  const currentOrgName=orgs.find(o=>o._id===selOrg)?.name;
  const currentBranchName=branches.find(b=>b._id===selBranch)?.branchName;
  const orgName=profile?.organization?.name||profile?.branch?.organization?.name;
  const branchName=profile?.branch?.branchName;

  return <PageShell title="Products" subtitle={isSA?"All products across all organizations & branches":"Manage your branch product catalogue"}>

    {/* SA summary pills */}
    {isSA&&<div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap",alignItems:"center"}}>
      {[
        ["All",products.length,"rgba(26,26,46,.06)","rgba(26,26,46,.15)","#1a1a2e","all"],
        ["Active",products.filter(p=>p.isActive).length,GL,GB,G,"active"],
        ["Inactive",products.filter(p=>!p.isActive).length,RDL,RDB,RD,"inactive"],
        ["Low Stock",lowStock,AML,AMB,AM,"low"],
        ["Out",outOfStock,RDL,RDB,RD,"out"],
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
        <div style={{textAlign:"center",padding:"6px 14px",borderRadius:"10px",background:PL,border:`1px solid ${PB}`}}>
          <div style={{fontSize:"15px",fontWeight:800,color:P}}>{totalBranches}</div>
          <div style={{fontSize:"9px",color:P,fontFamily:"'DM Mono',monospace",letterSpacing:".08em"}}>BRANCHES</div>
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
        {(selOrg!=="all"||selBranch!=="all")&&<div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          {currentOrgName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:VL,border:`1px solid ${VB}`,color:V,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentOrgName}</span>}
          {currentBranchName&&<span style={{padding:"3px 11px",borderRadius:"99px",background:PL,border:`1px solid ${PB}`,color:P,fontSize:"11px",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{currentBranchName}</span>}
          <button onClick={()=>{setSelOrg("all");setSelBranch("all");}} style={{padding:"3px 10px",borderRadius:"99px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>✕ Clear</button>
        </div>}
      </>}
      <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"center"}}>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} style={{height:"36px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",outline:"none",paddingLeft:"32px",paddingRight:"12px",fontSize:"13px",fontFamily:"'Figtree',sans-serif",color:"#1a1a2e",background:"#fff",width:"220px"}}/>
        </div>
        <span style={{fontSize:"12px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{filtered.length} product{filtered.length!==1?"s":""}</span>
        <button onClick={loadData} style={{padding:"7px 11px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",background:"#fff",fontSize:"14px",cursor:"pointer"}}>↻</button>
        <ExcelExport
          data={filtered}
          filename="products_export"
          sheetName="Products"
          accent={{color:P,light:PL,border:PB}}
          columns={[
            {key:"name",label:"Product Name"},
            {key:"barcode",label:"Barcode"},
            {key:"category.name",label:"Category"},
            {key:"supplier.supplierName",label:"Supplier"},
            {key:"price",label:"Price (₹)"},
            {key:"costPrice",label:"Cost Price (₹)"},
            {key:"stock",label:"Stock"},
            {key:"unit",label:"Unit"},
            {key:"isActive",label:"Status",format:v=>v?"Active":"Inactive"},
            {key:"branch.branchName",label:"Branch"},
            {key:"branch.organization.name",label:"Organization"},
            {key:"description",label:"Description"},
          ]}
        />
        <button onClick={()=>navigate("/products/add")} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",borderRadius:"10px",border:"none",cursor:"pointer",background:`linear-gradient(135deg,${P},#0369a1)`,color:"#fff",fontSize:"13px",fontWeight:700,fontFamily:"'Figtree',sans-serif",boxShadow:`0 4px 14px rgba(2,132,199,.3)`,whiteSpace:"nowrap"}}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Product
        </button>
      </div>
    </div>

    {loading
      ?<div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.35)",fontSize:"13px"}}>Loading products…</div>
      :showGrouped
        ?<GroupedView products={filtered} onDelete={handleDelete}/>
        :<FlatView products={filtered} onDelete={handleDelete} isSA={isSA}/>
    }
    <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </PageShell>;
}
