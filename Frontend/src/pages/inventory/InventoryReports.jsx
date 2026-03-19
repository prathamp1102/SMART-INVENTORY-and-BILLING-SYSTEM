import { useState, useEffect } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";

const movements = [
  {type:"GRN",    product:"Notebook A4",     qty:+200, date:"14 Jan", by:"Admin",   note:"From Office Hub"},
  {type:"SALE",   product:"Laptop Pro X1",   qty:-1,   date:"14 Jan", by:"Staff",   note:"INV-1082"},
  {type:"SALE",   product:"Wireless Mouse",  qty:-3,   date:"14 Jan", by:"Staff",   note:"INV-1081"},
  {type:"ADJUST", product:"Office Chair",    qty:-1,   date:"13 Jan", by:"Admin",   note:"Damage entry"},
  {type:"GRN",    product:"USB Hub 7-Port",  qty:+50,  date:"13 Jan", by:"Admin",   note:"From Tata Electronics"},
  {type:"RETURN", product:"Wireless Mouse",  qty:+1,   date:"12 Jan", by:"Staff",   note:"RET-041"},
  {type:"SALE",   product:"Notebook A4",     qty:-10,  date:"12 Jan", by:"Staff",   note:"INV-1079"},
];

const TYPE_STYLE = {
  GRN:    {color:"#059669",bg:"rgba(5,150,105,.08)",border:"rgba(5,150,105,.2)",label:"GRN"},
  SALE:   {color:"#0284c7",bg:"rgba(2,132,199,.08)",border:"rgba(2,132,199,.2)",label:"Sale"},
  RETURN: {color:"#b45309",bg:"rgba(180,83,9,.08)",border:"rgba(180,83,9,.2)",label:"Return"},
  ADJUST: {color:"#dc2626",bg:"rgba(239,68,68,.08)",border:"rgba(239,68,68,.2)",label:"Adjustment"},
};

export default function InventoryReports() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(()=>{
    axiosInstance.get("/products").then(r=>setProducts(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const filtered = typeFilter==="ALL" ? movements : movements.filter(m=>m.type===typeFilter);
  const totalStock = products.reduce((s,p)=>s+p.stock,0);
  const lowItems   = products.filter(p=>p.stock>0&&p.stock<10);
  const outItems   = products.filter(p=>p.stock===0);

  return (
    <PageShell title="Inventory Reports" subtitle="Stock movement history, GRN logs and damage entries">

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(170px, 100%), 1fr))",gap:"12px",marginBottom:"22px"}}>
        {[
          ["Total Products",loading?"…":products.length,"#1a1a2e","rgba(26,26,46,.08)","rgba(26,26,46,.15)"],
          ["Total Units",loading?"…":totalStock.toLocaleString("en-IN"),"#0284c7","rgba(2,132,199,.08)","rgba(2,132,199,.2)"],
          ["Low Stock",loading?"…":lowItems.length,"#b45309","rgba(180,83,9,.08)","rgba(180,83,9,.2)"],
          ["Out of Stock",loading?"…":outItems.length,"#dc2626","rgba(239,68,68,.08)","rgba(239,68,68,.2)"],
        ].map(([label,val,color,bg,border])=>(
          <div key={label} style={{background:"#fff",borderRadius:"16px",border:`1px solid ${border}`,padding:"18px 20px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"26px",fontWeight:900,color,letterSpacing:"-.03em"}}>{val}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase",marginTop:"6px"}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(300px, 100%), 1fr))",gap:"16px"}}>

        {/* Movement Log */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",flexWrap:"wrap"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"15px",fontWeight:800,color:"#1a1a2e",marginRight:"4px"}}>Stock Movement Log</div>
            {["ALL","GRN","SALE","RETURN","ADJUST"].map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)} style={{padding:"5px 12px",borderRadius:"8px",border:`1.5px solid ${typeFilter===t?"rgba(26,26,46,.25)":"rgba(26,26,46,.1)"}`,background:typeFilter===t?"#1a1a2e":"transparent",color:typeFilter===t?"#fff":"rgba(26,26,46,.55)",fontSize:"11.5px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Mono',monospace",transition:"all .15s"}}>
                {t}
              </button>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 12px rgba(26,26,46,.05)"}}>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>
                  {["Type","Product","Qty Change","Date","By","Note"].map(h=>(
                    <th key={h} style={{padding:"11px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.35)",letterSpacing:".13em",textTransform:"uppercase",fontWeight:500}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m,i)=>{
                  const st = TYPE_STYLE[m.type];
                  return (
                    <tr key={i} style={{borderBottom:i<filtered.length-1?"1px solid rgba(26,26,46,.05)":"none"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(26,26,46,.02)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{display:"inline-flex",padding:"2px 9px",borderRadius:"99px",background:st.bg,border:`1px solid ${st.border}`,color:st.color,fontSize:"10px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{st.label}</span>
                      </td>
                      <td style={{padding:"12px 14px",fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>{m.product}</td>
                      <td style={{padding:"12px 14px",fontFamily:"'DM Mono',monospace",fontSize:"14px",fontWeight:800,color:m.qty>0?"#059669":"#dc2626"}}>{m.qty>0?"+":""}{m.qty}</td>
                      <td style={{padding:"12px 14px",fontSize:"12px",color:"rgba(26,26,46,.5)"}}>{m.date}</td>
                      <td style={{padding:"12px 14px",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>{m.by}</td>
                      <td style={{padding:"12px 14px",fontSize:"11.5px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace"}}>{m.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
      </div>
          </div>
        </div>

        {/* Low & Out of Stock */}
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(180,83,9,.2)",padding:"20px",boxShadow:"0 2px 12px rgba(26,26,46,.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#b45309",animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:"#1a1a2e"}}>Low Stock Alert</span>
              <span style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color:"#b45309"}}>{loading?"…":lowItems.length} items</span>
            </div>
            {loading ? <div style={{color:"rgba(26,26,46,.3)",fontSize:"13px"}}>Loading…</div>
            : lowItems.length===0 ? <div style={{color:"rgba(26,26,46,.3)",fontSize:"13px",textAlign:"center",padding:"16px"}}>✓ No low stock items</div>
            : lowItems.slice(0,6).map(p=>(
              <div key={p._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(26,26,46,.05)"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>{p.name}</div>
                  <div style={{fontSize:"11px",color:"rgba(26,26,46,.4)"}}>{p.category?.name||"—"}</div>
                </div>
                <span style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:900,color:"#b45309"}}>{p.stock}</span>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(239,68,68,.2)",padding:"20px",boxShadow:"0 2px 12px rgba(26,26,46,.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#dc2626",animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:"#1a1a2e"}}>Out of Stock</span>
              <span style={{marginLeft:"auto",fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,color:"#dc2626"}}>{loading?"…":outItems.length} items</span>
            </div>
            {loading ? <div style={{color:"rgba(26,26,46,.3)",fontSize:"13px"}}>Loading…</div>
            : outItems.length===0 ? <div style={{color:"rgba(26,26,46,.3)",fontSize:"13px",textAlign:"center",padding:"16px"}}>✓ All products in stock</div>
            : outItems.map(p=>(
              <div key={p._id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(26,26,46,.05)"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>{p.name}</div>
                  <div style={{fontSize:"11px",color:"rgba(26,26,46,.4)"}}>{p.category?.name||"—"}</div>
                </div>
                <span style={{padding:"2px 9px",borderRadius:"99px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",color:"#dc2626",fontSize:"10px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>OUT</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
