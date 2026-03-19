import { useState, useEffect, useMemo } from "react";
import { PageShell } from "../../components/ui/PageShell";
import { getAttendanceSummaryApi } from "../../services/attendanceService";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function daysInMonth(m,y){return new Date(y,m,0).getDate();}

function Bar({pct,color}){
  return(
    <div style={{height:"5px",borderRadius:"99px",background:"rgba(26,26,46,.07)",overflow:"hidden",flex:1}}>
      <div style={{height:"100%",width:`${Math.min(100,pct)}%`,background:color,borderRadius:"99px",transition:"width .5s"}}/>
    </div>
  );
}
function Grade({pct}){
  const [g,c]=pct>=90?["A+",P]:pct>=75?["A",P]:pct>=60?["B",AM]:pct>=40?["C",AM]:["D",RD];
  return <span style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color:c}}>{g}</span>;
}
function Mini({label,value,color,bg,border}){
  return(
    <div style={{textAlign:"center",padding:"8px 10px",borderRadius:"10px",background:bg,border:`1px solid ${border}`}}>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:"15px",fontWeight:900,color}}>{value}</div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.4)",letterSpacing:".1em",textTransform:"uppercase",marginTop:"2px"}}>{label}</div>
    </div>
  );
}

function StaffCard({s,invoices,totalDays}){
  const [open,setOpen]=useState(false);
  const {user,present,halfDay,totalHours,totalDays:attDays}=s;
  const myInv=invoices.filter(inv=>String(inv.createdBy?._id||inv.createdBy)===String(user.id));
  const totalSales=myInv.reduce((sum,i)=>sum+(i.totalAmount||0),0);
  const absent=Math.max(0,totalDays-present-halfDay);
  const attPct=totalDays>0?Math.round(((present+halfDay*.5)/totalDays)*100):0;
  const attColor=attPct>=75?P:attPct>=50?AM:RD;
  const rc=user.role==="ADMIN"?B:P, rb=user.role==="ADMIN"?BL:PL, rbr=user.role==="ADMIN"?BB:PB;
  const fmtSales=totalSales>=100000?(totalSales/100000).toFixed(1)+"L":totalSales>=1000?(totalSales/1000).toFixed(1)+"k":totalSales.toString();

  return(
    <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:open?"0 6px 24px rgba(26,26,46,.09)":"0 2px 10px rgba(26,26,46,.04)",transition:"box-shadow .2s"}}>
      <div style={{padding:"13px 18px",display:"flex",alignItems:"center",gap:"12px",cursor:"pointer"}} onClick={()=>setOpen(v=>!v)}>
        <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${rc},${rc}bb)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"14px",fontWeight:800,color:"#fff"}}>
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{minWidth:0,flex:"0 0 180px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
            <span style={{fontSize:"13px",fontWeight:700,color:"#1a1a2e"}}>{user.name}</span>
            <span style={{padding:"1px 7px",borderRadius:"99px",background:rb,border:`1px solid ${rbr}`,color:rc,fontFamily:"'DM Mono',monospace",fontSize:"8.5px",fontWeight:700}}>{user.role}</span>
          </div>
          <div style={{fontSize:"11px",color:"rgba(26,26,46,.38)",marginTop:"1px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        </div>
        <div style={{flex:1,minWidth:"100px",display:"flex",alignItems:"center",gap:"8px"}}>
          <Bar pct={attPct} color={attColor}/>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color:attColor,width:"32px",textAlign:"right"}}>{attPct}%</span>
          <Grade pct={attPct}/>
        </div>
        <div style={{display:"flex",gap:"16px",flexShrink:0}}>
          <div style={{textAlign:"center",minWidth:50}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:B}}>{myInv.length}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".06em"}}>INVOICES</div>
          </div>
          <div style={{textAlign:"center",minWidth:56}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:800,color:V}}>₹{fmtSales}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".06em"}}>SALES</div>
          </div>
          <div style={{textAlign:"center",minWidth:44}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:AM}}>{totalHours}h</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.38)",letterSpacing:".06em"}}>HOURS</div>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,46,.28)" strokeWidth="2" width="15" height="15" style={{flexShrink:0,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
      </div>

      {open&&(
        <div style={{padding:"14px 18px 18px",borderTop:"1px solid rgba(26,26,46,.06)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div style={{background:"rgba(26,26,46,.02)",borderRadius:"12px",padding:"13px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:"10px"}}>Attendance Breakdown</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"7px",marginBottom:"10px"}}>
              <Mini label="Present" value={present} color={P} bg={PL} border={PB}/>
              <Mini label="Half Day" value={halfDay} color={AM} bg={AML} border={AMB}/>
              <Mini label="Absent" value={absent} color={RD} bg={RDL} border={RDB}/>
            </div>
            <div style={{fontSize:"12px",color:"rgba(26,26,46,.5)",display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
              <span>Avg hours/day</span>
              <span style={{fontWeight:700,color:B}}>{attDays>0?Math.round((totalHours/attDays)*10)/10:0}h</span>
            </div>
            <div style={{fontSize:"12px",color:"rgba(26,26,46,.5)",display:"flex",justifyContent:"space-between"}}>
              <span>Total hours</span>
              <span style={{fontWeight:700,color:B}}>{totalHours}h</span>
            </div>
          </div>
          <div style={{background:"rgba(26,26,46,.02)",borderRadius:"12px",padding:"13px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:"10px"}}>Billing Activity</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginBottom:"10px"}}>
              <Mini label="Invoices" value={myInv.length} color={B} bg={BL} border={BB}/>
              <Mini label="Avg Value" value={myInv.length>0?"₹"+Math.round(totalSales/myInv.length).toLocaleString("en-IN"):"—"} color={V} bg={VL} border={VB}/>
            </div>
            <div style={{fontSize:"12px",color:"rgba(26,26,46,.5)",display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
              <span>Total sales</span>
              <span style={{fontWeight:700,color:V,fontFamily:"'Fraunces',serif"}}>₹{totalSales.toLocaleString("en-IN")}</span>
            </div>
            {myInv[0]&&(
              <div style={{fontSize:"12px",color:"rgba(26,26,46,.5)",display:"flex",justifyContent:"space-between"}}>
                <span>Last invoice</span>
                <span style={{fontWeight:600,color:"rgba(26,26,46,.55)"}}>{new Date(myInv[0].createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPerformance(){
  const now=new Date();
  const [month,setMonth]=useState(now.getMonth()+1);
  const [year,setYear]=useState(now.getFullYear());
  const [summary,setSummary]=useState([]);
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("name");

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      getAttendanceSummaryApi(month,year),
      axiosInstance.get("/invoices").catch(()=>({data:[]})),
    ]).then(([att,inv])=>{
      setSummary(Array.isArray(att)?att:[]);
      setInvoices(Array.isArray(inv.data)?inv.data:[]);
    }).catch(console.error).finally(()=>setLoading(false));
  },[month,year]);

  const totalDays=daysInMonth(month,year);

  const staffRows=useMemo(()=>{
    let rows=summary.filter(s=>s.user?.role!=="SUPER_ADMIN");
    if(search){const q=search.toLowerCase();rows=rows.filter(s=>s.user?.name?.toLowerCase().includes(q)||s.user?.email?.toLowerCase().includes(q));}
    return [...rows].sort((a,b)=>{
      if(sortBy==="name")return(a.user?.name||"").localeCompare(b.user?.name||"");
      if(sortBy==="attendance")return(b.present+b.halfDay*.5)-(a.present+a.halfDay*.5);
      if(sortBy==="hours")return b.totalHours-a.totalHours;
      return 0;
    });
  },[summary,search,sortBy]);

  const stats=useMemo(()=>({
    count:staffRows.length,
    totalPresent:staffRows.reduce((s,r)=>s+r.present,0),
    totalHours:staffRows.reduce((s,r)=>s+r.totalHours,0),
    perfect:staffRows.filter(r=>r.present>=Math.floor(totalDays*.9)).length,
  }),[staffRows,totalDays]);

  const sel={padding:"8px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.13)",outline:"none",fontSize:"13px",background:"#fff",cursor:"pointer"};

  return(
    <PageShell title="Staff Performance" subtitle={`${MONTHS[month-1]} ${year} · Attendance & billing overview`}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(130px, 100%), 1fr))",gap:"10px",marginBottom:"18px"}}>
        {[[stats.count,"Staff",V,VL,VB],[stats.totalPresent,"Present Days",P,PL,PB],[`${stats.totalHours}h`,"Hours Logged",B,BL,BB],[stats.perfect,"Full Attendance",AM,AML,AMB]].map(([val,label,color,bg,border])=>(
          <div key={label} style={{background:"#fff",borderRadius:"13px",border:`1px solid ${border}`,padding:"14px 16px",boxShadow:"0 2px 8px rgba(26,26,46,.04)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:900,color}}>{val}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.42)",letterSpacing:".1em",textTransform:"uppercase",marginTop:"3px"}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#fff",borderRadius:"13px",padding:"12px 16px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"14px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <select value={month} onChange={e=>setMonth(Number(e.target.value))} style={sel}>{MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
        <select value={year} onChange={e=>setYear(Number(e.target.value))} style={sel}>{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
        <div style={{width:1,height:22,background:"rgba(26,26,46,.1)"}}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={sel}>
          <option value="name">Sort: Name</option>
          <option value="attendance">Sort: Attendance</option>
          <option value="hours">Sort: Hours</option>
        </select>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search staff…" value={search} onChange={e=>setSearch(e.target.value)} style={{...sel,paddingLeft:"32px",width:"175px"}}/>
        </div>
        <span style={{fontSize:"11px",color:"rgba(26,26,46,.38)",fontFamily:"'DM Mono',monospace"}}>{staffRows.length} staff</span>
        <div style={{marginLeft:"auto"}}>
          <ExcelExport data={staffRows.map(s=>({name:s.user?.name,email:s.user?.email,role:s.user?.role,present:s.present,halfDay:s.halfDay,absent:Math.max(0,totalDays-s.present-s.halfDay),totalHours:s.totalHours}))} filename={`staff_performance_${MONTHS[month-1]}_${year}`} sheetName="Performance" accent={{color:V,light:VL,border:VB}} columns={[{key:"name",label:"Name"},{key:"email",label:"Email"},{key:"role",label:"Role"},{key:"present",label:"Present"},{key:"halfDay",label:"Half Day"},{key:"absent",label:"Absent"},{key:"totalHours",label:"Hours"}]}/>
        </div>
      </div>

      {loading?(
        <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"16px",border:"1px solid rgba(26,26,46,.08)",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>Loading performance data…</div>
      ):staffRows.length===0?(
        <div style={{padding:"60px",textAlign:"center",background:"#fff",borderRadius:"16px",border:"1px solid rgba(26,26,46,.08)"}}>
          <div style={{fontSize:"36px",marginBottom:"10px"}}>📊</div>
          <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No staff data for this period</div>
          <div style={{fontSize:"12px",color:"rgba(26,26,46,.3)",marginTop:"4px"}}>Attendance data will appear once staff log in</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {staffRows.map(s=><StaffCard key={s.user?.id} s={s} invoices={invoices} totalDays={totalDays}/>)}
        </div>
      )}
    </PageShell>
  );
}
