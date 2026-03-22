import { useState, useEffect, useMemo, useRef, useContext } from "react";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS, SS, FieldLabel, FormError } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";
import { AuthContext } from "../../context/AuthContext";

const P="#059669",PL="rgba(5,150,105,.08)",PB="rgba(5,150,105,.2)";
const B="#0284c7",BL="rgba(2,132,199,.08)",BB="rgba(2,132,199,.2)";
const AM="#b45309",AML="rgba(180,83,9,.08)",AMB="rgba(180,83,9,.2)";
const RD="#dc2626",RDL="rgba(239,68,68,.08)",RDB="rgba(239,68,68,.2)";
const V="#7c3aed",VL="rgba(124,58,237,.08)",VB="rgba(124,58,237,.2)";

const STATUS_STYLE={
  PENDING:  {color:AM,bg:AML,border:AMB,label:"Pending"},
  APPROVED: {color:P, bg:PL, border:PB, label:"Approved"},
  COMPLETED:{color:B, bg:BL, border:BB, label:"Refunded"},
  REJECTED: {color:RD,bg:RDL,border:RDB,label:"Rejected"},
};
const REFUND_ICONS={CASH:"💵",CARD:"💳",UPI:"📲",STORE_CREDIT:"🏷️",OTHER:"💰"};

function StatusBadge({status}){
  const s=STATUS_STYLE[status]||STATUS_STYLE.PENDING;
  return <span style={{display:"inline-flex",alignItems:"center",gap:"4px",padding:"3px 10px",borderRadius:"99px",background:s.bg,border:`1px solid ${s.border}`,color:s.color,fontSize:"10px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>
    <div style={{width:5,height:5,borderRadius:"50%",background:"currentColor"}}/>{s.label}
  </span>;
}
function Err({children}){return <div style={{color:RD,fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"-8px",marginBottom:"10px"}}>{children}</div>;}

// ── Print Receipt Modal ──────────────────────────────────────────────────────
function PrintReceipt({ret,onClose}){
  const handlePrint=()=>{
    const w=window.open("","_blank","width=400,height=650");
    w.document.write(`<html><head><title>Return Receipt</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;padding:20px;max-width:320px;margin:0 auto;}
      h2{text-align:center;font-size:14px;margin:0 0 4px;}
      .center{text-align:center;}.line{border-top:1px dashed #000;margin:8px 0;}
      .row{display:flex;justify-content:space-between;margin:3px 0;}
      .bold{font-weight:bold;}.green{color:#059669;}
      table{width:100%;border-collapse:collapse;} td{padding:3px 0;font-size:11px;}
      .stamp{text-align:center;border:2px solid #059669;border-radius:6px;padding:6px;margin:10px 0;color:#059669;font-weight:bold;font-size:13px;}
      .stamp-pending{border-color:#b45309;color:#b45309;}
    </style></head><body>
      <h2>RETURN RECEIPT</h2>
      <div class="center" style="font-size:11px;color:#555">Smart Inventory Management</div>
      <div class="line"></div>
      <div class="row"><span>Return #</span><span class="bold">${ret.returnNo}</span></div>
      <div class="row"><span>Date</span><span>${new Date(ret.createdAt).toLocaleString("en-IN")}</span></div>
      <div class="row"><span>Customer</span><span>${ret.customerName||"Walk-in"}</span></div>
      ${ret.customerPhone?`<div class="row"><span>Phone</span><span>${ret.customerPhone}</span></div>`:""}
      ${ret.invoiceNo?`<div class="row"><span>Invoice #</span><span>${ret.invoiceNo}</span></div>`:""}
      <div class="row"><span>Reason</span><span>${ret.reason||"—"}</span></div>
      <div class="line"></div>
      <table>
        <tr><td class="bold">Item</td><td class="bold" style="text-align:center">Qty</td><td class="bold" style="text-align:right">Amount</td></tr>
        ${(ret.items||[]).map(i=>`<tr><td>${i.productName}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">&#8377;${(i.total||0).toLocaleString("en-IN")}</td></tr>`).join("")}
      </table>
      <div class="line"></div>
      <div class="row bold"><span>Total Refund</span><span class="green">&#8377;${(ret.returnAmount||0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span>Refund Method</span><span>${ret.refundMethod}</span></div>
      <div class="row"><span>Restock Items</span><span>${ret.restockItems?"Yes":"No"}</span></div>
      <div class="line"></div>
      ${ret.status==="COMPLETED"?`<div class="stamp">&#10003; REFUND ISSUED</div>`:`<div class="stamp stamp-pending">&#9203; ${STATUS_STYLE[ret.status]?.label||ret.status}</div>`}
      ${ret.notes?`<div style="font-size:10px;color:#666;margin-top:6px">Notes: ${ret.notes}</div>`:""}
      <div class="line"></div>
      <div class="center" style="font-size:10px;color:#888">Thank you for your patience.<br/>Keep this receipt for your records.</div>
    </body></html>`);
    w.document.close();w.focus();setTimeout(()=>{w.print();w.close();},300);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"20px",padding:"28px",maxWidth: "min(420px, 100%)",width:"100%",boxShadow:"0 24px 80px rgba(26,26,46,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:"17px",fontWeight:800,color:"#1a1a2e",marginBottom:"18px",display:"flex",alignItems:"center",gap:"10px"}}>
          🧾 Return Receipt
          <span style={{marginLeft:"auto",fontSize:"12px",fontWeight:500,color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace"}}>{ret.returnNo}</span>
        </div>
        <div style={{background:"rgba(26,26,46,.02)",borderRadius:"12px",border:"1px dashed rgba(26,26,46,.15)",padding:"16px",fontFamily:"'DM Mono',monospace",fontSize:"12px"}}>
          <div style={{textAlign:"center",marginBottom:"8px"}}>
            <div style={{fontWeight:800,fontSize:"14px",color:"#1a1a2e"}}>RETURN RECEIPT</div>
            <div style={{color:"rgba(26,26,46,.4)",fontSize:"10px"}}>Smart Inventory Management</div>
          </div>
          <div style={{borderTop:"1px dashed rgba(26,26,46,.2)",margin:"8px 0"}}/>
          {[["Return #",ret.returnNo],["Date",new Date(ret.createdAt).toLocaleString("en-IN")],["Customer",ret.customerName||"Walk-in"],ret.customerPhone&&["Phone",ret.customerPhone],ret.invoiceNo&&["Invoice #",ret.invoiceNo],["Reason",ret.reason||"—"]].filter(Boolean).map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{color:"rgba(26,26,46,.45)"}}>{k}</span><span style={{fontWeight:600,color:"#1a1a2e"}}>{v}</span>
            </div>
          ))}
          <div style={{borderTop:"1px dashed rgba(26,26,46,.2)",margin:"8px 0"}}/>
          {(ret.items||[]).map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:"3px",fontSize:"11px"}}>
              <span style={{flex:1}}>{item.productName} ×{item.qty}</span>
              <span style={{fontWeight:600}}>₹{(item.total||0).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div style={{borderTop:"1px dashed rgba(26,26,46,.2)",margin:"8px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:800}}>
            <span>Total Refund</span><span style={{color:P}}>₹{(ret.returnAmount||0).toLocaleString("en-IN")}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
            <span style={{color:"rgba(26,26,46,.45)"}}>Refund Via</span>
            <span style={{fontWeight:600}}>{REFUND_ICONS[ret.refundMethod]||""} {ret.refundMethod}</span>
          </div>
          <div style={{borderTop:"1px dashed rgba(26,26,46,.2)",margin:"8px 0"}}/>
          <div style={{textAlign:"center",padding:"8px",borderRadius:"8px",border:`2px solid ${ret.status==="COMPLETED"?P:AM}`,color:ret.status==="COMPLETED"?P:AM,fontWeight:800,fontSize:"13px"}}>
            {ret.status==="COMPLETED"?"✓ REFUND ISSUED":"⏳ "+STATUS_STYLE[ret.status]?.label}
          </div>
          {ret.notes&&<div style={{marginTop:"8px",fontSize:"10px",color:"rgba(26,26,46,.4)"}}>Notes: {ret.notes}</div>}
        </div>
        <div style={{display:"flex",gap:"10px",marginTop:"18px"}}>
          <button onClick={handlePrint} style={{flex:1,padding:"10px",borderRadius:"11px",border:`1.5px solid ${BB}`,background:BL,color:B,fontSize:"13px",fontWeight:700,cursor:"pointer"}}>🖨️ Print Receipt</button>
          <button onClick={onClose} style={{padding:"10px 18px",borderRadius:"11px",border:"1.5px solid rgba(26,26,46,.13)",background:"transparent",color:"rgba(26,26,46,.5)",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Refund Confirmation Modal ─────────────────────────────────────────────────
function RefundModal({ret,onConfirm,onClose,saving}){
  const [method,setMethod]=useState(ret.refundMethod||"CASH");
  const [notes,setNotes]=useState(ret.notes||"");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,26,46,.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"20px",padding:"28px",maxWidth: "min(420px, 100%)",width:"100%",boxShadow:"0 24px 80px rgba(26,26,46,.2)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:"17px",fontWeight:800,color:"#1a1a2e",marginBottom:"6px"}}>💵 Issue Refund</div>
        <div style={{fontSize:"12px",color:"rgba(26,26,46,.45)",marginBottom:"20px",fontFamily:"'DM Mono',monospace"}}>Return #{ret.returnNo} · {ret.customerName||"Walk-in"}</div>
        <div style={{background:PL,border:`1px solid ${PB}`,borderRadius:"12px",padding:"14px",marginBottom:"18px"}}>
          <div style={{fontSize:"12px",fontWeight:600,color:"#1a1a2e",marginBottom:"8px"}}>Items to refund:</div>
          {(ret.items||[]).map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",color:"rgba(26,26,46,.6)",marginBottom:"4px"}}>
              <span>{item.productName} ×{item.qty}</span>
              <span style={{fontWeight:700,color:P}}>₹{(item.total||0).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div style={{borderTop:`1px solid ${PB}`,marginTop:"8px",paddingTop:"8px",display:"flex",justifyContent:"space-between",fontWeight:800,color:P,fontSize:"14px"}}>
            <span>Total Refund</span><span>₹{(ret.returnAmount||0).toLocaleString("en-IN")}</span>
          </div>
        </div>
        <FieldLabel>Refund Method</FieldLabel>
        <select value={method} onChange={e=>setMethod(e.target.value)} style={{...SS,marginBottom:"14px"}}>
          <option value="CASH">💵 Cash Refund</option>
          <option value="UPI">📲 UPI / Bank Transfer</option>
          <option value="CARD">💳 Card Refund</option>
          <option value="STORE_CREDIT">🏷️ Store Credit</option>
          <option value="OTHER">💰 Other</option>
        </select>
        <FieldLabel>Refund Notes (optional)</FieldLabel>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Transferred to account ending 4567…" style={{width:"100%",minHeight:"60px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.14)",outline:"none",padding:"10px 14px",fontSize:"13px",fontFamily:"'Poppins',sans-serif",color:"#1a1a2e",background:"#fff",resize:"vertical",marginBottom:"18px",boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onConfirm(method,notes)} disabled={saving} style={{flex:1,padding:"11px",borderRadius:"11px",border:`1.5px solid ${PB}`,background:P,color:"#fff",fontSize:"13px",fontWeight:700,cursor:saving?"not-allowed":"pointer",opacity:saving?0.7:1}}>
            {saving?"Processing…":"✓ Confirm & Issue Refund"}
          </button>
          <button onClick={onClose} disabled={saving} style={{padding:"11px 18px",borderRadius:"11px",border:"1.5px solid rgba(26,26,46,.13)",background:"transparent",color:"rgba(26,26,46,.5)",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Returns(){
  const { user } = useContext(AuthContext);
  const [tab,setTab]=useState("list");
  const [returns,setReturns]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("ALL");
  const [saving,setSaving]=useState("");
  const [printRet,setPrintRet]=useState(null);
  const [refundRet,setRefundRet]=useState(null);
  const [refundSaving,setRefundSaving]=useState(false);
  const [expandedRow,setExpandedRow]=useState(null);
  const [form,setForm]=useState({invoiceLookup:"",invoiceNo:"",customerName:"",customerPhone:"",customerEmail:"",items:[{productName:"",qty:"1",unitPrice:"",reason:""}],refundMethod:"CASH",reason:"",notes:"",restockItems:true});
  const [submitting,setSubmitting]=useState(false);
  const [apiError,setApiError]=useState("");
  const [success,setSuccess]=useState("");
  const [errors,setErrors]=useState({});
  const [lookupLoading,setLookupLoading]=useState(false);
  const [lookupError,setLookupError]=useState("");

  const load=()=>{
    setLoading(true);
    axiosInstance.get("/returns")
      .then(r=>setReturns(Array.isArray(r.data)?r.data:[]))
      .catch(()=>setReturns([]))
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const set=k=>e=>{setForm(p=>({...p,[k]:e.target.value}));setErrors(p=>({...p,[k]:""}));};
  const setItem=(idx,k,v)=>setForm(p=>{const items=[...p.items];items[idx]={...items[idx],[k]:v};return{...p,items};});
  const addItem=()=>setForm(p=>({...p,items:[...p.items,{productName:"",qty:"1",unitPrice:"",reason:""}]}));
  const removeItem=idx=>setForm(p=>({...p,items:p.items.filter((_,i)=>i!==idx)}));

  const handleLookup=async()=>{
    if(!form.invoiceLookup.trim()){setLookupError("Enter an invoice number");return;}
    setLookupLoading(true);setLookupError("");
    try{
      const r=await axiosInstance.get("/invoices",{params:{invoiceNo:form.invoiceLookup.trim()}});
      const list=Array.isArray(r.data)?r.data:(r.data?.invoices||[]);
      const inv=list.find(i=>(i.invoiceNo||"").toLowerCase()===form.invoiceLookup.trim().toLowerCase())||list[0];
      if(!inv){setLookupError("Invoice not found. Fill details manually.");return;}
      const items=(inv.items||[]).map(i=>({productName:i.productName||i.product?.name||"",qty:"1",unitPrice:String(i.unitPrice||i.price||0),reason:""}));
      setForm(p=>({...p,invoiceNo:inv.invoiceNo||p.invoiceLookup,customerName:inv.customerName||inv.customer?.name||p.customerName,customerPhone:inv.customerPhone||p.customerPhone,customerEmail:inv.customerEmail||inv.customer?.email||p.customerEmail,items:items.length?items:[{productName:"",qty:"1",unitPrice:"",reason:""}]}));
    }catch{setLookupError("Could not load invoice. Fill details manually.");}
    finally{setLookupLoading(false);}
  };

  const handleSubmit=async e=>{
    e.preventDefault();
    const errs={};
    if(!form.customerName.trim()) errs.customerName="Customer name required";
    if(!form.items[0]?.productName.trim()) errs.product="At least one product required";
    if(!form.reason.trim()) errs.reason="Reason required";
    setErrors(errs);
    if(Object.keys(errs).length) return;
    setSubmitting(true);setApiError("");
    try{
      const payload={
        branch: user?.branch || undefined,
        customerName:form.customerName,
        customerPhone:form.customerPhone||undefined,
        customerEmail:form.customerEmail||undefined,
        invoiceNo:form.invoiceNo||undefined,
        refundMethod:form.refundMethod,
        reason:form.reason,
        notes:form.notes,
        restockItems:form.restockItems,
        items:form.items.filter(i=>i.productName.trim()).map(i=>({productName:i.productName,qty:Number(i.qty)||1,unitPrice:Number(i.unitPrice)||0,total:(Number(i.qty)||1)*(Number(i.unitPrice)||0),reason:i.reason||form.reason})),
      };
      const res=await axiosInstance.post("/returns",payload);
      setSuccess("Return submitted successfully!");
      setForm({invoiceLookup:"",invoiceNo:"",customerName:"",customerPhone:"",customerEmail:"",items:[{productName:"",qty:"1",unitPrice:"",reason:""}],refundMethod:"CASH",reason:"",notes:"",restockItems:true});
      setTimeout(()=>setSuccess(""),4000);
      setTab("list");load();
      if(res.data) setTimeout(()=>setPrintRet(res.data),600);
    }catch(err){setApiError(err?.response?.data?.message||"Failed to submit return.");}
    finally{setSubmitting(false);}
  };

  const handleStatusChange=async(id,status)=>{
    setSaving(id);
    try{
      await axiosInstance.put(`/returns/${id}`,{status});
      setReturns(p=>p.map(r=>r._id===id?{...r,status}:r));
    }catch{alert("Failed to update status.");}
    finally{setSaving("");}
  };

  const handleConfirmRefund=async(method,notes)=>{
    if(!refundRet) return;
    setRefundSaving(true);
    try{
      await axiosInstance.put(`/returns/${refundRet._id}`,{status:"COMPLETED",refundMethod:method,notes:notes||refundRet.notes});
      const updatedRet={...refundRet,status:"COMPLETED",refundMethod:method,notes:notes||refundRet.notes};
      setReturns(p=>p.map(r=>r._id===refundRet._id?updatedRet:r));
      setRefundRet(null);
      setTimeout(()=>setPrintRet(updatedRet),300);
    }catch{alert("Failed to issue refund.");}
    finally{setRefundSaving(false);}
  };

  const filtered=useMemo(()=>{
    let rows=returns;
    if(statusFilter!=="ALL") rows=rows.filter(r=>r.status===statusFilter);
    if(search){const q=search.toLowerCase();rows=rows.filter(r=>(r.returnNo||"").toLowerCase().includes(q)||(r.customerName||"").toLowerCase().includes(q)||(r.invoiceNo||"").toLowerCase().includes(q));}
    return rows;
  },[returns,search,statusFilter]);

  const stats=[
    ["Total Returns",returns.length,"#1a1a2e","rgba(26,26,46,.06)","rgba(26,26,46,.15)"],
    ["Pending",returns.filter(r=>r.status==="PENDING").length,AM,AML,AMB],
    ["Approved",returns.filter(r=>r.status==="APPROVED").length,P,PL,PB],
    ["Refunded",returns.filter(r=>r.status==="COMPLETED").length,B,BL,BB],
    ["Refund Total","₹"+returns.filter(r=>r.status==="COMPLETED").reduce((s,r)=>s+(r.returnAmount||0),0).toLocaleString("en-IN"),V,VL,VB],
  ];
  const sel={padding:"7px 12px",borderRadius:"9px",border:"1.5px solid rgba(26,26,46,.13)",outline:"none",fontSize:"13px",background:"#fff",cursor:"pointer"};
  const thS={padding:"10px 14px",textAlign:"left",fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.38)",letterSpacing:".14em",textTransform:"uppercase"};

  return(
    <PageShell title="Sales Returns" subtitle="Process returns, issue refunds and manage restocking">

      {printRet&&<PrintReceipt ret={printRet} onClose={()=>setPrintRet(null)}/>}
      {refundRet&&<RefundModal ret={refundRet} saving={refundSaving} onConfirm={handleConfirmRefund} onClose={()=>setRefundRet(null)}/>}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(140px, 100%), 1fr))",gap:"10px",marginBottom:"18px"}}>
        {stats.map(([label,count,color,bg,border])=>(
          <div key={label} style={{background:"#fff",borderRadius:"14px",border:`1px solid ${border}`,padding:"16px 18px",boxShadow:"0 2px 10px rgba(26,26,46,.04)"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:"24px",fontWeight:900,color}}>{count}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.4)",letterSpacing:".12em",textTransform:"uppercase",marginTop:"5px"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"4px",padding:"4px",background:"rgba(26,26,46,.06)",borderRadius:"12px",width:"fit-content",marginBottom:"18px"}}>
        {[["list","📋 Returns List"],["new","➕ New Return"]].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} type="button"
            style={{padding:"8px 20px",borderRadius:"9px",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:600,transition:"all .18s",background:tab===key?"#fff":"transparent",color:tab===key?"#1a1a2e":"rgba(26,26,46,.45)",boxShadow:tab===key?"0 1px 6px rgba(26,26,46,.1)":"none"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── LIST TAB ─── */}
      {tab==="list"&&(
        <>
          <div style={{display:"flex",gap:"8px",marginBottom:"14px",flexWrap:"wrap",alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <svg style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)"}} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input placeholder="Search by return #, customer, invoice…" value={search} onChange={e=>setSearch(e.target.value)} style={{...sel,paddingLeft:"32px",width:"280px"}}/>
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={sel}>
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_STYLE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={load} style={{...sel}}>↻ Refresh</button>
            <span style={{fontSize:"11px",color:"rgba(26,26,46,.38)",fontFamily:"'DM Mono',monospace"}}>{filtered.length} records</span>
          </div>

          <div style={{background:"#fff",borderRadius:"18px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",boxShadow:"0 2px 14px rgba(26,26,46,.05)"}}>
            {loading?(
              <div style={{padding:"60px",textAlign:"center",color:"rgba(26,26,46,.32)",fontSize:"13px"}}>Loading returns…</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr style={{background:"rgba(26,26,46,.03)",borderBottom:"1px solid rgba(26,26,46,.07)"}}>
                    {["","Return #","Date","Customer","Invoice","Amt","Refund","Status","Actions"].map(h=><th key={h} style={thS}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.length===0?(
                      <tr><td colSpan={9} style={{padding:"60px",textAlign:"center"}}>
                        <div style={{fontSize:"32px",marginBottom:"10px"}}>📦</div>
                        <div style={{fontSize:"14px",fontWeight:700,color:"rgba(26,26,46,.4)"}}>No returns found</div>
                      </td></tr>
                    ):filtered.flatMap((r,i)=>{
                      const isExp=expandedRow===r._id;
                      const rows=[
                        <tr key={r._id} style={{borderBottom:isExp?"none":"1px solid rgba(26,26,46,.042)",background:i%2===0?"#fff":"rgba(26,26,46,.01)"}}>
                          <td style={{padding:"8px 8px 8px 14px"}}>
                            <button type="button" onClick={()=>setExpandedRow(isExp?null:r._id)}
                              style={{width:"22px",height:"22px",borderRadius:"6px",border:"1px solid rgba(26,26,46,.12)",background:"transparent",cursor:"pointer",fontSize:"10px",color:"rgba(26,26,46,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              {isExp?"▲":"▼"}
                            </button>
                          </td>
                          <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:700,color:RD}}>{r.returnNo}</td>
                          <td style={{padding:"11px 14px",fontSize:"12px",color:"rgba(26,26,46,.5)"}}>{new Date(r.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                          <td style={{padding:"11px 14px",fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>
                            <div>{r.customerName||"Walk-in"}</div>
                            {r.customerPhone&&<div style={{fontSize:"10px",color:"rgba(26,26,46,.38)",fontFamily:"'DM Mono',monospace"}}>{r.customerPhone}</div>}
                          </td>
                          <td style={{padding:"11px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"rgba(26,26,46,.5)"}}>{r.invoiceNo||"—"}</td>
                          <td style={{padding:"11px 14px",fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:700,color:"#1a1a2e"}}>₹{(r.returnAmount||0).toLocaleString("en-IN")}</td>
                          <td style={{padding:"11px 14px"}}><span style={{padding:"2px 8px",borderRadius:"99px",background:B+"18",color:B,fontSize:"9.5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{REFUND_ICONS[r.refundMethod]||""} {r.refundMethod}</span></td>
                          <td style={{padding:"11px 14px"}}><StatusBadge status={r.status}/></td>
                          <td style={{padding:"11px 14px"}}>
                            <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                              {r.status==="PENDING"&&(<>
                                <button onClick={()=>handleStatusChange(r._id,"APPROVED")} disabled={saving===r._id} style={{padding:"4px 10px",borderRadius:"7px",border:`1px solid ${PB}`,background:PL,color:P,fontSize:"11px",fontWeight:700,cursor:"pointer"}}>✓ Approve</button>
                                <button onClick={()=>handleStatusChange(r._id,"REJECTED")} disabled={saving===r._id} style={{padding:"4px 10px",borderRadius:"7px",border:`1px solid ${RDB}`,background:RDL,color:RD,fontSize:"11px",fontWeight:700,cursor:"pointer"}}>✕ Reject</button>
                              </>)}
                              {r.status==="APPROVED"&&(
                                <button onClick={()=>setRefundRet(r)} disabled={saving===r._id} style={{padding:"4px 12px",borderRadius:"7px",border:`1px solid ${PB}`,background:P,color:"#fff",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>💵 Issue Refund</button>
                              )}
                              <button onClick={()=>setPrintRet(r)} style={{padding:"4px 10px",borderRadius:"7px",border:`1px solid ${BB}`,background:BL,color:B,fontSize:"11px",fontWeight:700,cursor:"pointer"}}>🧾</button>
                            </div>
                          </td>
                        </tr>
                      ];
                      if(isExp) rows.push(
                        <tr key={r._id+"_exp"} style={{borderBottom:"1px solid rgba(26,26,46,.042)"}}>
                          <td colSpan={9} style={{padding:"0 14px 14px",background:"rgba(26,26,46,.012)"}}>
                            <div style={{borderRadius:"10px",border:"1px solid rgba(26,26,46,.08)",overflow:"hidden",background:"#fff"}}>
                              <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(26,26,46,.06)",fontFamily:"'DM Mono',monospace",fontSize:"9.5px",color:"rgba(26,26,46,.4)",letterSpacing:".1em",textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span>Return Items ({r.items?.length||0})</span>
                                <span>Restock: <b style={{color:r.restockItems?P:RD}}>{r.restockItems?"Yes":"No"}</b> · Processed by: {r.processedBy?.name||"—"}</span>
                              </div>
                              <table style={{width:"100%",borderCollapse:"collapse"}}>
                                <thead><tr style={{background:"rgba(26,26,46,.02)"}}>
                                  {["Product","Qty","Unit Price","Total","Reason"].map(h=><th key={h} style={{...thS,fontSize:"8.5px"}}>{h}</th>)}
                                </tr></thead>
                                <tbody>
                                  {(r.items||[]).map((item,ii)=>(
                                    <tr key={ii} style={{borderTop:"1px solid rgba(26,26,46,.042)"}}>
                                      <td style={{padding:"8px 14px",fontSize:"12px",fontWeight:600,color:"#1a1a2e"}}>{item.productName}</td>
                                      <td style={{padding:"8px 14px",fontSize:"12px",color:"rgba(26,26,46,.6)"}}>{item.qty}</td>
                                      <td style={{padding:"8px 14px",fontSize:"12px",color:"rgba(26,26,46,.6)",fontFamily:"'DM Mono',monospace"}}>₹{(item.unitPrice||0).toLocaleString("en-IN")}</td>
                                      <td style={{padding:"8px 14px",fontSize:"12px",fontWeight:700,color:P,fontFamily:"'DM Mono',monospace"}}>₹{(item.total||0).toLocaleString("en-IN")}</td>
                                      <td style={{padding:"8px 14px",fontSize:"11px",color:"rgba(26,26,46,.45)"}}>{item.reason||r.reason||"—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {r.notes&&<div style={{padding:"8px 14px",borderTop:"1px solid rgba(26,26,46,.06)",fontSize:"11px",color:"rgba(26,26,46,.45)"}}>📝 {r.notes}</div>}
                            </div>
                          </td>
                        </tr>
                      );
                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── NEW RETURN TAB ─── */}
      {tab==="new"&&(
        <Card style={{maxWidth: "min(640px, 100%)"}}>
          {success&&<div style={{padding:"11px 16px",borderRadius:"10px",background:PL,border:`1px solid ${PB}`,color:P,fontSize:"13px",fontWeight:600,marginBottom:"16px"}}>✓ {success}</div>}
          <FormError message={apiError}/>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"16px",fontWeight:800,color:"#1a1a2e",marginBottom:"16px"}}>New Return Request</div>

          {/* Invoice Lookup */}
          <div style={{background:"rgba(2,132,199,.04)",border:`1px solid ${BB}`,borderRadius:"12px",padding:"14px",marginBottom:"18px"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:B,letterSpacing:".12em",textTransform:"uppercase",marginBottom:"10px",fontWeight:700}}>🔍 Invoice Lookup (Auto-fill)</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <input placeholder="Enter Invoice # (e.g. INV-0042)" value={form.invoiceLookup}
                onChange={e=>{setForm(p=>({...p,invoiceLookup:e.target.value}));setLookupError("");}}
                onKeyDown={e=>e.key==="Enter"&&handleLookup()}
                style={{...IS,flex:1,marginBottom:0}}/>
              <button type="button" onClick={handleLookup} disabled={lookupLoading}
                style={{padding:"10px 16px",borderRadius:"10px",border:`1.5px solid ${BB}`,background:BL,color:B,fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                {lookupLoading?"Searching…":"Load Invoice"}
              </button>
            </div>
            {lookupError&&<div style={{color:AM,fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"6px"}}>⚠ {lookupError}</div>}
            <div style={{fontSize:"11px",color:"rgba(26,26,46,.38)",marginTop:"6px"}}>Load an existing invoice to auto-fill customer & item details</div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div>
                <FieldLabel>Customer Name *</FieldLabel>
                <input placeholder="Customer name" value={form.customerName} onChange={set("customerName")} style={{...IS,borderColor:errors.customerName?"rgba(239,68,68,.5)":undefined}}/>
                {errors.customerName&&<Err>{errors.customerName}</Err>}
              </div>
              <div>
                <FieldLabel>Customer Phone</FieldLabel>
                <input placeholder="+91 XXXXX XXXXX" value={form.customerPhone} onChange={set("customerPhone")} style={IS}/>
              </div>
            </div>

            <FieldLabel>Customer Email <span style={{fontSize:"10px",color:"rgba(26,26,46,.4)",fontFamily:"'DM Mono',monospace",fontWeight:400}}>(receipt will be emailed if provided)</span></FieldLabel>
            <input placeholder="customer@example.com" type="email" value={form.customerEmail} onChange={set("customerEmail")} style={{...IS,marginBottom:"14px"}}/>

            <FieldLabel>Invoice # (reference)</FieldLabel>
            <input placeholder="INV-XXXX" value={form.invoiceNo} onChange={set("invoiceNo")} style={{...IS,marginBottom:"14px"}}/>

            <FieldLabel>Return Reason *</FieldLabel>
            <select value={form.reason} onChange={set("reason")} style={{...SS,borderColor:errors.reason?"rgba(239,68,68,.5)":undefined}}>
              <option value="">— Select Reason —</option>
              {["Defective product","Wrong item delivered","Excess order","Customer changed mind","Damaged in transit","Expired / near expiry","Quality issue","Size/spec mismatch","Other"].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            {errors.reason&&<Err>{errors.reason}</Err>}

            {/* Items */}
            <FieldLabel>Items Being Returned *</FieldLabel>
            {errors.product&&<Err>{errors.product}</Err>}
            <div style={{background:"rgba(26,26,46,.018)",borderRadius:"10px",border:"1px solid rgba(26,26,46,.08)",padding:"12px",marginBottom:"14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"6px",marginBottom:"6px"}}>
                {["Product Name","Qty","Unit Price (₹)",""].map((h,i)=><div key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"rgba(26,26,46,.35)",letterSpacing:".1em",textTransform:"uppercase",padding:"0 2px"}}>{h}</div>)}
              </div>
              {form.items.map((item,idx)=>(
                <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"6px",marginBottom:"6px",alignItems:"start"}}>
                  <input placeholder="Product name" value={item.productName} onChange={e=>setItem(idx,"productName",e.target.value)} style={{...IS,marginBottom:0,fontSize:"13px"}}/>
                  <input type="number" placeholder="Qty" min="1" value={item.qty} onChange={e=>setItem(idx,"qty",e.target.value)} style={{...IS,marginBottom:0,fontSize:"13px"}}/>
                  <input type="number" placeholder="0.00" min="0" value={item.unitPrice} onChange={e=>setItem(idx,"unitPrice",e.target.value)} style={{...IS,marginBottom:0,fontSize:"13px"}}/>
                  {form.items.length>1&&<button type="button" onClick={()=>removeItem(idx)} style={{height:"46px",padding:"0 12px",borderRadius:"10px",border:`1px solid ${RDB}`,background:RDL,color:RD,cursor:"pointer",fontSize:"16px"}}>×</button>}
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
                <button type="button" onClick={addItem} style={{padding:"7px 14px",borderRadius:"9px",border:"1.5px dashed rgba(26,26,46,.2)",background:"transparent",color:"rgba(26,26,46,.5)",fontSize:"12px",fontWeight:600,cursor:"pointer"}}>+ Add Item</button>
                <div style={{fontFamily:"'Fraunces',serif",fontSize:"14px",fontWeight:800,color:"#1a1a2e"}}>
                  Total: <span style={{color:P}}>₹{form.items.reduce((s,i)=>s+((Number(i.qty)||0)*(Number(i.unitPrice)||0)),0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <FieldLabel>Refund Method</FieldLabel>
            <select value={form.refundMethod} onChange={set("refundMethod")} style={{...SS,marginBottom:"14px"}}>
              <option value="CASH">💵 Cash Refund</option>
              <option value="UPI">📲 UPI / Bank Transfer</option>
              <option value="CARD">💳 Card Refund</option>
              <option value="STORE_CREDIT">🏷️ Store Credit</option>
              <option value="OTHER">💰 Other</option>
            </select>

            {/* Restock Toggle */}
            <div style={{display:"flex",alignItems:"center",gap:"14px",padding:"12px 16px",borderRadius:"10px",background:"rgba(5,150,105,.04)",border:`1px solid ${PB}`,marginBottom:"14px"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1a1a2e"}}>Restock Returned Items</div>
                <div style={{fontSize:"11px",color:"rgba(26,26,46,.45)",marginTop:"2px"}}>Automatically add returned qty back to inventory stock</div>
              </div>
              <button type="button" onClick={()=>setForm(p=>({...p,restockItems:!p.restockItems}))}
                style={{width:"44px",height:"24px",borderRadius:"99px",border:"none",cursor:"pointer",transition:"background .2s",background:form.restockItems?P:"rgba(26,26,46,.18)",position:"relative",flexShrink:0}}>
                <div style={{position:"absolute",top:"2px",left:form.restockItems?"22px":"2px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,.2)",transition:"left .2s"}}/>
              </button>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:"10px",fontWeight:700,color:form.restockItems?P:"rgba(26,26,46,.4)"}}>{form.restockItems?"ON":"OFF"}</span>
            </div>

            <FieldLabel>Additional Notes</FieldLabel>
            <textarea placeholder="Any additional notes…" value={form.notes} onChange={set("notes")} style={{width:"100%",minHeight:"70px",borderRadius:"10px",border:"1.5px solid rgba(26,26,46,.14)",outline:"none",padding:"10px 14px",fontSize:"13px",fontFamily:"'Poppins',sans-serif",color:"#1a1a2e",background:"#fff",resize:"vertical",marginBottom:"16px",boxSizing:"border-box"}}/>

            <div style={{display:"flex",gap:"10px"}}>
              <Button type="submit" loading={submitting} accent={RD} glow="rgba(239,68,68,.2)">Submit Return</Button>
              <Button variant="secondary" type="button" onClick={()=>setTab("list")}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
