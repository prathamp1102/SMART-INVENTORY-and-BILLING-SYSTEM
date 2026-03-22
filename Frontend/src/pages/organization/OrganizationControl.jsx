import { useState, useEffect, useCallback } from "react";
import * as orgService from "../../services/organizationService";
import ExcelExport from "../../components/ui/ExcelExport";

const ac       = "#7c3aed";
const acLight  = "rgba(124,58,237,.08)";
const acBorder = "rgba(124,58,237,.2)";
const acGlow   = "rgba(124,58,237,.18)";
const green    = "#059669";
const greenLight  = "rgba(5,150,105,.08)";
const greenBorder = "rgba(5,150,105,.2)";
const blue     = "#0284c7";
const blueLight  = "rgba(2,132,199,.08)";
const blueBorder = "rgba(2,132,199,.2)";
const red      = "#dc2626";

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ fontSize:"11px", fontWeight:700, color, background:bg, border:`1px solid ${border}`, borderRadius:"99px", padding:"2px 9px", fontFamily:"'DM Mono',monospace", letterSpacing:".08em" }}>
      {label}
    </span>
  );
}
function Pill({ active }) {
  return active
    ? <Badge label="Active"   color={green} bg={greenLight} border={greenBorder} />
    : <Badge label="Inactive" color="#b45309" bg="rgba(180,83,9,.08)" border="rgba(180,83,9,.2)" />;
}
function IconBtn({ icon, title, onClick, danger }) {
  return (
    <button title={title} onClick={onClick}
      style={{ width:"30px", height:"30px", borderRadius:"8px", border:`1px solid ${danger?"rgba(239,68,68,.2)":acBorder}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:danger?"#ef4444":ac, transition:"all .15s" }}
      onMouseEnter={e=>{e.currentTarget.style.background=danger?"rgba(239,68,68,.1)":acLight;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
      </svg>
    </button>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,26,46,.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#fff", borderRadius:"20px", width:"100%", maxWidth: "min(500px, 100%)", boxShadow:"0 24px 80px rgba(26,26,46,.25)", animation:"fadeUp .22s ease both", maxHeight:"90vh", overflow:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"1px solid rgba(26,26,46,.07)", position:"sticky", top:0, background:"#fff", zIndex:1 }}>
          <span style={{ fontFamily:"'Fraunces',serif", fontSize:"16px", fontWeight:800, color:"#1a1a2e" }}>{title}</span>
          <button onClick={onClose} style={{ width:"28px", height:"28px", borderRadius:"8px", border:"1px solid rgba(26,26,46,.12)", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(26,26,46,.45)" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ padding:"22px 24px" }}>{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <label style={{ display:"block", fontSize:"11.5px", fontWeight:700, color:"rgba(26,26,46,.5)", fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", marginBottom:"6px" }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { width:"100%", padding:"9px 12px", borderRadius:"10px", border:"1.5px solid rgba(26,26,46,.12)", fontSize:"13px", color:"#1a1a2e", background:"#fafafa", outline:"none", fontFamily:"'Poppins',sans-serif", boxSizing:"border-box", transition:"border-color .15s" };
function Input(props) {
  return <input {...props} style={inputStyle} onFocus={e=>e.target.style.borderColor=ac} onBlur={e=>e.target.style.borderColor="rgba(26,26,46,.12)"}/>;
}
function FSelect({ children, value, onChange, style: s }) {
  return (
    <select value={value} onChange={onChange} style={{ ...inputStyle, appearance:"none", cursor:"pointer", ...s }}
      onFocus={e=>e.target.style.borderColor=ac}
      onBlur={e=>e.target.style.borderColor="rgba(26,26,46,.12)"}>
      {children}
    </select>
  );
}
function Spinner({ size=20, color=ac }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", border:"2px solid rgba(124,58,237,.2)", borderTopColor:color, animation:"spin .7s linear infinite", flexShrink:0 }}/>;
}
function SaveBtn({ onClick, label="Save", loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding:"10px 24px", borderRadius:"11px", border:"none", cursor:loading?"not-allowed":"pointer", background:`linear-gradient(135deg,${ac},#6d28d9)`, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif", boxShadow:`0 4px 16px ${acGlow}`, opacity:loading?0.7:1, display:"flex", alignItems:"center", gap:"7px" }}>
      {loading&&<Spinner size={14} color="#fff"/>}
      {label}
    </button>
  );
}
function CancelBtn({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding:"10px 20px", borderRadius:"11px", border:`1.5px solid ${acBorder}`, cursor:"pointer", background:acLight, color:ac, fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif" }}>
      Cancel
    </button>
  );
}
function Toast({ message, type="success" }) {
  const bg = type==="error"?red:green;
  return (
    <div style={{ position:"fixed", bottom:"28px", right:"28px", background:bg, color:"#fff", padding:"12px 20px", borderRadius:"12px", fontSize:"13px", fontWeight:700, boxShadow:"0 8px 28px rgba(0,0,0,.2)", zIndex:9999, animation:"fadeUp .2s ease both", maxWidth: "min(320px, 100%)" }}>
      {type==="error"?"✗":"✓"} {message}
    </div>
  );
}
function Tab({ active, label, icon, count, onClick }) {
  return (
    <button onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:"8px", padding:"9px 18px", borderRadius:"11px", border:`1px solid ${active?acBorder:"transparent"}`, background:active?acLight:"transparent", color:active?ac:"rgba(26,26,46,.5)", fontSize:"13px", fontWeight:active?700:500, cursor:"pointer", fontFamily:"'Poppins',sans-serif", transition:"all .15s", whiteSpace:"nowrap" }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={icon}/></svg>
      {label}
      {count!=null&&<span style={{ fontSize:"10px", fontWeight:800, background:active?ac:"rgba(26,26,46,.12)", color:active?"#fff":"rgba(26,26,46,.45)", borderRadius:"99px", padding:"1px 7px", fontFamily:"'DM Mono',monospace" }}>{count}</span>}
    </button>
  );
}

// ══════ COMPANIES TAB ══════
function CompaniesTab({ companies, loading, onRefresh, showToast }) {
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const openAdd  = () => { setForm({ status:"ACTIVE" }); setModal("add"); };
  const openEdit = (c) => { setForm({...c}); setModal({ edit:c }); };
  const closeModal = () => { setModal(null); setForm({}); };

  const handleSave = async () => {
    if (!form.name?.trim()) return showToast("Organization name is required.","error");
    setSaving(true);
    try {
      const payload = { name:form.name, gstNumber:form.gstNumber, email:form.email, phone:form.phone, city:form.city, state:form.state, address:form.address, status:form.status||"ACTIVE" };
      if (modal==="add") { await orgService.createOrganization(payload); showToast("Organization created!"); }
      else { await orgService.updateOrganization(form._id,payload); showToast("Organization updated!"); }
      closeModal(); onRefresh();
    } catch(err) { showToast(err.response?.data?.message||"Failed to save.","error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await orgService.deleteOrganization(deleteConfirm); showToast("Deleted."); setDeleteConfirm(null); onRefresh(); }
    catch(err) { showToast(err.response?.data?.message||"Delete failed.","error"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"16px", gap:"10px" }}>
        <ExcelExport
          data={companies}
          filename="organizations_export"
          sheetName="Organizations"
          columns={[
            {key:"name",label:"Organization Name"},
            {key:"gstNumber",label:"GST Number"},
            {key:"email",label:"Email"},
            {key:"phone",label:"Phone"},
            {key:"address",label:"Address"},
            {key:"city",label:"City"},
            {key:"state",label:"State"},
            {key:"status",label:"Status"},
          ]}
        />
        <button onClick={openAdd} style={{ display:"flex", alignItems:"center", gap:"7px", padding:"9px 18px", borderRadius:"11px", border:"none", cursor:"pointer", background:`linear-gradient(135deg,${ac},#6d28d9)`, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif", boxShadow:`0 4px 16px ${acGlow}` }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Organization
        </button>
      </div>
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"48px" }}><Spinner/></div>
      ) : (
        <div style={{ display:"grid", gap:"12px" }}>
          {companies.map(c=>(
            <div key={c._id} style={{ background:"#fff", borderRadius:"16px", border:"1px solid rgba(26,26,46,.08)", padding:"18px 20px", display:"flex", alignItems:"center", gap:"16px", boxShadow:"0 2px 10px rgba(26,26,46,.04)", transition:"box-shadow .18s" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(26,26,46,.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(26,26,46,.04)"}>
              <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`linear-gradient(135deg,${ac},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 4px 14px ${acGlow}` }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
                  <span style={{ fontSize:"14.5px", fontWeight:700, color:"#1a1a2e" }}>{c.name}</span>
                  <Pill active={c.status==="ACTIVE"}/>
                </div>
                <div style={{ fontSize:"12px", color:"rgba(26,26,46,.42)", fontFamily:"'DM Mono',monospace" }}>{[c.gstNumber,c.city,c.state].filter(Boolean).join(" · ")}</div>
                <div style={{ fontSize:"12px", color:"rgba(26,26,46,.42)", marginTop:"2px" }}>{[c.email,c.phone].filter(Boolean).join(" · ")}</div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <IconBtn icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" title="Edit" onClick={()=>openEdit(c)}/>
                <IconBtn icon="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" title="Delete" danger onClick={()=>setDeleteConfirm(c._id)}/>
              </div>
            </div>
          ))}
          {companies.length===0&&<div style={{ textAlign:"center", padding:"48px", color:"rgba(26,26,46,.3)", fontSize:"13px" }}>No organizations yet.</div>}
        </div>
      )}
      {modal&&(
        <Modal title={modal==="add"?"Add Organization":"Edit Organization"} onClose={closeModal}>
          <Field label="Name *"><Input placeholder="EVARA Pvt Ltd" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
          <Field label="GST Number"><Input placeholder="27AAECS1234A1Z5" value={form.gstNumber||""} onChange={e=>setForm(f=>({...f,gstNumber:e.target.value}))}/></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <Field label="Email"><Input type="email" placeholder="admin@company.in" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
            <Field label="Phone"><Input placeholder="+91 98765 43210" value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field>
          </div>
          <Field label="Address"><Input placeholder="123 Business Park" value={form.address||""} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
            <Field label="City"><Input placeholder="Mumbai" value={form.city||""} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></Field>
            <Field label="State"><Input placeholder="Maharashtra" value={form.state||""} onChange={e=>setForm(f=>({...f,state:e.target.value}))}/></Field>
            <Field label="Status">
              <FSelect value={form.status||"ACTIVE"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </FSelect>
            </Field>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"8px" }}>
            <CancelBtn onClick={closeModal}/>
            <SaveBtn onClick={handleSave} loading={saving} label={modal==="add"?"Create":"Save Changes"}/>
          </div>
        </Modal>
      )}
      {deleteConfirm&&(
        <Modal title="Delete Organization" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ fontSize:"13.5px", color:"rgba(26,26,46,.6)", marginBottom:"20px" }}>Are you sure? This cannot be undone.</p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <CancelBtn onClick={()=>setDeleteConfirm(null)}/>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding:"10px 20px", borderRadius:"11px", border:"none", cursor:"pointer", background:red, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:"7px", opacity:deleting?0.7:1 }}>
              {deleting&&<Spinner size={14} color="#fff"/>}Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════ BRANCHES TAB ══════
function BranchesTab({ branches, organizations, admins, loading, onRefresh, showToast }) {
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [filterOrg, setFilterOrg] = useState("all");

  const openAdd  = () => { setForm({ status:"ACTIVE" }); setModal("add"); };
  const openEdit = (b) => { setForm({...b, organization:b.organization?._id||b.organization, admin:b.admin?._id||b.admin||""}); setModal({ edit:b }); };
  const closeModal = () => { setModal(null); setForm({}); };

  const handleSave = async () => {
    if (!form.branchName?.trim()) return showToast("Branch name is required.","error");
    if (!form.organization) return showToast("Organization is required.","error");
    setSaving(true);
    try {
      const payload = { branchName:form.branchName, organization:form.organization, address:form.address, city:form.city, state:form.state, admin:form.admin||undefined, status:form.status||"ACTIVE" };
      if (modal==="add") { await orgService.createBranch(payload); showToast("Branch created!"); }
      else { await orgService.updateBranch(form._id,payload); showToast("Branch updated!"); }
      closeModal(); onRefresh();
    } catch(err) { showToast(err.response?.data?.message||"Failed to save.","error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await orgService.deleteBranch(deleteConfirm); showToast("Branch deleted."); setDeleteConfirm(null); onRefresh(); }
    catch(err) { showToast(err.response?.data?.message||"Delete failed.","error"); }
    finally { setDeleting(false); }
  };

  const filtered = filterOrg==="all" ? branches : branches.filter(b=>(b.organization?._id||b.organization)===filterOrg);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", gap:"12px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"12px", color:"rgba(26,26,46,.45)", fontFamily:"'DM Mono',monospace" }}>Filter:</span>
          <select value={filterOrg} onChange={e=>setFilterOrg(e.target.value)}
            style={{ ...inputStyle, width:"auto", fontSize:"12px", padding:"6px 10px", appearance:"none" }}>
            <option value="all">All Organizations</option>
            {organizations.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <ExcelExport
            data={filtered}
            filename="branches_export"
            sheetName="Branches"
            accent={{color:green,light:greenLight,border:greenBorder}}
            columns={[
              {key:"branchName",label:"Branch Name"},
              {key:"organization.name",label:"Organization"},
              {key:"address",label:"Address"},
              {key:"city",label:"City"},
              {key:"state",label:"State"},
              {key:"status",label:"Status"},
              {key:"admin.name",label:"Admin Name"},
              {key:"admin.email",label:"Admin Email"},
            ]}
          />
          <button onClick={openAdd} style={{ display:"flex", alignItems:"center", gap:"7px", padding:"9px 18px", borderRadius:"11px", border:"none", cursor:"pointer", background:`linear-gradient(135deg,${green},#047857)`, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif", boxShadow:`0 4px 16px ${greenBorder}` }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Branch
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"48px" }}><Spinner/></div>
      ) : (
        <div style={{ display:"grid", gap:"12px" }}>
          {filtered.map(b=>(
            <div key={b._id} style={{ background:"#fff", borderRadius:"16px", border:"1px solid rgba(26,26,46,.08)", padding:"16px 20px", display:"flex", alignItems:"center", gap:"14px", boxShadow:"0 2px 10px rgba(26,26,46,.04)", transition:"box-shadow .18s" }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(26,26,46,.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 10px rgba(26,26,46,.04)"}>
              <div style={{ width:"40px", height:"40px", borderRadius:"11px", background:`linear-gradient(135deg,${green},#047857)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 12px ${greenBorder}` }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"3px" }}>
                  <span style={{ fontSize:"14px", fontWeight:700, color:"#1a1a2e" }}>{b.branchName}</span>
                  <Pill active={b.status==="ACTIVE"}/>
                </div>
                <div style={{ fontSize:"12px", color:"rgba(26,26,46,.42)" }}>{[b.address,b.city,b.state].filter(Boolean).join(", ")}</div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"5px", flexWrap:"wrap" }}>
                  {b.organization&&<Badge label={b.organization.name} color={ac} bg={acLight} border={acBorder}/>}
                  {b.admin
                    ?<Badge label={`Admin: ${b.admin.name}`} color={blue} bg={blueLight} border={blueBorder}/>
                    :<Badge label="No Admin" color="#b45309" bg="rgba(180,83,9,.08)" border="rgba(180,83,9,.2)"/>}
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <IconBtn icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" title="Edit" onClick={()=>openEdit(b)}/>
                <IconBtn icon="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" title="Delete" danger onClick={()=>setDeleteConfirm(b._id)}/>
              </div>
            </div>
          ))}
          {filtered.length===0&&<div style={{ textAlign:"center", padding:"48px", color:"rgba(26,26,46,.3)", fontSize:"13px" }}>No branches found.</div>}
        </div>
      )}
      {modal&&(
        <Modal title={modal==="add"?"Add Branch":"Edit Branch"} onClose={closeModal}>
          <Field label="Branch Name *"><Input placeholder="Head Office - Andheri" value={form.branchName||""} onChange={e=>setForm(f=>({...f,branchName:e.target.value}))}/></Field>
          <Field label="Organization *">
            <FSelect value={form.organization||""} onChange={e=>setForm(f=>({...f,organization:e.target.value}))}>
              <option value="">Select Organization</option>
              {organizations.map(o=><option key={o._id} value={o._id}>{o.name}</option>)}
            </FSelect>
          </Field>
          <Field label="Address"><Input placeholder="Andheri East, Mumbai" value={form.address||""} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
            <Field label="City"><Input placeholder="Mumbai" value={form.city||""} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></Field>
            <Field label="State"><Input placeholder="Maharashtra" value={form.state||""} onChange={e=>setForm(f=>({...f,state:e.target.value}))}/></Field>
            <Field label="Status">
              <FSelect value={form.status||"ACTIVE"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </FSelect>
            </Field>
          </div>
          <Field label="Assign Admin (Optional)">
            <FSelect value={form.admin||""} onChange={e=>setForm(f=>({...f,admin:e.target.value||""}))}>
              <option value="">— No Admin —</option>
              {admins
                .filter(a => {
                  // Always show the admin currently assigned to THIS branch (so they can keep it)
                  const currentBranchAdminId = modal?.edit?.admin?._id || modal?.edit?.admin || "";
                  if (String(a._id) === String(currentBranchAdminId)) return true;
                  // Hide admins already assigned to any other branch
                  const assignedToOtherBranch = branches.some(b => {
                    const bAdminId = b.admin?._id || b.admin;
                    return String(bAdminId) === String(a._id);
                  });
                  return !assignedToOtherBranch;
                })
                .map(a => <option key={a._id} value={a._id}>{a.name} ({a.email})</option>)
              }
            </FSelect>
          </Field>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"8px" }}>
            <CancelBtn onClick={closeModal}/>
            <SaveBtn onClick={handleSave} loading={saving} label={modal==="add"?"Create Branch":"Save Changes"}/>
          </div>
        </Modal>
      )}
      {deleteConfirm&&(
        <Modal title="Delete Branch" onClose={()=>setDeleteConfirm(null)}>
          <p style={{ fontSize:"13.5px", color:"rgba(26,26,46,.6)", marginBottom:"20px" }}>Are you sure you want to delete this branch?</p>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <CancelBtn onClick={()=>setDeleteConfirm(null)}/>
            <button onClick={handleDelete} disabled={deleting}
              style={{ padding:"10px 20px", borderRadius:"11px", border:"none", cursor:"pointer", background:red, color:"#fff", fontSize:"13px", fontWeight:700, fontFamily:"'Poppins',sans-serif", display:"flex", alignItems:"center", gap:"7px", opacity:deleting?0.7:1 }}>
              {deleting&&<Spinner size={14} color="#fff"/>}Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════ ASSIGN ADMINS TAB ══════
function AssignAdminTab({ branches, admins, onRefresh, showToast }) {
  const [saving, setSaving] = useState(null);

  const handleAssign = async (branchId, adminId) => {
    setSaving(branchId);
    try {
      await orgService.assignAdmin(branchId, adminId||null);
      showToast("Admin assignment updated!");
      onRefresh();
    } catch(err) {
      showToast(err.response?.data?.message||"Assignment failed.","error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <div style={{ background:acLight, border:`1px solid ${acBorder}`, borderRadius:"13px", padding:"13px 16px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"10px" }}>
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
        <span style={{ fontSize:"12.5px", color:ac, fontWeight:600 }}>Select an Admin for each branch. Changes are saved directly to the backend.</span>
      </div>
      <div style={{ display:"grid", gap:"10px" }}>
        {branches.map(b=>{
          const currentAdmin = b.admin;
          const isSaving = saving===b._id;
          return (
            <div key={b._id} style={{ background:"#fff", borderRadius:"15px", border:"1px solid rgba(26,26,46,.08)", padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px", boxShadow:"0 2px 8px rgba(26,26,46,.04)", flexWrap:"wrap" }}>
              <div style={{ flex:1, minWidth:"160px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={green} strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21"/></svg>
                  <span style={{ fontSize:"14px", fontWeight:700, color:"#1a1a2e" }}>{b.branchName}</span>
                  <Pill active={b.status==="ACTIVE"}/>
                </div>
                {b.organization&&<span style={{ fontSize:"11.5px", color:"rgba(26,26,46,.4)", fontFamily:"'DM Mono',monospace" }}>{b.organization.name}</span>}
              </div>
              <div style={{ flexShrink:0, minWidth:"150px" }}>
                {currentAdmin
                  ?<div style={{ background:blueLight, border:`1px solid ${blueBorder}`, borderRadius:"9px", padding:"7px 12px" }}>
                      <div style={{ fontSize:"9.5px", color:blue, fontFamily:"'DM Mono',monospace", letterSpacing:".1em", textTransform:"uppercase", marginBottom:"2px" }}>Current Admin</div>
                      <div style={{ fontSize:"12.5px", fontWeight:700, color:"#1a1a2e" }}>{currentAdmin.name}</div>
                      <div style={{ fontSize:"11px", color:"rgba(26,26,46,.4)" }}>{currentAdmin.email}</div>
                    </div>
                  :<div style={{ background:"rgba(180,83,9,.06)", border:"1px solid rgba(180,83,9,.18)", borderRadius:"9px", padding:"7px 12px" }}>
                      <div style={{ fontSize:"11px", color:"#b45309", fontWeight:600 }}>No Admin Assigned</div>
                    </div>
                }
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                <select
                  defaultValue={b.admin?._id||""}
                  key={b.admin?._id||"none"}
                  onChange={e=>handleAssign(b._id,e.target.value||null)}
                  disabled={!!isSaving}
                  style={{ ...inputStyle, width:"210px", fontSize:"12.5px", padding:"8px 10px", appearance:"none", cursor:"pointer" }}>
                  <option value="">— Remove Admin —</option>
                  {admins.map(a=><option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
                {isSaving&&<Spinner size={20}/>}
              </div>
            </div>
          );
        })}
        {branches.length===0&&<div style={{ textAlign:"center", padding:"48px", color:"rgba(26,26,46,.3)", fontSize:"13px" }}>No branches yet. Create branches first.</div>}
      </div>
      {admins.length>0&&(
        <div style={{ marginTop:"28px", background:"#fff", borderRadius:"16px", border:"1px solid rgba(26,26,46,.08)", padding:"20px", boxShadow:"0 2px 10px rgba(26,26,46,.04)" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:"14px", fontWeight:800, color:"#1a1a2e", marginBottom:"14px" }}>Admin Pool</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(200px, 100%), 1fr))", gap:"10px" }}>
            {admins.map(a=>{
              const assignedCount = branches.filter(b=>b.admin?._id===a._id||b.admin===a._id).length;
              return (
                <div key={a._id} style={{ background:acLight, border:`1px solid ${acBorder}`, borderRadius:"12px", padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"6px" }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${ac},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:"12px", fontWeight:700, color:"#fff" }}>{a.name[0]}</span>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:"12.5px", fontWeight:700, color:"#1a1a2e", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                      <div style={{ fontSize:"10.5px", color:"rgba(26,26,46,.4)" }}>{a.email}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:"11px", color:"rgba(26,26,46,.42)", fontFamily:"'DM Mono',monospace" }}>
                    {assignedCount===0?"Unassigned":`${assignedCount} branch${assignedCount>1?"es":""}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════ MAIN PAGE ══════
export default function OrganizationControl() {
  const [tab, setTab]           = useState("companies");
  const [organizations, setOrgs]= useState([]);
  const [branches, setBranches] = useState([]);
  const [admins, setAdmins]     = useState([]);
  const [loadingOrgs, setLoadingOrgs]       = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [toast, setToast]       = useState(null);

  const showToast = (message, type="success") => {
    setToast({ message, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    try { const d = await orgService.getOrganizations(); setOrgs(d); }
    catch { showToast("Failed to load organizations.","error"); }
    finally { setLoadingOrgs(false); }
  },[]);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    try { const d = await orgService.getBranches(); setBranches(d); }
    catch { showToast("Failed to load branches.","error"); }
    finally { setLoadingBranches(false); }
  },[]);

  const fetchAdmins = useCallback(async () => {
    try { const d = await orgService.getAdminUsers(); setAdmins(d); }
    catch {}
  },[]);

  useEffect(()=>{ fetchOrgs(); fetchBranches(); fetchAdmins(); },[fetchOrgs,fetchBranches,fetchAdmins]);

  const handleRefreshAll = () => { fetchOrgs(); fetchBranches(); fetchAdmins(); };

  const stats = [
    { label:"Organizations", value:organizations.length, active:`${organizations.filter(o=>o.status==="ACTIVE").length} active` },
    { label:"Branches",      value:branches.length,      active:`${branches.filter(b=>b.status==="ACTIVE").length} active` },
    { label:"Admins",        value:admins.length,         active:`${branches.filter(b=>b.admin).length} assigned` },
  ];

  return (
    <div style={{ animation:"fadeUp .4s ease both" }}>
      {toast&&<Toast message={toast.message} type={toast.type}/>}

      <div style={{ marginBottom:"24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
          <div style={{ width:"36px", height:"36px", borderRadius:"11px", background:`linear-gradient(135deg,${ac},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 14px ${acGlow}` }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
          </div>
          <div>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"24px", fontWeight:900, color:"#1a1a2e", letterSpacing:"-.04em", margin:0, lineHeight:1 }}>Organization Control</h1>
            <p style={{ fontSize:"13px", color:"rgba(26,26,46,.42)", margin:0, marginTop:"3px" }}>Manage organizations, branches & admin assignments</p>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"22px" }}>
        {stats.map(s=>(
          <div key={s.label} style={{ background:"#fff", borderRadius:"14px", border:`1px solid ${acBorder}`, padding:"16px 18px", boxShadow:`0 2px 12px ${acGlow}` }}>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:"26px", fontWeight:900, color:"#1a1a2e", letterSpacing:"-.04em" }}>{s.value}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9.5px", color:"rgba(26,26,46,.35)", letterSpacing:".14em", textTransform:"uppercase", marginTop:"4px" }}>{s.label}</div>
            <div style={{ fontSize:"11px", color:green, fontWeight:600, marginTop:"6px" }}>✓ {s.active}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
        <Tab active={tab==="companies"} label="Organizations" count={organizations.length}
          icon="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"
          onClick={()=>setTab("companies")}/>
        <Tab active={tab==="branches"} label="Branches" count={branches.length}
          icon="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36"
          onClick={()=>setTab("branches")}/>
        <Tab active={tab==="assign"} label="Assign Admins"
          icon="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
          onClick={()=>setTab("assign")}/>
      </div>

      {tab==="companies"&&<CompaniesTab companies={organizations} loading={loadingOrgs} onRefresh={handleRefreshAll} showToast={showToast}/>}
      {tab==="branches"&&<BranchesTab branches={branches} organizations={organizations} admins={admins} loading={loadingBranches} onRefresh={handleRefreshAll} showToast={showToast}/>}
      {tab==="assign"&&<AssignAdminTab branches={branches} admins={admins} onRefresh={handleRefreshAll} showToast={showToast}/>}

      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(12px); } to { opacity:1;transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}