import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import { IS, SS, FormError, FieldLabel } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const allowedRoles =
    me?.role === "SUPER_ADMIN"
      ? ["SUPER_ADMIN", "ADMIN", "STAFF", "CUSTOMER"]
      : ["STAFF"];

  const [form, setForm]         = useState({ name: "", email: "", role: "STAFF", isActive: true, organization: "", branch: "" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [apiError, setApiError] = useState("");

  const [orgs, setOrgs]                       = useState([]);
  const [branches, setBranches]               = useState([]);
  const [loadingOrgs, setLoadingOrgs]         = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isSuperAdmin = me?.role === "SUPER_ADMIN";
  const isAdmin      = me?.role === "ADMIN";

  const showOrgBranchPicker = isSuperAdmin && ["ADMIN", "STAFF"].includes(form.role);
  const showAdminOrgInfo    = isAdmin;

  const set = (k) => (e) =>
    setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // Load user
  useEffect(() => {
    axiosInstance.get("/auth/users/" + id)
      .then(r => {
        const u = r.data;
        // org may be populated object or raw id
        const orgId    = u.organization?._id || u.organization || "";
        // branch.organization may be nested
        const branchId = u.branch?._id || u.branch || "";
        setForm({
          name:         u.name,
          email:        u.email,
          role:         u.role,
          isActive:     u.isActive,
          organization: orgId,
          branch:       branchId,
        });
      })
      .catch(() => setApiError("Failed to load user."))
      .finally(() => setLoading(false));
  }, [id]);

  // Load orgs for SUPER_ADMIN picker
  useEffect(() => {
    if (!showOrgBranchPicker) return;
    setLoadingOrgs(true);
    axiosInstance.get("/organizations")
      .then(r => setOrgs(r.data))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, [showOrgBranchPicker]);

  // Load branches when org changes
  useEffect(() => {
    if (!showOrgBranchPicker) return;
    if (!form.organization) { setBranches([]); setForm(f => ({ ...f, branch: "" })); return; }
    setLoadingBranches(true);
    axiosInstance.get("/branches")
      .then(r => {
        const filtered = r.data.filter(
          b => b.organization?._id === form.organization || b.organization === form.organization
        );
        setBranches(filtered);
      })
      .catch(() => {})
      .finally(() => setLoadingBranches(false));
  }, [form.organization, showOrgBranchPicker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setApiError("");
    try {
      const payload = { name: form.name, role: form.role, isActive: form.isActive };
      if (showOrgBranchPicker) {
        payload.organization = form.organization || null;
        payload.branch       = form.branch       || null;
      }
      await axiosInstance.put("/auth/users/" + id, payload);
      navigate("/users");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    ...SS,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%231a1a2e' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36, appearance: "none",
  };

  const infoRow = (iconPath, label, value) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, background: "rgba(124,58,237,.05)", border: "1px solid rgba(124,58,237,.15)", marginBottom: 10 }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/>
      </svg>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1a1a2e", fontFamily: "'DM Mono',monospace" }}>
          {value || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not assigned</span>}
        </div>
      </div>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <PageShell title="Edit User" subtitle={"Editing: " + form.name}>
      <Card style={{ maxWidth: "480px" }}>
        <FormError message={apiError} />
        <form onSubmit={handleSubmit}>

          {/* Name */}
          <FieldLabel>Full Name</FieldLabel>
          <input placeholder="Full name" value={form.name} onChange={set("name")} style={IS} />

          {/* Email — read-only */}
          <FieldLabel>Email Address</FieldLabel>
          <input value={form.email} disabled
            style={{ ...IS, background: "rgba(26,26,46,.03)", color: "rgba(26,26,46,.4)", cursor: "not-allowed", borderColor: "rgba(26,26,46,.08)" }} />

          {/* Role */}
          <FieldLabel>Role</FieldLabel>
          <select value={form.role} onChange={set("role")} style={selectStyle}>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>

          {/* ── SUPER_ADMIN: interactive org + branch picker ── */}
          {showOrgBranchPicker && (
            <div style={{ marginTop: 4, padding: "16px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,.15)", background: "rgba(124,58,237,.03)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Organization &amp; Branch
                </span>
              </div>

              <FieldLabel>Organization</FieldLabel>
              <select value={form.organization} onChange={set("organization")} style={{ ...selectStyle, marginBottom: 10 }} disabled={loadingOrgs}>
                <option value="">{loadingOrgs ? "Loading…" : "— Select Organization —"}</option>
                {orgs.map(o => (
                  <option key={o._id} value={o._id}>{o.name}{o.city ? ` · ${o.city}` : ""}</option>
                ))}
              </select>

              <FieldLabel>Branch</FieldLabel>
              <select value={form.branch} onChange={set("branch")} style={{ ...selectStyle, marginBottom: 0 }}
                disabled={!form.organization || loadingBranches}>
                <option value="">
                  {!form.organization
                    ? "Select an organization first"
                    : loadingBranches ? "Loading…"
                    : branches.length === 0 ? "No branches found"
                    : "— Select Branch —"}
                </option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>{b.branchName}{b.city ? ` · ${b.city}` : ""}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── ADMIN: read-only org + branch info ── */}
          {showAdminOrgInfo && (
            <div style={{ marginTop: 4, padding: "16px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,.15)", background: "rgba(124,58,237,.03)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Organization &amp; Branch
                </span>
              </div>

              {infoRow(
                "M2.25 21h19.5M3.75 21V6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25V21",
                "Organization",
                me?.organization?.name
                  ? `${me.organization.name}${me.organization.city ? ` · ${me.organization.city}` : ""}`
                  : me?.branch?.organization?.name || null
              )}

              {infoRow(
                "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
                "Branch",
                me?.branch?.branchName
                  ? `${me.branch.branchName}${me.branch.city ? ` · ${me.branch.city}` : ""}`
                  : null
              )}

              <div style={{ display:"flex",alignItems:"center",gap:"7px",padding:"9px 12px",borderRadius:"9px",background:"rgba(2,132,199,.06)",border:"1px solid rgba(2,132,199,.15)",marginTop:4,fontSize:"12px",color:"#0369a1",fontFamily:"'DM Mono',monospace" }}>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                Organization and branch are inherited from your account.
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div style={{ marginBottom: "18px" }}>
            <FieldLabel>Account Status</FieldLabel>
            <div onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}>
              <div style={{
                width: "40px", height: "22px", borderRadius: "99px",
                background: form.isActive ? "#7c3aed" : "rgba(26,26,46,.18)",
                position: "relative", transition: "background .2s", flexShrink: 0,
                boxShadow: form.isActive ? "0 0 0 3px rgba(124,58,237,.15)" : "none",
              }}>
                <div style={{
                  position: "absolute", top: "3px",
                  left: form.isActive ? "21px" : "3px",
                  width: "16px", height: "16px",
                  borderRadius: "50%", background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  transition: "left .2s",
                }} />
              </div>
              <span style={{ fontSize: "13.5px", color: form.isActive ? "#1a1a2e" : "rgba(26,26,46,.4)", fontWeight: 500 }}>
                {form.isActive ? "Active" : "Deactivated"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="submit" loading={saving} accent="#7c3aed" glow="rgba(124,58,237,.25)">
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => navigate("/users")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
