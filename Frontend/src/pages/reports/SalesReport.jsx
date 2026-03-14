import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import { getSalesReport } from "../../services/reportService";
import ExcelExport from "../../components/ui/ExcelExport";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const PAY_COLOR={CASH:"#059669",UPI:B,CARD:V,BANK_TRANSFER:AM,OTHER:"#475569"};

function fmt(n){return(n||0).toLocaleString("en-IN");}
function fmtK(n){return n>=100000?(n/100000).toFixed(1)+"L":n>=1000?(n/1000).toFixed(1)+"k":fmt(n);}

function KpiCard({label,value,sub,color,bg,border}){
  return(
    <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${border}`,padding:"16px 18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
      <div style={{fontFamily:"'Fraunces',serif",fontSize:"22px",fontWeight:900,color,letterSpacing:"-.02em"}}>{value}</div>
      {sub&&<div style={{fontSize:"11px",color,fontFamily:"'DM Mono',monospace",marginTop:"2px",opacity:.75}}>{sub}</div>}
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.4)",letterSpacing:".12em",textTransform:"uppercase",marginTop:"5px"}}>{label}</div>
    </div>
  );
}

export default function SalesReport(){
  const navigate = useNavigate();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const [period, setPeriod]     = useState("today");
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo]     = useState(todayStr);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch]     = useState("");

  const load = (p = period, from = dateFrom, to = dateTo) => {
    setLoading(true);
    setError(null);
    const params = p === "custom" ? { period: "custom", from, to } : { period: p };
    getSalesReport(params)
      .then(d => setData(d))
      .catch(e => setError(e?.response?.data?.message || "Failed to load sales data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (period !== "custom") load(period); }, [period]);

  const kpis   = data?.kpis        || {};
  const daily  = data?.daily       || [];
  const topProducts = data?.topProducts || [];
  const payMethods  = data?.payMethods  || [];

  const maxDaily = daily.length > 0 ? Math.max(...daily.map(d => d.sales)) : 1;

  const sel = {padding:"8px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.13)",outline:"none",fontSize:"13px",background:"#fff",cursor:"pointer"};
  const thS = {padding:"10px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase"};

  // Reconstruct flat invoice list for table/export from topProducts fallback
  // We don't have raw invoices from the report endpoint — show summary instead

  return(
    <PageShell title="Sales Report" subtitle="Revenue, invoices and daily performance">

      <button onClick={() => navigate("/reports")}
        style={{display:"inline-flex",alignItems:"center",gap:"6px",marginBottom:"18px",background:"transparent",border:"none",cursor:"pointer",fontSize:"12px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",padding:0,letterSpacing:".06em"}}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        BACK TO REPORTS
      </button>

      {/* Period picker */}
      <div style={{background:"#fff",borderRadius:"13px",padding:"12px 16px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"16px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",borderRadius:"9px",overflow:"hidden",border:"1px solid rgba(26,26,46,.12)"}}>
          {[["today","Today"],["week","7 Days"],["month","This Month"],["custom","Custom"]].map(([k,label])=>(
            <button key={k} onClick={()=>setPeriod(k)} style={{padding:"7px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",background:period===k?`linear-gradient(135deg,${B},#0369a1)`:"#fff",color:period===k?"#fff":"rgba(26,26,46,.48)",transition:"all .15s"}}>{label}</button>
          ))}
        </div>
        {period==="custom"&&<>
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={sel}/>
          <span style={{color:"rgba(26,26,46,.3)"}}>–</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={sel}/>
          <button onClick={()=>load("custom",dateFrom,dateTo)} style={{...sel,background:`linear-gradient(135deg,${B},#0369a1)`,color:"#fff",border:"none",fontWeight:700}}>Apply</button>
        </>}
        <div style={{position:"relative",marginLeft:"auto"}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} style={{...sel,paddingLeft:"32px",width:"190px"}}/>
        </div>
        <ExcelExport
          data={topProducts.map(p=>({product:p.name,qty:p.qty,revenue:p.revenue,cost:p.cost,margin:p.margin+"%"}))}
          filename={`sales_report_${period}`} sheetName="Sales"
          accent={{color:B,light:BL,border:BB}}
          columns={[{key:"product",label:"Product"},{key:"qty",label:"Qty Sold"},{key:"revenue",label:"Revenue (₹)"},{key:"cost",label:"Cost (₹)"},{key:"margin",label:"Margin %"}]}
        />
      </div>

      {/* KPI cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"10px",marginBottom:"18px"}}>
        <KpiCard label="Total Revenue"   value={`₹${fmtK(kpis.totalRevenue)}`}  sub={`₹${fmt(kpis.totalRevenue)}`}  color={B}  bg={BL}  border={BB}/>
        <KpiCard label="Total Invoices"  value={kpis.totalInvoices||0}                                               color={"#059669"} bg={PL} border={PB}/>
        <KpiCard label="Avg Invoice"     value={`₹${fmtK(kpis.avgInvoice)}`}     sub={`₹${fmt(kpis.avgInvoice)}`}   color={V}  bg={VL}  border={VB}/>
        <KpiCard label="Total Returns"   value={`₹${fmtK(kpis.totalReturns)}`}   sub={`₹${fmt(kpis.totalReturns)}`} color={RD} bg={RDL} border={RDB}/>
      </div>

      {loading && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",padding:"60px",textAlign:"center",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>
          Loading sales data…
        </div>
      )}

      {error && !loading && (
        <div style={{background:"rgba(239,68,68,.05)",borderRadius:"12px",border:"1px solid rgba(239,68,68,.2)",padding:"16px 20px",color:"#dc2626",fontSize:"13px",marginBottom:"16px"}}>
          ⚠ {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Charts row */}
          {daily.length > 0 && (
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"12px",marginBottom:"18px"}}>
              {/* Daily bar chart */}
              <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",padding:"18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:"14px"}}>Daily Sales</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:"6px",height:"100px"}}>
                  {daily.map((d,i)=>{
                    const h=maxDaily>0?Math.max(4,Math.round((d.sales/maxDaily)*100)):4;
                    return(
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
                        <div title={`₹${fmt(d.sales)}`} style={{width:"100%",height:`${h}px`,borderRadius:"4px 4px 0 0",background:`linear-gradient(180deg,${B},${B}bb)`,cursor:"pointer",transition:"opacity .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}/>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"rgba(26,26,46,.35)",transform:"rotate(-45deg)",transformOrigin:"center",whiteSpace:"nowrap",marginTop:"6px"}}>
                          {new Date(d.date+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment methods */}
              <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",padding:"18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:"14px"}}>Payment Methods</div>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {payMethods.sort((a,b)=>b.amount-a.amount).map(({method,amount,pct})=>{
                    const color=PAY_COLOR[method]||PAY_COLOR.OTHER;
                    return(
                      <div key={method}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                          <span style={{fontSize:"12px",fontWeight:600,color:"#1a1a2e"}}>{method}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color}}>{pct}%</span>
                        </div>
                        <div style={{height:"5px",borderRadius:"99px",background:"rgba(26,26,46,.07)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:"99px"}}/>
                        </div>
                        <div style={{fontSize:"10px",color:"rgba(26,26,46,.4)",marginTop:"1px",fontFamily:"'DM Mono',monospace"}}>₹{fmtK(amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Top products */}
          {topProducts.length > 0 && (
            <div style={{background:"#fff",borderRadius:"14px",border:"1px solid rgba(26,26,46,.08)",padding:"18px",marginBottom:"18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:"12px"}}>Top Products by Revenue</div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {topProducts.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())).map((p,i)=>{
                  const maxR=topProducts[0]?.revenue||1;
                  const pct=Math.round((p.revenue/maxR)*100);
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"rgba(26,26,46,.3)",width:"16px"}}>{i+1}</span>
                      <span style={{fontSize:"12px",fontWeight:600,color:"#1a1a2e",flex:"0 0 200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                      <div style={{flex:1,height:"6px",borderRadius:"99px",background:"rgba(26,26,46,.07)",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${V},${V}bb)`,borderRadius:"99px"}}/>
                      </div>
                      <span style={{fontFamily:"'Fraunces',serif",fontSize:"12px",fontWeight:700,color:V,width:"70px",textAlign:"right"}}>₹{fmtK(p.revenue)}</span>
                      <span style={{fontSize:"11px",color:"rgba(26,26,46,.4)",width:"50px",textAlign:"right"}}>{p.qty} sold</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {daily.length === 0 && topProducts.length === 0 && (
            <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",padding:"60px",textAlign:"center",boxShadow:"0 2px 14px rgba(26,26,46,.05)"}}>
              <div style={{fontSize:"32px",marginBottom:"10px"}}>📊</div>
              <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No sales for this period</div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
