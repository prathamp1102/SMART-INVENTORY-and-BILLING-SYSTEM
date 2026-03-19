import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import { IS, SS, FormError, FieldLabel, FormDivider } from "../../components/forms/FormStyles";
import { validateRequired, validatePhone, validateEmail } from "../../utils/validators";
import { getSupplierById, updateSupplier } from "../../services/productService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import useAuth from "../../hooks/useAuth";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

export default function EditSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSA = user?.role === "SUPER_ADMIN";

  const [form, setForm] = useState({
    supplierName: "", companyName: "", gstNumber: "",
    phoneNumber: "", email: "", address: "", city: "", state: "",
    bankName: "", accountNumber: "", ifscCode: "", bankBranchName: "",
    openingBalance: "", status: "ACTIVE",
    organization: "", branch: "",
  });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");

  const [orgs, setOrgs]         = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Load org/branch lists for Super Admin
  useEffect(() => {
    if (!isSA) return;
    setLoadingMeta(true);
    Promise.all([getOrganizations(), getBranches()])
      .then(([o, b]) => { setOrgs(o); setBranches(b); })
      .catch(console.error)
      .finally(() => setLoadingMeta(false));
  }, [isSA]);

  // Load supplier data
  useEffect(() => {
    getSupplierById(id)
      .then(d => {
        const branchObj = d.branch;
        const orgId = branchObj?.organization?._id
          || (typeof branchObj?.organization === "string" ? branchObj.organization : "")
          || "";
        const branchId = branchObj?._id || (typeof branchObj === "string" ? branchObj : "") || "";

        setForm({
          supplierName:   d.supplierName  || "",
          companyName:    d.companyName   || "",
          gstNumber:      d.gstNumber     || "",
          phoneNumber:    d.phoneNumber   || "",
          email:          d.email         || "",
          address:        d.address       || "",
          city:           d.city          || "",
          state:          d.state         || "",
          bankName:       d.bankDetails?.bankName      || "",
          accountNumber:  d.bankDetails?.accountNumber || "",
          ifscCode:       d.bankDetails?.ifscCode      || "",
          bankBranchName: d.bankDetails?.branchName    || "",
          openingBalance: d.openingBalance ?? "",
          status:         d.status        || "ACTIVE",
          organization:   orgId,
          branch:         branchId,
        });
      })
      .catch(() => setApiError("Failed to load supplier."))
      .finally(() => setLoading(false));
  }, [id]);

  const filteredBranches = useMemo(() => {
    if (!form.organization) return branches;
    return branches.filter(b =>
      String(b.organization?._id || b.organization) === form.organization
    );
  }, [branches, form.organization]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(p => {
      const next = { ...p, [k]: val };
      if (k === "organization") next.branch = "";
      return next;
    });
    setErrors(p => ({ ...p, [k]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {
      supplierName:  validateRequired(form.supplierName, "Supplier name"),
      phoneNumber:   validatePhone(form.phoneNumber),
      email:         form.email.trim() ? validateEmail(form.email) : "",
      gstNumber:     validateGST(form.gstNumber),
      ifscCode:      validateIFSC(form.ifscCode),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setApiError("");
    try {
      const payload = {
        supplierName:  form.supplierName.trim(),
        companyName:   form.companyName.trim()  || undefined,
        gstNumber:     form.gstNumber.trim()    || undefined,
        phoneNumber:   form.phoneNumber.trim(),
        email:         form.email.trim()         || undefined,
        address:       form.address.trim()       || undefined,
        city:          form.city.trim()          || undefined,
        state:         form.state                || undefined,
        openingBalance: form.openingBalance !== "" ? Number(form.openingBalance) : 0,
        status:        form.status,
        bankDetails: {
          bankName:      form.bankName.trim()         || undefined,
          accountNumber: form.accountNumber.trim()    || undefined,
          ifscCode:      form.ifscCode.trim()         || undefined,
          branchName:    form.bankBranchName.trim()   || undefined,
        },
      };
      if (isSA) payload.branch = form.branch || null;
      await updateSupplier(id, payload);
      navigate("/suppliers");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to update supplier.");
    } finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  const currentOrg    = orgs.find(o => o._id === form.organization);
  const currentBranch = branches.find(b => b._id === form.branch);

  return (
    <PageShell title="Edit Supplier" subtitle={"Editing: " + (form.companyName || form.supplierName)}>
      <Card style={{ maxWidth: "min(600px, 100%)" }}>
        <FormError message={apiError} />
        <form onSubmit={handleSubmit} noValidate>

          {/* Basic Info */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>Supplier Name *</FieldLabel>
              <input placeholder="e.g. Rajesh Kumar" value={form.supplierName} onChange={set("supplierName")}
                style={{ ...IS, borderColor: errors.supplierName ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.supplierName && <ErrMsg>{errors.supplierName}</ErrMsg>}
            </div>
            <div>
              <FieldLabel>Company Name</FieldLabel>
              <input placeholder="e.g. Tata Electronics Pvt. Ltd." value={form.companyName} onChange={set("companyName")} style={IS} />
            </div>
          </div>

          {/* Contact */}
          <FormDivider label="Contact Details" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>Phone Number *</FieldLabel>
              <input placeholder="10-digit mobile" value={form.phoneNumber} onChange={set("phoneNumber")}
                style={{ ...IS, borderColor: errors.phoneNumber ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.phoneNumber && <ErrMsg>{errors.phoneNumber}</ErrMsg>}
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <input placeholder="supplier@email.com" value={form.email} onChange={set("email")} type="email"
                style={{ ...IS, borderColor: errors.email ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.email && <ErrMsg>{errors.email}</ErrMsg>}
            </div>
          </div>

          {/* Address */}
          <FormDivider label="Address" />
          <FieldLabel>Street / Full Address</FieldLabel>
          <input placeholder="Building, Street, Area" value={form.address} onChange={set("address")} style={IS} />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>City</FieldLabel>
              <input placeholder="e.g. Mumbai" value={form.city} onChange={set("city")} style={IS} />
            </div>
            <div>
              <FieldLabel>State</FieldLabel>
              <select value={form.state} onChange={set("state")} style={{ ...IS, color: form.state ? undefined : "rgba(26,26,46,.4)" }}>
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Business Details */}
          <FormDivider label="Business Details" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>GST Number</FieldLabel>
              <input placeholder="e.g. 27AAPFU0939F1ZV" value={form.gstNumber} onChange={set("gstNumber")}
                style={{ ...IS, textTransform:"uppercase", borderColor: errors.gstNumber ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.gstNumber && <ErrMsg>{errors.gstNumber}</ErrMsg>}
            </div>
            <div>
              <FieldLabel>Opening Balance (₹)</FieldLabel>
              <input placeholder="0.00" type="number" min="0" value={form.openingBalance} onChange={set("openingBalance")} style={IS} />
            </div>
          </div>

          <div style={{ marginBottom:"18px" }}>
            <FieldLabel>Status</FieldLabel>
            <div style={{ display:"flex", gap:"14px" }}>
              {["ACTIVE","INACTIVE"].map(s => (
                <label key={s} style={{ display:"flex", alignItems:"center", gap:"6px", cursor:"pointer",
                  fontSize:"13px", fontWeight: form.status === s ? 600 : 400,
                  color: form.status === s ? "#b45309" : "rgba(26,26,46,.5)" }}>
                  <input type="radio" name="status" value={s} checked={form.status === s}
                    onChange={set("status")} style={{ accentColor:"#b45309" }} />
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <FormDivider label="Bank Details (Optional)" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>Bank Name</FieldLabel>
              <input placeholder="e.g. State Bank of India" value={form.bankName} onChange={set("bankName")} style={IS} />
            </div>
            <div>
              <FieldLabel>Account Number</FieldLabel>
              <input placeholder="e.g. 1234567890" value={form.accountNumber} onChange={set("accountNumber")} style={IS} />
            </div>
            <div>
              <FieldLabel>IFSC Code</FieldLabel>
              <input placeholder="e.g. SBIN0001234" value={form.ifscCode} onChange={set("ifscCode")}
                style={{ ...IS, textTransform:"uppercase", borderColor: errors.ifscCode ? "rgba(239,68,68,.5)" : undefined }} />
              {errors.ifscCode && <ErrMsg>{errors.ifscCode}</ErrMsg>}
            </div>
            <div>
              <FieldLabel>Bank Branch Name</FieldLabel>
              <input placeholder="e.g. Andheri West" value={form.bankBranchName} onChange={set("bankBranchName")} style={IS} />
            </div>
          </div>

          {/* ── Super Admin: Org + Branch ── */}
          {isSA && (
            <>
              <FormDivider label="Organization & Branch Assignment" />

              {/* Current assignment badges */}
              {(currentOrg || currentBranch) && !loadingMeta && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
                  {currentOrg && (
                    <div style={{ padding:"5px 12px", borderRadius:"99px", background:"rgba(124,58,237,.07)", border:"1px solid rgba(124,58,237,.18)", fontSize:"11.5px", color:"#7c3aed", fontWeight:700, display:"flex", alignItems:"center", gap:"5px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5"/></svg>
                      {currentOrg.name}
                    </div>
                  )}
                  {currentBranch && (
                    <div style={{ padding:"5px 12px", borderRadius:"99px", background:"rgba(2,132,199,.07)", border:"1px solid rgba(2,132,199,.18)", fontSize:"11.5px", color:"#0284c7", fontWeight:700, display:"flex", alignItems:"center", gap:"5px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
                      {currentBranch.branchName}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
                <div>
                  <FieldLabel>Organization</FieldLabel>
                  <select value={form.organization} onChange={set("organization")} style={SS} disabled={loadingMeta}>
                    <option value="">— Global / No Organization —</option>
                    {orgs.map(o => (
                      <option key={o._id} value={o._id}>{o.name}{o.city ? ` (${o.city})` : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Branch</FieldLabel>
                  <select
                    value={form.branch}
                    onChange={set("branch")}
                    style={{ ...SS, opacity: !form.organization ? 0.5 : 1 }}
                    disabled={!form.organization || loadingMeta}
                  >
                    <option value="">— No Specific Branch —</option>
                    {filteredBranches.map(b => (
                      <option key={b._id} value={b._id}>{b.branchName}{b.city ? ` — ${b.city}` : ""}</option>
                    ))}
                  </select>
                  {form.organization && filteredBranches.length === 0 && !loadingMeta && (
                    <div style={{ fontSize:"11px", color:"#b45309", fontFamily:"'DM Mono',monospace", marginTop:"4px" }}>
                      No branches for this organization
                    </div>
                  )}
                </div>
              </div>

              {/* Clear assignment */}
              {(form.organization || form.branch) && (
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, organization: "", branch: "" }))}
                  style={{ fontSize:"11.5px", color:"#dc2626", background:"none", border:"none", cursor:"pointer", padding:"6px 0 12px", textDecoration:"underline", fontFamily:"'DM Mono',monospace", letterSpacing:".05em" }}
                >
                  ✕ Clear assignment (make global)
                </button>
              )}
            </>
          )}

          <div style={{ display:"flex", gap:"10px", marginTop:"6px" }}>
            <Button type="submit" loading={saving} accent="#b45309" glow="rgba(180,83,9,.25)">Save Changes</Button>
            <Button variant="secondary" onClick={() => navigate("/suppliers")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}

function ErrMsg({ children }) {
  return <div style={{ color:"#dc2626", fontSize:"11px", fontFamily:"'DM Mono',monospace", marginTop:"-8px", marginBottom:"10px" }}>{children}</div>;
}
