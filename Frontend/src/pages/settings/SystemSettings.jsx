import ConfirmModal from "../../components/ui/ConfirmModal";
import { useState, useEffect, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";
import {
  getTaxConfig, saveTaxConfig,
  getInvoiceConfig, saveInvoiceConfig,
  getCurrencyConfig, saveCurrencyConfig,
  triggerBackup, getBackupHistory, getBackupConfig, saveBackupConfig,
  downloadBackup, restoreBackup,
} from "../../services/settingsService";

const ac      = "#7c3aed";
const acLight = "rgba(124,58,237,.08)";
const acBorder= "rgba(124,58,237,.22)";
const acGlow  = "rgba(124,58,237,.18)";

/* ── Tiny UI helpers ──────────────────────────────────────────── */
function Icon({ d, size = 18, color = ac }) {
  const confirmRestore=async()=>{
    setRestoring(true); setRestoreError(null);
    try{
      // original restore logic continues here
      setRestoreModal(false);
    }catch(e){ setRestoreError(e?.response?.data?.message||"Restore failed."); }
    finally{ setRestoring(false); }
  };

  return (

    <svg width={size} height={size} fill="none" viewBox="0 0 24 24"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:28, right:28, zIndex:9999,
      padding:"13px 22px", borderRadius:"14px",
      background: ok ? "rgba(5,150,105,.96)" : "rgba(239,68,68,.94)",
      color:"#fff", fontSize:"13.5px", fontWeight:600,
      boxShadow:"0 8px 32px rgba(0,0,0,.18)",
      display:"flex", alignItems:"center", gap:"9px",
      animation:"slideUp .3s ease",
    }}>
      <Icon d={ok ? "M4.5 12.75l6 6 9-13.5" : "M6 18L18 6M6 6l12 12"} size={16} color="#fff" />
      {msg}
    </div>
  );
}

function SectionCard({ title, icon, badge, children }) {
  return (
    <div style={{ background:"#fff", borderRadius:"22px", border:"1px solid rgba(26,26,46,.08)", boxShadow:"0 2px 20px rgba(26,26,46,.05)", overflow:"hidden", marginBottom:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"18px 24px", borderBottom:"1px solid rgba(26,26,46,.06)", background:"rgba(26,26,46,.01)" }}>
        <div style={{ width:38, height:38, borderRadius:"11px", background:acLight, border:`1px solid ${acBorder}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 2px 10px ${acGlow}` }}>
          <Icon d={icon} size={17} />
        </div>
        <div>
          <div style={{ fontFamily:"'Poppins',sans-serif", fontSize:"15.5px", fontWeight:800, color:"#1a1a2e" }}>{title}</div>
          {badge && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9px", color:ac, letterSpacing:".14em", textTransform:"uppercase", marginTop:2 }}>{badge}</div>}
        </div>
      </div>
      <div style={{ padding:"24px" }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  width:"100%", padding:"10px 14px", borderRadius:"11px",
  border:"1px solid rgba(26,26,46,.14)", background:"rgba(26,26,46,.02)",
  fontSize:"13.5px", color:"#1a1a2e", outline:"none",
  fontFamily:"'Poppins',sans-serif", boxSizing:"border-box", transition:"all .18s",
};

function Input({ value, onChange, placeholder, type="text", prefix, suffix, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      {prefix && <span style={{ position:"absolute", left:13, color:"rgba(26,26,46,.4)", fontSize:"13px", fontFamily:"'DM Mono',monospace", pointerEvents:"none" }}>{prefix}</span>}
      <input type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...inputStyle, paddingLeft:prefix ? 30 : 14, paddingRight:suffix ? 44 : 14,
          border: focused ? `1px solid ${ac}` : "1px solid rgba(26,26,46,.14)",
          boxShadow: focused ? `0 0 0 3px ${acLight}` : "none",
          opacity: disabled ? .55 : 1, cursor: disabled ? "not-allowed" : "text" }} />
      {suffix && <span style={{ position:"absolute", right:13, color:"rgba(26,26,46,.35)", fontSize:"11.5px", fontFamily:"'DM Mono',monospace", pointerEvents:"none" }}>{suffix}</span>}
    </div>
  );
}

function Select({ value, onChange, children, disabled }) {
  return (
    <select value={value ?? ""} onChange={onChange} disabled={disabled} style={{
      ...inputStyle, cursor: disabled ? "not-allowed" : "pointer",
      appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%231a1a2e' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center", paddingRight:38,
      opacity: disabled ? .55 : 1,
    }}>{children}</select>
  );
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1 }}
      onClick={() => !disabled && onChange(!checked)}>
      <div style={{ width:42, height:24, borderRadius:99, position:"relative", background: checked ? ac : "rgba(26,26,46,.15)", transition:"background .2s", flexShrink:0, boxShadow: checked ? `0 2px 8px ${acGlow}` : "none" }}>
        <div style={{ position:"absolute", top:3, left: checked ? 21 : 3, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s" }} />
      </div>
      <span style={{ fontSize:13.5, color:"rgba(26,26,46,.65)", fontWeight:500 }}>{label}</span>
    </div>
  );
}

function Row({ children, cols=2 }) {
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:20 }}>{children}</div>;
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      {label && <label style={{ display:"block", fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(26,26,46,.45)", letterSpacing:".14em", textTransform:"uppercase", marginBottom:7, fontWeight:500 }}>
        {label}{required && <span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
      </label>}
      {children}
    </div>
  );
}

function SaveBtn({ onClick, saving }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:"11px",
      background:`linear-gradient(135deg,${ac},#6d28d9)`, color:"#fff",
      fontSize:"13.5px", fontWeight:700, border:"none", cursor: saving ? "not-allowed" : "pointer",
      boxShadow:`0 4px 16px ${acGlow}`, transition:"all .18s", opacity: saving ? .7 : 1,
    }}
      onMouseEnter={e => { if(!saving) e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="none"; }}>
      {saving
        ? <><span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", display:"inline-block", animation:"spin .7s linear infinite" }} />Saving…</>
        : <><Icon d="M4.5 12.75l6 6 9-13.5" size={15} color="#fff" />Save Changes</>}
    </button>
  );
}

function TaxRow({ tax, onChange, onRemove, index }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 110px 40px", gap:12, alignItems:"center", padding:"12px 16px", borderRadius:12, background:"rgba(26,26,46,.02)", border:"1px solid rgba(26,26,46,.07)", marginBottom:10 }}>
      <input value={tax.name ?? ""} onChange={e => onChange(index,"name",e.target.value)} placeholder="e.g. GST, CGST" style={{ ...inputStyle, padding:"8px 12px" }} />
      <input value={tax.rate ?? ""} onChange={e => onChange(index,"rate",e.target.value)} placeholder="0.00" type="number" min="0" max="100" style={{ ...inputStyle, padding:"8px 12px" }} />
      <Select value={tax.type} onChange={e => onChange(index,"type",e.target.value)}>
        <option value="percentage">Percentage</option>
        <option value="fixed">Fixed</option>
      </Select>
      <button onClick={() => onRemove(index)} style={{ width:36, height:36, borderRadius:9, border:"1px solid rgba(239,68,68,.25)", background:"rgba(239,68,68,.06)", cursor:"pointer", color:"#ef4444", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon d="M6 18L18 6M6 6l12 12" size={14} color="#ef4444" />
      </button>
    </div>
  );
}

/* ── Org Selector Banner (Super Admin only) ───────────────────── */
function OrgScopeBanner({ orgs, selectedOrgId, onSelect, selectedBranchId, onSelectBranch, branches, isSA }) {
  if (!isSA) return null;
  return (
    <div style={{ marginBottom:24, padding:"18px 22px", borderRadius:18, background:`linear-gradient(135deg,${acLight},rgba(109,40,217,.04))`, border:`1px solid ${acBorder}` }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"9.5px", color:ac, letterSpacing:".16em", textTransform:"uppercase", marginBottom:12 }}>
        ⚙ Applying Settings For
      </div>
      <Row cols={2}>
        <Field label="Organization">
          <Select value={selectedOrgId || ""} onChange={e => onSelect(e.target.value || null)}>
            <option value="">— Global Default —</option>
            {orgs.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select>
        </Field>
        <Field label="Branch Override (optional)">
          <Select value={selectedBranchId || ""} onChange={e => onSelectBranch(e.target.value || null)} disabled={!selectedOrgId}>
            <option value="">— Org-Level Config —</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.branchName} · {b.city || ""}</option>)}
          </Select>
        </Field>
      </Row>
      <div style={{ marginTop:8, fontSize:12, color:"rgba(26,26,46,.4)", fontFamily:"'DM Mono',monospace" }}>
        {!selectedOrgId
          ? "Editing global defaults — used as fallback when no org-specific config exists."
          : selectedBranchId
            ? "Editing branch-level override — highest priority for invoice generation."
            : "Editing org-level config — inherited by all branches of this organization."}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function SystemSettings() {
  const { user } = useAuth();
  const isSA = user?.role === "SUPER_ADMIN";

  const [toast,        setToast]        = useState({ msg:"", ok:true });
  const showToast = (msg, ok=true) => { setToast({ msg, ok }); setTimeout(() => setToast({ msg:"", ok:true }), 3500); };

  /* ── Org / Branch selector state (SA only) ─────────────────── */
  const [orgs,            setOrgs]           = useState([]);
  const [selectedOrgId,   setSelectedOrgId]  = useState(null);
  const [branches,        setBranches]       = useState([]);
  const [selectedBranch,  setSelectedBranch] = useState(null);

  // Load org list for SA
  useEffect(() => {
    if (!isSA) return;
    axiosInstance.get("/organizations")
      .then(r => setOrgs(r.data || []))
      .catch(() => {});
  }, [isSA]);

  // Load branches when org changes
  useEffect(() => {
    if (!isSA || !selectedOrgId) { setBranches([]); setSelectedBranch(null); return; }
    axiosInstance.get("/branches", { params: { organization: selectedOrgId } })
      .then(r => setBranches(Array.isArray(r.data) ? r.data : r.data?.branches || []))
      .catch(() => {});
    setSelectedBranch(null);
  }, [isSA, selectedOrgId]);

  /* ── Tax state ─────────────────────────────────────────────── */
  const [taxConfig,    setTaxConfig]   = useState({ taxEnabled:true, taxInclusivePricing:false, taxRegNo:"", taxRates:[], showTaxBreakdown:true, hsnCode:"" });
  const [savingTax,    setSavingTax]   = useState(false);

  /* ── Invoice state ─────────────────────────────────────────── */
  const [invoiceConfig, setInvoiceConfig] = useState({ prefix:"INV", suffix:"", startNumber:1001, padding:4, terms:"", footerNote:"Thank you for your business!", showLogo:true, showSignature:false, showQR:true, template:"modern", paperSize:"A4", dueDays:30 });
  const [savingInvoice, setSavingInvoice] = useState(false);

  /* ── Currency state ────────────────────────────────────────── */
  const [currencyConfig, setCurrencyConfig] = useState({ currencyCode:"INR", symbol:"₹", symbolPosition:"before", decimalPlaces:2, thousandsSeparator:",", decimalSeparator:".", showCurrencyCode:false, roundingMethod:"round" });
  const [savingCurrency, setSavingCurrency] = useState(false);

  /* ── Backup state ──────────────────────────────────────────── */
  const [backup,          setBackup]          = useState({ autoEnabled:true, frequency:"daily", backupTime:"02:00", retentionDays:30, storageLocation:"local" });
  const [backupHistoryData, setBackupHistoryData] = useState([]);
  const [backingUp,       setBackingUp]       = useState(false);
  const [restoring,       setRestoring]       = useState(false);
  const [savingBackup,    setSavingBackup]    = useState(false);

  /* ── Currencies list ───────────────────────────────────────── */
  const currencies = [
    { code:"INR", symbol:"₹",   name:"Indian Rupee" },
    { code:"USD", symbol:"$",   name:"US Dollar" },
    { code:"EUR", symbol:"€",   name:"Euro" },
    { code:"GBP", symbol:"£",   name:"British Pound" },
    { code:"AED", symbol:"د.إ", name:"UAE Dirham" },
    { code:"SGD", symbol:"S$",  name:"Singapore Dollar" },
    { code:"JPY", symbol:"¥",   name:"Japanese Yen" },
    { code:"CAD", symbol:"CA$", name:"Canadian Dollar" },
    { code:"AUD", symbol:"A$",  name:"Australian Dollar" },
  ];

  /* ── Load settings whenever scope changes ──────────────────── */
  const loadSettings = useCallback(() => {
    const orgId    = isSA ? selectedOrgId : null;
    const branchId = isSA ? selectedBranch : null;

    getTaxConfig(orgId, branchId).then(r => setTaxConfig(r.data)).catch(() => {});
    getInvoiceConfig(orgId).then(r => setInvoiceConfig(r.data)).catch(() => {});
    getCurrencyConfig().then(r => setCurrencyConfig(r.data)).catch(() => {});
    getBackupConfig().then(r => setBackup(r.data)).catch(() => {});
    getBackupHistory().then(r => setBackupHistoryData(r.data)).catch(() => {});
  }, [isSA, selectedOrgId, selectedBranch]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  /* ── Tax handlers ──────────────────────────────────────────── */
  const handleTaxRateChange = (i, field, val) => {
    const updated = [...(taxConfig.taxRates || [])];
    updated[i] = { ...updated[i], [field]: val };
    setTaxConfig(p => ({ ...p, taxRates: updated }));
  };
  const addTaxRate    = () => setTaxConfig(p => ({ ...p, taxRates: [...(p.taxRates||[]), { name:"", rate:"", type:"percentage" }] }));
  const removeTaxRate = i  => setTaxConfig(p => ({ ...p, taxRates: p.taxRates.filter((_,idx) => idx!==i) }));

  const saveTax = async () => {
    setSavingTax(true);
    try {
      const r = await saveTaxConfig(taxConfig, isSA ? selectedOrgId : null, isSA ? selectedBranch : null);
      setTaxConfig(r.data.config);
      showToast("GST / Tax configuration saved!");
    } catch (e) { showToast(e.response?.data?.message || "Save failed", false); }
    finally { setSavingTax(false); }
  };

  /* ── Invoice handlers ──────────────────────────────────────── */
  const saveInvoice = async () => {
    setSavingInvoice(true);
    try {
      const r = await saveInvoiceConfig(invoiceConfig, isSA ? selectedOrgId : null);
      setInvoiceConfig(r.data.config);
      showToast("Invoice format saved!");
    } catch (e) { showToast(e.response?.data?.message || "Save failed", false); }
    finally { setSavingInvoice(false); }
  };

  /* ── Currency handlers ─────────────────────────────────────── */
  const handleCurrencyChange = (code) => {
    const found = currencies.find(c => c.code === code);
    if (found) setCurrencyConfig(p => ({ ...p, currencyCode: found.code, symbol: found.symbol }));
  };
  const saveCurrency = async () => {
    setSavingCurrency(true);
    try {
      const r = await saveCurrencyConfig(currencyConfig);
      setCurrencyConfig(r.data.config);
      showToast("Currency settings saved!");
    } catch (e) { showToast(e.response?.data?.message || "Save failed", false); }
    finally { setSavingCurrency(false); }
  };

  /* ── Backup handlers ───────────────────────────────────────── */
  const doBackup = async () => {
    setBackingUp(true);
    try {
      await triggerBackup();
      const h = await getBackupHistory();
      setBackupHistoryData(h.data);
      showToast("Database backup created successfully!");
    } catch (e) { showToast(e.response?.data?.message || "Backup failed", false); }
    finally { setBackingUp(false); }
  };

  const doRestore = async () => {
    setRestoreError(null); setRestoreModal(true); return;
    const input = document.createElement("input");
    input.type="file"; input.accept=".gz,.zip,.sql";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if(!file) return;
      setRestoring(true);
      try { await restoreBackup(file); showToast("Database restored successfully!"); }
      catch(err) { showToast(err.response?.data?.message || "Restore failed", false); }
      finally { setRestoring(false); }
    };
    input.click();
  };

  const saveBackupSettings = async () => {
    setSavingBackup(true);
    try {
      const r = await saveBackupConfig(backup);
      setBackup(r.data.config);
      showToast("Backup settings saved!");
    } catch (e) { showToast(e.response?.data?.message || "Save failed", false); }
    finally { setSavingBackup(false); }
  };

  /* ── Tabs ──────────────────────────────────────────────────── */
  const tabs = [
    { id:"tax",      label:"GST / Tax",        icon:"M9 14.25l6-6m4.5-3.493V21.75l-4.5-4.5-4.5 4.5-4.5-4.5-4.5 4.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" },
    { id:"invoice",  label:"Invoice Format",   icon:"M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
    { id:"currency", label:"Currency",         icon:"M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id:"backup",   label:"Backup & Restore", icon:"M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" },
  ];
  // Admin only sees Tax and Invoice tabs
  const visibleTabs = isSA ? tabs : tabs.filter(t => t.id !== "backup");
  const [activeTab, setActiveTab] = useState("tax");

  const selectedOrgName = orgs.find(o => o._id === selectedOrgId)?.name;

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes spin    { to   { transform:rotate(360deg); } }
        .stab { transition:all .18s; }
        .stab:hover { background:rgba(124,58,237,.06) !important; }
      `}</style>

      <div style={{ maxWidth:940, margin:"0 auto", padding:"28px 24px", animation:"fadeUp .4s ease" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:26 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${ac},#6d28d9)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${acGlow}` }}>
            <Icon d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin:0, fontFamily:"'Poppins',sans-serif", fontSize:26, fontWeight:900, color:"#1a1a2e", letterSpacing:"-.03em" }}>System Settings</h1>
            <p style={{ margin:0, fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(26,26,46,.38)", letterSpacing:".14em", textTransform:"uppercase", marginTop:3 }}>
              {isSA ? "Super Admin · Global Configuration" : `Admin · ${user?.name || ""}`}
            </p>
          </div>
        </div>

        {/* Org / Branch scope selector (SA only) */}
        <OrgScopeBanner
          isSA={isSA} orgs={orgs}
          selectedOrgId={selectedOrgId} onSelect={setSelectedOrgId}
          branches={branches} selectedBranchId={selectedBranch} onSelectBranch={setSelectedBranch}
        />

        {/* Scope context pill */}
        {(selectedOrgName || !isSA) && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 16px", borderRadius:99, background:acLight, border:`1px solid ${acBorder}`, marginBottom:20, fontSize:12.5, fontWeight:600, color:ac }}>
            <Icon d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" size={14} />
            {isSA
              ? selectedOrgName
                ? `${selectedOrgName}${selectedBranch ? ` · ${branches.find(b=>b._id===selectedBranch)?.branchName||""}` : " · Org Level"}`
                : "Global Default"
              : `${user?.name} · Branch Settings`}
          </div>
        )}

        {/* Tab Bar */}
        <div style={{ display:"flex", gap:6, padding:"6px", background:"rgba(26,26,46,.04)", borderRadius:16, border:"1px solid rgba(26,26,46,.08)", marginBottom:28, overflowX:"auto" }}>
          {visibleTabs.map(t => (
            <button key={t.id} className="stab" onClick={() => setActiveTab(t.id)} style={{
              display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:11, border:"none",
              cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
              fontFamily:"'Poppins',sans-serif", fontSize:13.5, fontWeight:600,
              background: activeTab===t.id ? "#fff" : "transparent",
              color: activeTab===t.id ? ac : "rgba(26,26,46,.45)",
              boxShadow: activeTab===t.id ? "0 2px 12px rgba(26,26,46,.08)" : "none",
            }}>
              <Icon d={t.icon} size={15} color={activeTab===t.id ? ac : "rgba(26,26,46,.35)"} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════ TAX TAB ══════════ */}
        {activeTab === "tax" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <SectionCard title="GST / Tax Configuration" icon="M9 14.25l6-6m4.5-3.493V21.75l-4.5-4.5-4.5 4.5-4.5-4.5-4.5 4.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" badge="Tax & Compliance">

              {/* Inherited config notice for branch view */}
              {isSA && selectedBranch && (
                <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(234,179,8,.07)", border:"1px solid rgba(234,179,8,.25)", marginBottom:20, fontSize:13, color:"#92400e", display:"flex", gap:10, alignItems:"center" }}>
                  <Icon d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" size={16} color="#92400e" />
                  Branch override — if you leave this empty, this branch will inherit the org-level config.
                </div>
              )}

              <Row>
                <Field label="GST Registration Number (GSTIN)">
                  <Input value={taxConfig.taxRegNo} onChange={e => setTaxConfig(p => ({...p, taxRegNo:e.target.value}))} placeholder="e.g. 27AABCU9603R1ZX" />
                </Field>
                <Field label="HSN / SAC Code (Default)">
                  <Input value={taxConfig.hsnCode} onChange={e => setTaxConfig(p => ({...p, hsnCode:e.target.value}))} placeholder="e.g. 6204" />
                </Field>
              </Row>

              <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"16px 20px", background:"rgba(26,26,46,.02)", borderRadius:14, border:"1px solid rgba(26,26,46,.07)", marginBottom:20 }}>
                <Toggle checked={taxConfig.taxEnabled}          onChange={v => setTaxConfig(p=>({...p,taxEnabled:v}))}          label="Enable Tax on Invoices" />
                <Toggle checked={taxConfig.taxInclusivePricing} onChange={v => setTaxConfig(p=>({...p,taxInclusivePricing:v}))} label="Tax-Inclusive Pricing (prices already include tax)" />
                <Toggle checked={taxConfig.showTaxBreakdown}    onChange={v => setTaxConfig(p=>({...p,showTaxBreakdown:v}))}    label="Show Tax Breakdown on Invoice" />
              </div>

              {/* Tax Rates Table */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <label style={{ fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(26,26,46,.45)", letterSpacing:".14em", textTransform:"uppercase" }}>Tax Rates</label>
                  <button onClick={addTaxRate} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, border:`1px solid ${acBorder}`, background:acLight, color:ac, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>
                    <Icon d="M12 4.5v15m7.5-7.5h-15" size={13} /> Add Rate
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 110px 40px", gap:12, padding:"6px 16px 10px", marginBottom:4 }}>
                  {["Name","Rate (%)","Type",""].map((h,i) => <span key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"rgba(26,26,46,.35)", letterSpacing:".14em", textTransform:"uppercase" }}>{h}</span>)}
                </div>
                {(taxConfig.taxRates || []).map((t, i) => (
                  <TaxRow key={i} tax={t} index={i} onChange={handleTaxRateChange} onRemove={removeTaxRate} />
                ))}
                {(taxConfig.taxRates || []).length === 0 && (
                  <div style={{ textAlign:"center", padding:"20px", color:"rgba(26,26,46,.35)", fontSize:13, fontStyle:"italic" }}>No tax rates configured. Click "Add Rate" to get started.</div>
                )}
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <SaveBtn onClick={saveTax} saving={savingTax} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════ INVOICE TAB ══════════ */}
        {activeTab === "invoice" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <SectionCard title="Invoice Format Setup" icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" badge="Invoice & Billing">

              {/* Branch-scoped invoices use org config — show info */}
              {isSA && selectedBranch && (
                <div style={{ padding:"12px 16px", borderRadius:12, background:"rgba(14,165,233,.07)", border:"1px solid rgba(14,165,233,.2)", marginBottom:20, fontSize:13, color:"#0369a1", display:"flex", gap:10, alignItems:"center" }}>
                  <Icon d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" size={16} color="#0369a1" />
                  Invoice format is set at the organization level. Branches inherit their org's invoice config.
                </div>
              )}

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontFamily:"'DM Mono',monospace", fontSize:"10px", color:"rgba(26,26,46,.45)", letterSpacing:".14em", textTransform:"uppercase", marginBottom:7 }}>Invoice Number Format</label>
                <Row cols={3}>
                  <Field label="Prefix">
                    <Input value={invoiceConfig.prefix} onChange={e => setInvoiceConfig(p=>({...p,prefix:e.target.value}))} placeholder="INV" />
                  </Field>
                  <Field label="Start Number">
                    <Input value={invoiceConfig.startNumber} onChange={e => setInvoiceConfig(p=>({...p,startNumber:e.target.value}))} placeholder="1001" type="number" />
                  </Field>
                  <Field label="Suffix (optional)">
                    <Input value={invoiceConfig.suffix} onChange={e => setInvoiceConfig(p=>({...p,suffix:e.target.value}))} placeholder="e.g. -2026" />
                  </Field>
                </Row>
                {/* Preview */}
                <div style={{ marginTop:8, padding:"10px 16px", borderRadius:10, background:acLight, border:`1px solid ${acBorder}`, display:"flex", alignItems:"center", gap:10 }}>
                  <Icon d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" size={15} />
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11.5, color:ac, letterSpacing:".08em" }}>
                    Preview: {invoiceConfig.prefix}{String(invoiceConfig.startNumber||1001).padStart(invoiceConfig.padding||4,"0")}{invoiceConfig.suffix}
                  </span>
                  {invoiceConfig.currentNumber && (
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"rgba(26,26,46,.35)", marginLeft:"auto" }}>
                      Next: #{invoiceConfig.currentNumber}
                    </span>
                  )}
                </div>
              </div>

              <Row>
                <Field label="Invoice Template">
                  <Select value={invoiceConfig.template} onChange={e => setInvoiceConfig(p=>({...p,template:e.target.value}))}>
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                    <option value="detailed">Detailed</option>
                  </Select>
                </Field>
                <Field label="Paper Size">
                  <Select value={invoiceConfig.paperSize} onChange={e => setInvoiceConfig(p=>({...p,paperSize:e.target.value}))}>
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="A5">A5</option>
                    <option value="Legal">Legal</option>
                  </Select>
                </Field>
              </Row>

              <Row>
                <Field label="Payment Due (Days)">
                  <Input value={invoiceConfig.dueDays} onChange={e => setInvoiceConfig(p=>({...p,dueDays:e.target.value}))} type="number" suffix="days" />
                </Field>
                <Field label="Number Padding">
                  <Select value={invoiceConfig.padding} onChange={e => setInvoiceConfig(p=>({...p,padding:e.target.value}))}>
                    {["3","4","5","6"].map(v => <option key={v} value={v}>{v} digits</option>)}
                  </Select>
                </Field>
              </Row>

              <Field label="Terms & Conditions">
                <textarea value={invoiceConfig.terms ?? ""} onChange={e => setInvoiceConfig(p=>({...p,terms:e.target.value}))} rows={4} style={{ ...inputStyle, resize:"vertical", padding:"12px 14px", lineHeight:1.6 }} placeholder="Enter terms and conditions…" />
              </Field>

              <Field label="Invoice Footer Note">
                <Input value={invoiceConfig.footerNote} onChange={e => setInvoiceConfig(p=>({...p,footerNote:e.target.value}))} placeholder="Thank you for your business!" />
              </Field>

              <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"16px 20px", background:"rgba(26,26,46,.02)", borderRadius:14, border:"1px solid rgba(26,26,46,.07)", marginBottom:24 }}>
                <Toggle checked={invoiceConfig.showLogo}      onChange={v => setInvoiceConfig(p=>({...p,showLogo:v}))}      label="Show Company Logo on Invoice" />
                <Toggle checked={invoiceConfig.showSignature} onChange={v => setInvoiceConfig(p=>({...p,showSignature:v}))} label="Show Authorized Signature Section" />
                <Toggle checked={invoiceConfig.showQR}        onChange={v => setInvoiceConfig(p=>({...p,showQR:v}))}        label="Show QR Code for Digital Payment" />
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <SaveBtn onClick={saveInvoice} saving={savingInvoice} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════ CURRENCY TAB ══════════ */}
        {activeTab === "currency" && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <SectionCard title="Currency Settings" icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" badge="Global · All Organizations">

              <div style={{ padding:"10px 16px", borderRadius:12, background:"rgba(14,165,233,.07)", border:"1px solid rgba(14,165,233,.2)", marginBottom:20, fontSize:13, color:"#0369a1", display:"flex", gap:10, alignItems:"center" }}>
                <Icon d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" size={16} color="#0369a1" />
                Currency is a global setting — applies to all organizations and branches.
              </div>

              <Field label="Select Currency" required>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:4 }}>
                  {currencies.map(c => (
                    <div key={c.code} onClick={() => handleCurrencyChange(c.code)} style={{ padding:"12px 16px", borderRadius:13, cursor:"pointer", border:`1px solid ${currencyConfig.currencyCode===c.code ? ac : "rgba(26,26,46,.1)"}`, background: currencyConfig.currencyCode===c.code ? acLight : "rgba(26,26,46,.01)", transition:"all .17s", display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background: currencyConfig.currencyCode===c.code ? `linear-gradient(135deg,${ac},#6d28d9)` : "rgba(26,26,46,.06)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, color: currencyConfig.currencyCode===c.code ? "#fff" : "rgba(26,26,46,.5)", flexShrink:0 }}>{c.symbol}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: currencyConfig.currencyCode===c.code ? ac : "#1a1a2e" }}>{c.code}</div>
                        <div style={{ fontSize:10.5, color:"rgba(26,26,46,.4)", fontFamily:"'DM Mono',monospace" }}>{c.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Field>

              <Row>
                <Field label="Symbol Position">
                  <Select value={currencyConfig.symbolPosition} onChange={e => setCurrencyConfig(p=>({...p,symbolPosition:e.target.value}))}>
                    <option value="before">Before amount (₹1,000)</option>
                    <option value="after">After amount (1,000 ₹)</option>
                  </Select>
                </Field>
                <Field label="Decimal Places">
                  <Select value={currencyConfig.decimalPlaces} onChange={e => setCurrencyConfig(p=>({...p,decimalPlaces:e.target.value}))}>
                    <option value="0">0 (₹1,000)</option>
                    <option value="2">2 (₹1,000.00)</option>
                    <option value="3">3 (₹1,000.000)</option>
                  </Select>
                </Field>
              </Row>

              <Row>
                <Field label="Thousands Separator">
                  <Select value={currencyConfig.thousandsSeparator} onChange={e => setCurrencyConfig(p=>({...p,thousandsSeparator:e.target.value}))}>
                    <option value=",">, (comma)</option>
                    <option value=".">. (period)</option>
                    <option value=" ">  (space)</option>
                    <option value="">None</option>
                  </Select>
                </Field>
                <Field label="Rounding Method">
                  <Select value={currencyConfig.roundingMethod} onChange={e => setCurrencyConfig(p=>({...p,roundingMethod:e.target.value}))}>
                    <option value="round">Standard (round half up)</option>
                    <option value="floor">Floor (round down)</option>
                    <option value="ceil">Ceiling (round up)</option>
                  </Select>
                </Field>
              </Row>

              <Toggle checked={currencyConfig.showCurrencyCode} onChange={v => setCurrencyConfig(p=>({...p,showCurrencyCode:v}))} label="Show currency code alongside symbol (e.g. ₹ INR)" />

              <div style={{ margin:"22px 0 24px", padding:"18px 22px", borderRadius:16, background:`linear-gradient(135deg,${acLight},rgba(109,40,217,.05))`, border:`1px solid ${acBorder}` }}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9.5, color:ac, letterSpacing:".14em", textTransform:"uppercase", marginBottom:10 }}>Live Preview</div>
                <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                  {[1234.56, 99999, 0.5, -450].map((n,i) => {
                    const sym = currencyConfig.symbol;
                    const pos = currencyConfig.symbolPosition;
                    const dp  = parseInt(currencyConfig.decimalPlaces)||2;
                    const fmt = n.toLocaleString("en-IN",{minimumFractionDigits:dp,maximumFractionDigits:dp});
                    const disp= pos==="before" ? `${sym}${fmt}` : `${fmt} ${sym}`;
                    return (
                      <div key={i}>
                        <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Poppins',sans-serif", color: n<0 ? "#ef4444" : "#1a1a2e", letterSpacing:"-.03em" }}>{disp}</div>
                        <div style={{ fontSize:10, color:"rgba(26,26,46,.35)", fontFamily:"'DM Mono',monospace", marginTop:3 }}>{n.toString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <SaveBtn onClick={saveCurrency} saving={savingCurrency} />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════ BACKUP TAB (SA only) ══════════ */}
        {activeTab === "backup" && isSA && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:24 }}>
              {/* Backup Now */}
              <div style={{ padding:"24px", borderRadius:20, background:`linear-gradient(135deg,${acLight},rgba(109,40,217,.05))`, border:`1px solid ${acBorder}`, textAlign:"center" }}>
                <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${ac},#6d28d9)`, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 6px 20px ${acGlow}` }}>
                  <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" size={22} color="#fff" />
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1a1a2e", marginBottom:6 }}>Backup Now</div>
                <div style={{ fontSize:12, color:"rgba(26,26,46,.45)", marginBottom:16 }}>Create an immediate snapshot of all data</div>
                <button onClick={doBackup} disabled={backingUp} style={{ padding:"11px 24px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${ac},#6d28d9)`, color:"#fff", fontSize:13.5, fontWeight:700, cursor: backingUp ? "not-allowed" : "pointer", boxShadow:`0 4px 16px ${acGlow}`, opacity: backingUp ? .7 : 1, display:"flex", alignItems:"center", gap:8, margin:"0 auto" }}>
                  {backingUp ? <><span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", display:"inline-block", animation:"spin .7s linear infinite" }} />Backing Up…</> : <><Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" size={15} color="#fff" />Create Backup</>}
                </button>
              </div>
              {/* Restore */}
              <div style={{ padding:"24px", borderRadius:20, background:"rgba(239,68,68,.04)", border:"1px solid rgba(239,68,68,.18)", textAlign:"center" }}>
                <div style={{ width:52, height:52, borderRadius:16, background:"linear-gradient(135deg,#ef4444,#dc2626)", margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 20px rgba(239,68,68,.25)" }}>
                  <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" size={22} color="#fff" />
                </div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1a1a2e", marginBottom:6 }}>Restore Database</div>
                <div style={{ fontSize:12, color:"rgba(26,26,46,.45)", marginBottom:16 }}>Restore from a previous backup file</div>
                <button onClick={doRestore} disabled={restoring} style={{ padding:"11px 24px", borderRadius:11, border:"none", background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:13.5, fontWeight:700, cursor: restoring ? "not-allowed" : "pointer", boxShadow:"0 4px 16px rgba(239,68,68,.25)", opacity: restoring ? .7 : 1, display:"flex", alignItems:"center", gap:8, margin:"0 auto" }}>
                  {restoring ? <><span style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", display:"inline-block", animation:"spin .7s linear infinite" }} />Restoring…</> : <><Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" size={15} color="#fff" />Restore Backup</>}
                </button>
              </div>
            </div>

            <SectionCard title="Auto Backup Settings" icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" badge="Scheduled Backups">
              <Toggle checked={backup.autoEnabled} onChange={v => setBackup(p=>({...p,autoEnabled:v}))} label="Enable Automatic Scheduled Backups" />
              <div style={{ marginTop:20, opacity: backup.autoEnabled ? 1 : .45, pointerEvents: backup.autoEnabled ? "auto" : "none", transition:"opacity .2s" }}>
                <Row>
                  <Field label="Backup Frequency">
                    <Select value={backup.frequency} onChange={e => setBackup(p=>({...p,frequency:e.target.value}))}>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </Field>
                  <Field label="Backup Time">
                    <Input type="time" value={backup.backupTime} onChange={e => setBackup(p=>({...p,backupTime:e.target.value}))} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Retention Period">
                    <Input value={backup.retentionDays||""} onChange={e => setBackup(p=>({...p,retentionDays:e.target.value}))} type="number" suffix="days" />
                  </Field>
                  <Field label="Storage Location">
                    <Select value={backup.storageLocation} onChange={e => setBackup(p=>({...p,storageLocation:e.target.value}))}>
                      <option value="local">Local Server</option>
                      <option value="s3">Amazon S3</option>
                      <option value="gcs">Google Cloud Storage</option>
                      <option value="azure">Azure Blob Storage</option>
                    </Select>
                  </Field>
                </Row>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                <SaveBtn onClick={saveBackupSettings} saving={savingBackup} />
              </div>
            </SectionCard>

            <SectionCard title="Backup History" icon="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" badge="Recent Backups">
              <div style={{ borderRadius:14, border:"1px solid rgba(26,26,46,.08)", overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"rgba(26,26,46,.03)" }}>
                      {["Date & Time","Type","Size","Status","Action"].map(h => (
                        <th key={h} style={{ padding:"11px 16px", fontFamily:"'DM Mono',monospace", fontSize:9.5, color:"rgba(26,26,46,.35)", letterSpacing:".14em", textTransform:"uppercase", textAlign:"left", borderBottom:"1px solid rgba(26,26,46,.07)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backupHistoryData.length === 0
                      ? <tr><td colSpan={5} style={{ padding:"24px", textAlign:"center", color:"rgba(26,26,46,.35)", fontSize:13, fontStyle:"italic" }}>No backups yet.</td></tr>
                      : backupHistoryData.map((b, i) => (
                        <tr key={b.id||i} style={{ borderBottom: i < backupHistoryData.length-1 ? "1px solid rgba(26,26,46,.05)" : "none", transition:"background .15s" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(26,26,46,.02)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 16px", fontSize:13, color:"#1a1a2e", fontFamily:"'DM Mono',monospace" }}>{new Date(b.date||b.createdAt).toLocaleString()}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ fontSize:11.5, fontWeight:600, padding:"3px 10px", borderRadius:99, background: b.type==="auto" ? acLight : "rgba(5,150,105,.1)", color: b.type==="auto" ? ac : "#059669", fontFamily:"'DM Mono',monospace", textTransform:"capitalize" }}>{b.type}</span>
                          </td>
                          <td style={{ padding:"12px 16px", fontSize:13, color:"rgba(26,26,46,.6)" }}>{b.size}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ display:"flex", alignItems:"center", gap:6, width:"fit-content" }}>
                              <div style={{ width:7, height:7, borderRadius:"50%", background: b.status==="success" ? "#059669" : "#ef4444", boxShadow:`0 0 5px ${b.status==="success" ? "rgba(5,150,105,.4)" : "rgba(239,68,68,.4)"}` }} />
                              <span style={{ fontSize:12.5, fontWeight:600, color: b.status==="success" ? "#059669" : "#ef4444", textTransform:"capitalize" }}>{b.status}</span>
                            </span>
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            {b.status==="success" && (
                              <button style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:`1px solid ${acBorder}`, background:acLight, color:ac, fontSize:12, fontWeight:600, cursor:"pointer" }}
                                onClick={() => downloadBackup(b.id, b.filename).catch(() => showToast("Download failed", false))}>
                                <Icon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" size={12} />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        )}
      </div>

      <Toast msg={toast.msg} ok={toast.ok} />
    </>
  );
}
