import { useState, useEffect, useMemo } from "react";
import { PageShell } from "../../components/ui/PageShell";
import axiosInstance from "../../services/axiosInstance";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";

function fmt(n){return(n||0).toLocaleString("en-IN");}

export default function ApproveDiscounts(){
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState("");
  const [tab,setTab]=useState("pending"); // pending | all
  const [search,setSearch]=useState("");

  const load=()=>{
    setLoading(true);
    // Fetch PENDING invoices (awaiting discount approval)
    Promise.all([
      axiosInstance.get("/invoices",{params:{status:"PENDING"}}),
      tab==="all"?axiosInstance.get("/invoices",{params:{status:"PAID"}}):Promise.resolve({data:[]}),
    ]).then(([pending,paid])=>{
      const pendingList=Array.isArray(pending.data)?pending.data:[];
      const paidList=Array.isArray(paid.data)?paid.data.filter(i=>i.discountAmount>0):[];
      if(tab==="pending") setInvoices(pendingList);
      else setInvoices([...pendingList,...paidList]);
    }).catch(()=>setInvoices([])).finally(()=>setLoading(false));
  };

  useEffect(()=>{load();},[tab]);

  const handleApprove=async(id)=>{
    setSaving(id);
    try{
      await axiosInstance.put(`/invoices/${id}`,{approveDiscount:true});
      setInvoices(p=>p.filter(i=>i._id!==id));
    }catch(err){alert(err?.response?.data?.message||"Failed to approve.");}
    finally{setSaving("");}
  };

  const handleReject=async(id)=>{
    if(!window.confirm("Reject this discount? Invoice will be cancelled."))return;
    setSaving(id+"-reject");
    try{
      await axiosInstance.put(`/invoices/${id}`,{status:"CANCELLED"});
      setInvoices(p=>p.filter(i=>i._id!==id));
    }catch(err){alert(err?.response?.data?.message||"Failed to reject.");}
    finally{setSaving("");}
  };

  const filtered=useMemo(()=>{
    if(!search)return invoices;
    const q=search.toLowerCase();
    return invoices.filter(i=>
      (i.invoiceNumber||"").toLowerCase().includes(q)||
      (i.customerName||"").toLowerCase().includes(q)||
      (i.cashier?.name||"").toLowerCase().includes(q)
    );
  },[invoices,search]);

  const pendingCount=invoices.filter(i=>i.status==="PENDING").length;
  const totalDiscountPending=invoices.filter(i=>i.status==="PENDING").reduce((s,i)=>s+(i.discountAmount||0),0);

  const sel={padding:"7px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.13)",outline:"none",fontSize:"13px",background:"#fff",cursor:"pointer"};
  const thS={padding:"10px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase"};

  return(
    <PageShell title="Approve Discounts" subtitle="Review and approve invoices with high discounts pending approval">

      {/* Alert banner if pending */}
      {pendingCount>0&&(
        <div style={{padding:"12px 18px",borderRadius:"12px",background:AML,border:`1.5px solid ${AMB}`,color:AM,fontSize:"13px",fontWeight:600,marginBottom:"18px",display:"flex",alignItems:"center",gap:"10px"}}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
          <span>{pendingCount} invoice{pendingCount>1?"s":""} pending discount approval · ₹{fmt(totalDiscountPending)} total discount value</span>
        </div>
      )}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(150px, 100%), 1fr))",gap:"10px",marginBottom:"18px"}}>
        {[
          [pendingCount,"Awaiting Approval",AM,AML,AMB],
          [`₹${fmt(totalDiscountPending)}`, "Discount Value Pending",RD,RDL,RDB],
          [invoices.filter(i=>i.discountApproved).length,"Approved Today",P,PL,PB],
          [invoices.filter(i=>i.status==="CANCELLED").length,"Rejected",B,BL,BB],
        ].map(([val,label,color,bg,border])=>(
          <div key={label} style={{background:"#fff",borderRadius:"13px",border:`1px solid ${border}`,padding:"14px 16px",boxShadow:"0 2px 8px rgba(26,26,46,.04)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"20px",fontWeight:900,color}}>{val}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.42)",letterSpacing:".1em",textTransform:"uppercase",marginTop:"4px"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{background:"#fff",borderRadius:"13px",padding:"12px 16px",border:"1px solid rgba(26,26,46,.08)",marginBottom:"14px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",borderRadius:"9px",overflow:"hidden",border:"1px solid rgba(26,26,46,.12)"}}>
          {[["pending","Pending Approval"],["all","All Discounted"]].map(([k,label])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 14px",border:"none",fontSize:"12px",fontWeight:700,cursor:"pointer",background:tab===k?`linear-gradient(135deg,${AM},#92400e)`:"#fff",color:tab===k?"#fff":"rgba(26,26,46,.48)"}}>
              {label}{k==="pending"&&pendingCount>0&&<span style={{marginLeft:"6px",padding:"1px 6px",borderRadius:"99px",background:"rgba(255,255,255,.25)",fontSize:"10px"}}>{pendingCount}</span>}
            </button>
          ))}
        </div>
        <div style={{position:"relative"}}>
          <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input placeholder="Search invoice, customer…" value={search} onChange={e=>setSearch(e.target.value)} style={{...sel,paddingLeft:"32px",width:"220px"}}/>
        </div>
        <button onClick={load} style={sel}>↻ Refresh</button>
        <span style={{fontSize:"11px",color:"rgba(26,26,46,.38)",fontFamily:"'DM Mono',monospace",marginLeft:"auto"}}>{filtered.length} invoices</span>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 14px rgba(26,26,46,.05)"}}>
        {loading?(
          <div style={{padding:"60px",textAlign:"center",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>Loading…</div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>
                {["Invoice","Date","Customer","Cashier","Subtotal","Discount","Discount %","Final Amount","Status","Action"].map(h=><th key={h} style={thS}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.length===0?(
                  <tr><td colSpan={10} style={{padding:"60px",textAlign:"center"}}>
                    <div style={{fontSize:"36px",marginBottom:"10px"}}>🎉</div>
                    <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No pending discount approvals</div>
                    <div style={{fontSize:"12px",color:"rgba(26,26,46,.3)",marginTop:"4px"}}>All discounts are within the auto-approve threshold</div>
                  </td></tr>
                ):filtered.map((inv,i)=>{
                  const subtotal=(inv.grandTotal||0)+(inv.discountAmount||0);
                  const discPct=subtotal>0?Math.round(((inv.discountAmount||0)/subtotal)*100):0;
                  const isPending=inv.status==="PENDING";
                  const isApproved=inv.discountApproved;
                  return(
                    <tr key={inv._id} style={{borderBottom:"1px solid rgba(26,26,46,.042)",background:isPending?AML+(i%2===0?"":"11"):(i%2===0?"#fff":"rgba(26,26,46,.01)")}}
                      onMouseEnter={e=>e.currentTarget.style.background=isPending?"rgba(180,83,9,.12)":"rgba(26,26,46,.018)"}
                      onMouseLeave={e=>e.currentTarget.style.background=isPending?AML:(i%2===0?"#fff":"rgba(26,26,46,.01)")}>
                      <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:700,color:B}}>{inv.invoiceNumber||inv._id?.slice(-6)}</td>
                      <td style={{padding:"11px 14px",fontSize:"12px",color:"rgba(26,26,46,.5)"}}>{new Date(inv.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"2-digit"})}</td>
                      <td style={{padding:"11px 14px",fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>{inv.customerName||"Walk-in"}</td>
                      <td style={{padding:"11px 14px",fontSize:"12px",color:"rgba(26,26,46,.55)"}}>{inv.cashier?.name||"—"}</td>
                      <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"rgba(26,26,46,.6)"}}>₹{fmt(subtotal)}</td>
                      <td style={{padding:"11px 14px",fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:700,color:RD}}>-₹{fmt(inv.discountAmount)}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{padding:"2px 9px",borderRadius:"99px",background:discPct>=30?RDL:discPct>=20?AML:PL,border:`1px solid ${discPct>=30?RDB:discPct>=20?AMB:PB}`,color:discPct>=30?RD:discPct>=20?AM:P,fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:700}}>
                          {discPct}%
                        </span>
                      </td>
                      <td style={{padding:"11px 14px",fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:700,color:V}}>₹{fmt(inv.grandTotal)}</td>
                      <td style={{padding:"11px 14px"}}>
                        {isPending?(
                          <span style={{padding:"3px 10px",borderRadius:"99px",background:AML,border:`1px solid ${AMB}`,color:AM,fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:700}}>⏳ Pending</span>
                        ):isApproved?(
                          <span style={{padding:"3px 10px",borderRadius:"99px",background:PL,border:`1px solid ${PB}`,color:P,fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:700}}>✓ Approved</span>
                        ):(
                          <span style={{padding:"3px 10px",borderRadius:"99px",background:BL,border:`1px solid ${BB}`,color:B,fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:700}}>{inv.status}</span>
                        )}
                      </td>
                      <td style={{padding:"11px 14px"}}>
                        {isPending?(
                          <div style={{display:"flex",gap:"5px"}}>
                            <button onClick={()=>handleApprove(inv._id)} disabled={saving===inv._id}
                              style={{padding:"5px 11px",borderRadius:"7px",border:`1px solid ${PB}`,background:PL,color:P,fontSize:"11px",fontWeight:700,cursor:"pointer",opacity:saving===inv._id?.5:1}}>
                              {saving===inv._id?"…":"✓ Approve"}
                            </button>
                            <button onClick={()=>handleReject(inv._id)} disabled={!!saving}
                              style={{padding:"5px 11px",borderRadius:"7px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
                              ✕ Reject
                            </button>
                          </div>
                        ):<span style={{fontSize:"11px",color:"rgba(26,26,46,.3)"}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info note */}
      <div style={{marginTop:"14px",padding:"11px 16px",borderRadius:"10px",background:"rgba(26,26,46,.04)",border:"1px solid rgba(26,26,46,.08)",fontSize:"12px",color:"rgba(26,26,46,.45)",display:"flex",gap:"8px",alignItems:"flex-start"}}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{flexShrink:0,marginTop:"1px"}}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
        Invoices with discount &gt; 20% are automatically held for admin approval before payment is processed.
      </div>
    </PageShell>
  );
}
