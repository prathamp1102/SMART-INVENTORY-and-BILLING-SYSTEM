import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import { IS, SS, FormError, FieldLabel, FormDivider } from "../../components/forms/FormStyles";
import { validateRequired } from "../../utils/validators";
import { getCategoryById, updateCategory } from "../../services/productService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import useAuth from "../../hooks/useAuth";

export default function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSA = user?.role === "SUPER_ADMIN";

  const [form, setForm]       = useState({ name: "", description: "", isActive: true, organization: "", branch: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");

  // Super Admin dropdowns
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

  // Load category
  useEffect(() => {
    getCategoryById(id)
      .then(data => {
        // Resolve org from branch if needed
        const branchObj = data.branch;
        const orgId = branchObj?.organization?._id
          || (typeof branchObj?.organization === "string" ? branchObj.organization : "")
          || "";
        const branchId = branchObj?._id || (typeof branchObj === "string" ? branchObj : "") || "";

        setForm({
          name:         data.name || "",
          description:  data.description || "",
          isActive:     data.isActive !== false,
          organization: orgId,
          branch:       branchId,
        });
      })
      .catch(() => setApiError("Failed to load category."))
      .finally(() => setLoading(false));
  }, [id]);

  // Filter branches by selected org
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
    const e = { name: validateRequired(form.name, "Category name") };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError("");
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        isActive:    form.isActive,
      };
      // Super Admin can reassign branch (send null to clear)
      if (isSA) payload.branch = form.branch || null;
      await updateCategory(id, payload);
      navigate("/categories");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to update category.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  // Find current names for display
  const currentOrg    = orgs.find(o => o._id === form.organization);
  const currentBranch = branches.find(b => b._id === form.branch);

  return (
    <PageShell title="Edit Category" subtitle={"Editing: " + form.name}>
      <Card style={{ maxWidth: "480px" }}>
        <FormError message={apiError} />
        <form onSubmit={handleSubmit} noValidate>

          <FieldLabel>Category Name *</FieldLabel>
          <input
            placeholder="Category name"
            value={form.name}
            onChange={set("name")}
            style={{ ...IS, borderColor: errors.name ? "rgba(239,68,68,.5)" : undefined }}
          />
          {errors.name && (
            <div style={{ color:"#dc2626", fontSize:"11px", fontFamily:"'DM Mono',monospace", marginTop:"-8px", marginBottom:"10px" }}>
              {errors.name}
            </div>
          )}

          <FieldLabel>Description</FieldLabel>
          <input
            placeholder="Short description (optional)"
            value={form.description}
            onChange={set("description")}
            style={IS}
          />

          {/* Active toggle */}
          <div style={{ marginBottom: "18px" }}>
            <FieldLabel>Status</FieldLabel>
            <div
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", userSelect:"none" }}
            >
              <div style={{
                width:"40px", height:"22px", borderRadius:"99px",
                background: form.isActive ? "#059669" : "rgba(26,26,46,.18)",
                position:"relative", transition:"background .2s", flexShrink:0,
                boxShadow: form.isActive ? "0 0 0 3px rgba(5,150,105,.15)" : "none",
              }}>
                <div style={{
                  position:"absolute", top:"3px",
                  left: form.isActive ? "21px" : "3px",
                  width:"16px", height:"16px", borderRadius:"50%",
                  background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)",
                  transition:"left .2s",
                }} />
              </div>
              <span style={{ fontSize:"13.5px", color: form.isActive ? "#1a1a2e" : "rgba(26,26,46,.4)", fontWeight:500 }}>
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Super Admin: Org + Branch assignment */}
          {isSA && (
            <>
              <FormDivider label="Organization & Branch Assignment" />

              {/* Current assignment info */}
              {(form.organization || form.branch) && !loadingMeta && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"14px" }}>
                  {currentOrg && (
                    <div style={{ padding:"6px 12px", borderRadius:"99px", background:"rgba(124,58,237,.07)", border:"1px solid rgba(124,58,237,.18)", fontSize:"11.5px", color:"#7c3aed", fontWeight:700, display:"flex", alignItems:"center", gap:"5px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5"/></svg>
                      {currentOrg.name}
                    </div>
                  )}
                  {currentBranch && (
                    <div style={{ padding:"6px 12px", borderRadius:"99px", background:"rgba(2,132,199,.07)", border:"1px solid rgba(2,132,199,.18)", fontSize:"11.5px", color:"#0284c7", fontWeight:700, display:"flex", alignItems:"center", gap:"5px" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.75M3.75 21V10.5a9 9 0 0118 0V21"/></svg>
                      {currentBranch.branchName}
                    </div>
                  )}
                </div>
              )}

              <FieldLabel>Organization</FieldLabel>
              <select value={form.organization} onChange={set("organization")} style={SS} disabled={loadingMeta}>
                <option value="">— Global / No Organization —</option>
                {orgs.map(o => (
                  <option key={o._id} value={o._id}>{o.name}{o.city ? ` (${o.city})` : ""}</option>
                ))}
              </select>

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
                <div style={{ fontSize:"11px", color:"#b45309", fontFamily:"'DM Mono',monospace", marginTop:"-6px", marginBottom:"10px" }}>
                  No branches found for this organization
                </div>
              )}

              {/* Clear assignment option */}
              {(form.organization || form.branch) && (
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, organization: "", branch: "" }))}
                  style={{ fontSize:"11.5px", color:"#dc2626", background:"none", border:"none", cursor:"pointer", padding:"0 0 12px", textDecoration:"underline", fontFamily:"'DM Mono',monospace", letterSpacing:".05em" }}
                >
                  ✕ Clear assignment (make global)
                </button>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="submit" loading={saving} accent="#059669" glow="rgba(5,150,105,.25)">
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => navigate("/categories")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
