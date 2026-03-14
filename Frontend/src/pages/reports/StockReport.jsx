import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";
import ExcelExport from "../../components/ui/ExcelExport";

export default function StockReport() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  useEffect(()=>{
    axiosInstance.get("/products").then(r=>setProducts(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const filtered = products.filter(p=>{
    const matchF = filter==="all"?true:filter==="low"?(p.stock>0&&p.stock<10):filter==="out"?p.stock===0:p.isActive;
    const matchS = p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.name?.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const totalStock = products.reduce((s,p)=>s+p.stock,0);
  const totalValue = products.reduce((s,p)=>s+p.stock*p.costPrice,0);
  const lowCount   = products.filter(p=>p.stock>0&&p.stock<10).length;
  const outCount   = products.filter(p=>p.stock===0).length;

  const kpis = [
    {label:"Total SKUs",value:products.length,color:"#1a1a2e",bg:"rgba(26,26,46,.06)",border:"rgba(26,26,46,.14)"},
    {label:"Total Units",value:totalStock.toLocaleString("en-IN"),color:"#0284c7",bg:"rgba(2,132,199,.08)",border:"rgba(2,132,199,.2)"},
    {label:"Stock Value",value:`₹${totalValue.toLocaleString("en-IN")}`,color:"#059669",bg:"rgba(5,150,105,.08)",border:"rgba(5,150,105,.2)"},
    {label:"Low Stock",value:lowCount,color:"#b45309",bg:"rgba(180,83,9,.08)",border:"rgba(180,83,9,.2)"},
    {label:"Out of Stock",value:outCount,color:"#dc2626",bg:"rgba(239,68,68,.08)",border:"rgba(239,68,68,.2)"},
  ];

  return (
    <PageShell title="Stock Report" subtitle="Current inventory levels, alerts and stock valuation">

      <button onClick={() => navigate("/reports")}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "18px", background: "transparent", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace", padding: 0, letterSpacing: ".06em" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
        BACK TO REPORTS
      </button>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"12px",marginBottom:"22px"}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:"#fff",borderRadius:"16px",border:`1px solid ${k.border}`,padding:"18px 20px"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"26px",fontWeight:900,color:k.color,letterSpacing:"-.03em"}}>{k.value}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginTop:"6px"}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:"4px",padding:"4px",background:"rgba(26,26,46,.06)",borderRadius:"12px"}}>
          {[["all","All"],["low","Low Stock"],["out","Out of Stock"],["active","Active"]].map(([key,label])=>(
            <button key={key} onClick={()=>setFilter(key)} style={{padding:"7px 14px",borderRadius:"9px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'Figtree',sans-serif",transition:"all .15s",background:filter===key?"#fff":"transparent",color:filter===key?"#1a1a2e":"rgba(26,26,46,.45)",boxShadow:filter===key?"0 1px 5px rgba(26,26,46,.08)":"none"}}>{label}</button>
          ))}
        </div>
        <div style={{position:"relative",marginLeft:"auto"}}>
          <svg style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{height:"38px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.12)",outline:"none",paddingLeft:"32px",paddingRight:"12px",fontSize:"13px",fontFamily:"'Figtree',sans-serif",color:"#1a1a2e",background:"#fff",width:"220px"}}/>
        </div>
        <ExcelExport
          data={filtered}
          filename="stock_report"
          sheetName="Stock Report"
          columns={[
            {key:"name",label:"Product Name"},
            {key:"category.name",label:"Category"},
            {key:"barcode",label:"Barcode"},
            {key:"costPrice",label:"Cost Price (₹)"},
            {key:"price",label:"Selling Price (₹)"},
            {key:"stock",label:"Stock Units"},
            {key:"stock",label:"Stock Value (₹)",format:(v,row)=>((v||0)*(row.costPrice||0)).toFixed(2)},
            {key:"isActive",label:"Status",format:v=>v?"Active":"Inactive"},
            {key:"branch.branchName",label:"Branch"},
          ]}
        />
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"rgba(26,26,46,.35)",letterSpacing:".1em"}}>{loading?"Loading…":`${filtered.length} products`}</div>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 14px rgba(26,26,46,.05)"}}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>
              {["Product","Category","Barcode","Cost ₹","Sell ₹","Stock Units","Stock Value","Status","Alert"].map(h=>(
                <th key={h} style={{padding:"12px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.35)",letterSpacing:".13em",textTransform:"uppercase",fontWeight:500,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{padding:"60px",textAlign:"center",color:"rgba(26,26,46,.3)"}}>Loading inventory…</td></tr>
            : filtered.length===0 ? <tr><td colSpan={9} style={{padding:"60px",textAlign:"center",color:"rgba(26,26,46,.3)"}}>No products match filter</td></tr>
            : filtered.map((p,i)=>{
              const isOut = p.stock===0;
              const isLow = p.stock>0&&p.stock<10;
              const stockVal = p.stock*p.costPrice;
              return (
                <tr key={p._id} style={{borderBottom:i<filtered.length-1?"1px solid rgba(26,26,46,.05)":"none",background:isOut?"rgba(239,68,68,.015)":isLow?"rgba(180,83,9,.01)":"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background=isOut?"rgba(239,68,68,.015)":isLow?"rgba(180,83,9,.01)":"transparent"}>
                  <td style={{padding:"12px 14px",fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>{p.name}</td>
                  <td style={{padding:"12px 14px"}}>{p.category?.name?<span style={{padding:"2px 8px",borderRadius:"99px",background:"rgba(5,150,105,.08)",border:"1px solid rgba(5,150,105,.18)",color:"#059669",fontSize:"10.5px",fontFamily:"'DM Mono',monospace"}}>{p.category.name}</span>:<span style={{color:"rgba(26,26,46,.25)"}}>—</span>}</td>
                  <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"rgba(26,26,46,.4)"}}>{p.barcode||"—"}</td>
                  <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.6)"}}>₹{p.costPrice?.toLocaleString("en-IN")||"—"}</td>
                  <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:700,color:"#1a1a2e"}}>₹{p.price?.toLocaleString("en-IN")}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:900,color:isOut?"#dc2626":isLow?"#b45309":"#1a1a2e"}}>{p.stock}</span>
                  </td>
                  <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:600,color:"rgba(26,26,46,.7)"}}>₹{stockVal.toLocaleString("en-IN")}</td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"2px 9px",borderRadius:"99px",background:p.isActive?"rgba(5,150,105,.08)":"rgba(239,68,68,.08)",border:`1px solid ${p.isActive?"rgba(5,150,105,.2)":"rgba(239,68,68,.2)"}`,color:p.isActive?"#059669":"#dc2626",fontSize:"10.5px",fontFamily:"'DM Mono',monospace"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"currentColor"}}/>{p.isActive?"Active":"Inactive"}
                    </span>
                  </td>
                  <td style={{padding:"12px 14px"}}>
                    {isOut ? <span style={{padding:"2px 9px",borderRadius:"99px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:"#dc2626",fontSize:"10px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>OUT</span>
                    : isLow ? <span style={{padding:"2px 9px",borderRadius:"99px",background:"rgba(180,83,9,.08)",border:"1px solid rgba(180,83,9,.2)",color:"#b45309",fontSize:"10px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>LOW</span>
                    : <span style={{color:"rgba(26,26,46,.2)",fontSize:"12px"}}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {!loading&&filtered.length>0&&(
            <tfoot>
              <tr style={{borderTop:"2px solid rgba(26,26,46,.08)",background:"rgba(26,26,46,.02)"}}>
                <td colSpan={5} style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"rgba(26,26,46,.4)",letterSpacing:".1em",textTransform:"uppercase"}}>Total ({filtered.length} products)</td>
                <td style={{padding:"12px 14px",fontFamily:"'Fraunces',serif",fontSize:"16px",fontWeight:900,color:"#1a1a2e"}}>{filtered.reduce((s,p)=>s+p.stock,0)}</td>
                <td style={{padding:"12px 14px",fontFamily:"'Fraunces',serif",fontSize:"15px",fontWeight:900,color:"#059669"}}>₹{filtered.reduce((s,p)=>s+(p.stock*p.costPrice),0).toLocaleString("en-IN")}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      </div>
    </PageShell>
  );
}
