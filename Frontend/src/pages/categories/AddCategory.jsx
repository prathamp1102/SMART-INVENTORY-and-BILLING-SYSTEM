import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS, SS, FormError, FieldLabel, FormDivider } from "../../components/forms/FormStyles";
import { validateRequired } from "../../utils/validators";
import { createCategory } from "../../services/productService";
import { getOrganizations, getBranches } from "../../services/organizationService";
import useAuth from "../../hooks/useAuth";

export default function AddCategory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSA = user?.role === "SUPER_ADMIN";

  const [form, setForm]       = useState({ name: "", description: "", organization: "", branch: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Super Admin dropdowns
  const [orgs, setOrgs]         = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => {
    if (!isSA) return;
    setLoadingMeta(true);
    Promise.all([getOrganizations(), getBranches()])
      .then(([o, b]) => { setOrgs(o); setBranches(b); })
      .catch(console.error)
      .finally(() => setLoadingMeta(false));
  }, [isSA]);

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
      // Reset branch when org changes
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
    setLoading(true);
    setApiError("");
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (isSA && form.branch) payload.branch = form.branch;
      await createCategory(payload);
      navigate("/categories");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Add Category" subtitle="Create a new product category">
      <Card style={{ maxWidth: "min(480px, 100%)" }}>
        <FormError message={apiError} />
        <form onSubmit={handleSubmit} noValidate>

          <FieldLabel>Category Name *</FieldLabel>
          <input
            placeholder="e.g. Electronics"
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

          {/* Super Admin: Org + Branch assignment */}
          {isSA && (
            <>
              <FormDivider label="Assign to Organization & Branch" />

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
                <option value="">— No Branch / All Branches —</option>
                {filteredBranches.map(b => (
                  <option key={b._id} value={b._id}>{b.branchName}{b.city ? ` — ${b.city}` : ""}</option>
                ))}
              </select>

              {form.organization && filteredBranches.length === 0 && (
                <div style={{ fontSize:"11px", color:"#b45309", fontFamily:"'DM Mono',monospace", marginTop:"-6px", marginBottom:"10px" }}>
                  No branches found for this organization
                </div>
              )}

              {/* Assignment preview badge */}
              {(form.organization || form.branch) && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"10px", background:"rgba(124,58,237,.06)", border:"1px solid rgba(124,58,237,.18)", marginBottom:"14px" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" width="14" height="14">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span style={{ fontSize:"12px", color:"#7c3aed", fontWeight:600 }}>
                    Will be assigned to{" "}
                    {form.branch
                      ? filteredBranches.find(b => b._id === form.branch)?.branchName
                      : orgs.find(o => o._id === form.organization)?.name}
                  </span>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <Button type="submit" loading={loading} accent="#059669" glow="rgba(5,150,105,.25)">
              Add Category
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
