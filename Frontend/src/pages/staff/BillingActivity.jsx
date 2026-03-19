import { useState, useEffect, useMemo } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({label,value,sub,color,bg,border}){
  return(
    <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${border}`,padding:"16px 18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:"22px",fontWeight:900,color}}>{value}</div>
      {sub&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color,letterSpacing:".08em",marginTop:"1px"}}>{sub}</div>}
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.42)",letterSpacing:".1em",textTransform:"uppercase",marginTop:"4px"}}>{label}</div>
    </div>
  );
}

function SalesDeskCard({name,role,userId,invoices}){
  const [open,setOpen]=useState(false);
  const myInv=invoices.filter(inv=>String(inv.createdBy?._id||inv.createdBy)===userId);
  const totalSales=myInv.reduce((s,i)=>s+(i.totalAmount||0),0);
  const avgVal=myInv.length>0?Math.round(totalSales/myInv.length):0;
  const rc=role==="ADMIN"?B:P, rb=role==="ADMIN"?BL:PL, rbr=role==="ADMIN"?BB:PB;
  if(myInv.length===0)return null;

  return(
    <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:open?"0 6px 24px rgba(26,26,46,.09)":"0 2px 10px rgba(26,26,46,.04)",transition:"box-shadow .2s"}}>
      <div style={{padding:"13px 18px",display:"flex",alignItems:"center",gap:"12px",cursor:"pointer"}} onClick={()=>setOpen(v=>!v)}>
        <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${rc},${rc}bb)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"14px",fontWeight:800,color:"#fff"}}>{name?.charAt(0)?.toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"13.5px",fontWeight:700,color:"#1a1a2e"}}>{name}</span>
            <span style={{padding:"1px 7px",borderRadius:"99px",background:rb,border:`1px solid ${rbr}`,color:rc,fontFamily:"'DM Mono',monospace",fontSize:"8.5px",fontWeight:700}}>{role}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"20px",flexShrink:0}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"16px",fontWeight:900,color:B}}>{myInv.length}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".07em"}}>INVOICES</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"15px",fontWeight:900,color:V}}>₹{totalSales>=100000?(totalSales/100000).toFixed(1)+"L":totalSales>=1000?(totalSales/1000).toFixed(1)+"k":totalSales.toLocaleString("en-IN")}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".07em"}}>TOTAL SALES</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"15px",fontWeight:900,color:AM}}>₹{avgVal>=1000?(avgVal/1000).toFixed(1)+"k":avgVal.toLocaleString("en-IN")}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".07em"}}>AVG VALUE</div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.28)" strokeWidth="2" width="15" height="15" style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>

      {open&&(
        <div style={{borderTop:"1px solid rgba(26,26,46,.06)",overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"rgba(26,26,46,.03)"}}>
              {["Invoice #","Date","Customer","Items","Amount","Status"].map(h=>(
                <th key={h} style={{padding:"9px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".12em",textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {myInv.slice(0,20).map((inv,i)=>(
                <tr key={inv._id} style={{borderBottom:"1px solid rgba(26,26,46,.04)",background:i%2===0?"#fff":"rgba(26,26,46,.008)"}}>
                  <td style={{padding:"9px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:B,fontWeight:600}}>{inv.invoiceNumber||inv._id?.slice(-6)}</td>
                  <td style={{padding:"9px 14px",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>{new Date(inv.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                  <td style={{padding:"9px 14px",fontSize:"12px",fontWeight:600,color:"#1a1a2e"}}>{inv.customerName||inv.customer?.name||"Walk-in"}</td>
                  <td style={{padding:"9px 14px",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>{inv.items?.length||0} items</td>
                  <td style={{padding:"9px 14px",fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:700,color:V}}>₹{(inv.totalAmount||0).toLocaleString("en-IN")}</td>
                  <td style={{padding:"9px 14px"}}>
                    <span style={{padding:"2px 8px",borderRadius:"99px",fontSize:"9.5px",fontFamily:"'DM Mono',monospace",fontWeight:700,background:inv.status==="PAID"?PL:AML,border:`1px solid ${inv.status==="PAID"?PB:AMB}`,color:inv.status==="PAID"?P:AM}}>
                      {inv.status||"PAID"}
                    </span>
                  </td>
                </tr>
              ))}
              {myInv.length>20&&(
                <tr><td colSpan={6} style={{padding:"8px 14px",fontSize:"11px",color:"rgba(26,26,46,.38)",fontStyle:"italic",textAlign:"center"}}>Showing 20 of {myInv.length} invoices for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BillingActivity(){
  const now=new Date();
  const [month,setMonth]=useState(now.getMonth()+1);
  const [year,setYear]=useState(now.getFullYear());
  const [invoices,setInvoices]=useState([]);
  const [staff,setStaff]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");

  const load=()=>{
    setLoading(true);
    const mStr=String(month).padStart(2,"0");
    const from=dateFrom||`${year}-${mStr}-01`;
    const lastDay=new Date(year,month,0).getDate();
    const to=dateTo||`${year}-${mStr}-${lastDay}`;
    Promise.all([
      axiosInstance.get("/invoices",{params:{dateFrom:from,dateTo:to}}).catch(()=>axiosInstance.get("/invoices")),
      axiosInstance.get("/admin/users",{params:{limit:100}}).catch(()=>({data:[]})),
    ]).then(([inv,us])=>{
      setInvoices(Array.isArray(inv.data)?inv.data:[]);
      const usArr=Array.isArray(us.data)?us.data:Array.isArray(us.data?.data)?us.data.data:[];setStaff(usArr.filter(u=>["STAFF","ADMIN"].includes(u.role)&&u.isActive!==false));
    }).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(()=>{load();},[month,year]);

  const filteredStaff=useMemo(()=>{
    if(!search)return staff;
    const q=search.toLowerCase();
    return staff.filter(s=>s.name?.toLowerCase().includes(q)||s.email?.toLowerCase().includes(q));
  },[staff,search]);

  const overallStats=useMemo(()=>{
    const total=invoices.reduce((s,i)=>s+(i.totalAmount||0),0);
    const staffWithBilling=new Set(invoices.map(i=>String(i.createdBy?._id||i.createdBy))).size;
    const topStaff=staff.map(s=>{
      const myInv=invoices.filter(inv=>String(inv.createdBy?._id||inv.createdBy)===String(s._id));
      return{name:s.name,count:myInv.length,sales:myInv.reduce((sum,i)=>sum+(i.totalAmount||0),0)};
    }).sort((a,b)=>b.sales-a.sales)[0];
    return{total,count:invoices.length,staffWithBilling,topStaff};
  },[invoices,staff]);

  const sel={padding:"8px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.13)",outline:"none",fontSize:"13px",background:"#fff",cursor:"pointer"};

  return(
    <PageShell title="Billing Activity" subtitle="Monitor invoices and sales performance by staff">
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(140px, 100%), 1fr))",gap:"10px",marginBottom:"18px"}}>
        <StatCard label="Total Invoices" value={overallStats.count} color={B} bg={BL} border={BB}/>
        <StatCard label="Total Sales" value={`₹${overallStats.total>=100000?(overallStats.total/100000).toFixed(1)+"L":overallStats.total>=1000?(overallStats.total/1000).toFixed(1)+"k":overallStats.total.toLocaleString("en-IN")}`} color={V} bg={VL} border={VB}/>
        <StatCard label="Active Billers" value={overallStats.staffWithBilling} color={P} bg={PL} border={PB}/>
        <StatCard label="Top Performer" value={overallStats.topStaff?.name||"—"} sub={overallStats.topStaff?`₹${(overallStats.topStaff.sales/1000).toFixed(1)}k · ${overallStats.topStaff.count} invoices`:""} color={AM} bg={AML} border={AMB}/>
      </div>

      {/* Toolbar */}
      <div style={{background:"#fff",borderRadius:"13px",padding:"12px 16px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"14px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <select value={month} onChange={e=>{setMonth(Number(e.target.value));setDateFrom("");setDateTo("");}} style={sel}>{MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
        <select value={year} onChange={e=>{setYear(Number(e.target.value));setDateFrom("");setDateTo("");}} style={sel}>{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
        <div style={{width:1,height:22,background:"rgba(26,26,46,.1)"}}/>
        <span style={{fontSize:"11px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace"}}>CUSTOM RANGE:</span>
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...sel,fontSize:"12px"}}/>
        <span style={{color:"rgba(26,26,46,.3)",fontSize:"12px"}}>–</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...sel,fontSize:"12px"}}/>
        <button onClick={load} style={{...sel,background:`linear-gradient(135deg,${B},#0369a1)`,color:"#fff",border:"none",fontWeight:700}}>Apply</button>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Filter staff…" value={search} onChange={e=>setSearch(e.target.value)} style={{...sel,paddingLeft:"32px",width:"160px"}}/>
        </div>
        <div style={{marginLeft:"auto"}}>
          <ExcelExport
            data={staff.map(s=>{
              const myInv=invoices.filter(inv=>String(inv.createdBy?._id||inv.createdBy)===String(s._id));
              return{name:s.name,role:s.role,invoices:myInv.length,totalSales:myInv.reduce((sum,i)=>sum+(i.totalAmount||0),0),avgValue:myInv.length>0?Math.round(myInv.reduce((sum,i)=>sum+(i.totalAmount||0),0)/myInv.length):0};
            })}
            filename={`billing_activity_${MONTHS[month-1]}_${year}`}
            sheetName="Billing"
            accent={{color:B,light:BL,border:BB}}
            columns={[{key:"name",label:"Staff"},{key:"role",label:"Role"},{key:"invoices",label:"Invoices"},{key:"totalSales",label:"Total Sales (₹)"},{key:"avgValue",label:"Avg Invoice (₹)"}]}
          />
        </div>
      </div>

      {/* Top performers bar */}
      {!loading&&invoices.length>0&&(
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",padding:"16px 18px",marginBottom:"14px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:"12px"}}>Sales Distribution by Staff</div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {staff.map(s=>{
              const myInv=invoices.filter(inv=>String(inv.createdBy?._id||inv.createdBy)===String(s._id));
              const sales=myInv.reduce((sum,i)=>sum+(i.totalAmount||0),0);
              const pct=overallStats.total>0?Math.round((sales/overallStats.total)*100):0;
              if(sales===0)return null;
              return(
                <div key={s._id} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"120px",fontSize:"12px",fontWeight:600,color:"#1a1a2e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{s.name}</div>
                  <div style={{flex:1,height:"8px",borderRadius:"99px",background:"rgba(26,26,46,.07)",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${V},${V}bb)`,borderRadius:"99px",transition:"width .6s ease"}}/>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color:V,width:"36px",textAlign:"right"}}>{pct}%</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:"12px",fontWeight:700,color:"rgba(26,26,46,.6)",width:"70px",textAlign:"right"}}>₹{sales>=1000?(sales/1000).toFixed(1)+"k":sales}</div>
                  <div style={{fontSize:"11px",color:"rgba(26,26,46,.38)",width:"60px",textAlign:"right"}}>{myInv.length} inv.</div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {loading?(
        <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"16px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>Loading billing data…</div>
      ):invoices.length===0?(
        <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"16px",border:"1px solid rgba(26,26,46,.08)"}}>
          <div style={{fontSize:"36px",marginBottom:"10px"}}>🧾</div>
          <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No invoices found for this period</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {filteredStaff.map(s=>(
            <SalesDeskCard key={s._id} name={s.name} role={s.role} userId={String(s._id)} invoices={invoices}/>
          ))}
        </div>
      )}
    </PageShell>
  );
}
