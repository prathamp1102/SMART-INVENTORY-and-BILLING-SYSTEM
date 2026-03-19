import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS, SS, FormError, FieldLabel } from "../../components/forms/FormStyles";
import { validateEmail, validatePassword, validateRequired, validatePhone } from "../../utils/validators";
import axiosInstance from "../../services/axiosInstance";
import useAuth from "../../hooks/useAuth";

export default function AddUser() {
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const allowedRoles =
    me?.role === "SUPER_ADMIN"
      ? ["ADMIN", "STAFF", "CUSTOMER"]
      : ["STAFF"];

  const [form, setForm]         = useState({ name: "", email: "", password: "", role: allowedRoles[0], phone: "", address: "", organization: "", branch: "" });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  const [orgs, setOrgs]                       = useState([]);
  const [branches, setBranches]               = useState([]);
  const [loadingOrgs, setLoadingOrgs]         = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const isSuperAdmin = me?.role === "SUPER_ADMIN";
  const isAdmin      = me?.role === "ADMIN";

  // SUPER_ADMIN sees interactive org+branch picker when creating ADMIN or STAFF
  const showOrgBranchPicker = isSuperAdmin && ["ADMIN", "STAFF"].includes(form.role);
  // ADMIN always creates STAFF — show a read-only info panel
  const showAdminOrgInfo    = isAdmin;

  // Load orgs for SUPER_ADMIN picker
  useEffect(() => {
    if (!showOrgBranchPicker) return;
    setLoadingOrgs(true);
    axiosInstance.get("/organizations")
      .then(r => setOrgs(r.data))
      .catch(() => {})
      .finally(() => setLoadingOrgs(false));
  }, [showOrgBranchPicker]);

  // Load branches when org is selected (SUPER_ADMIN flow)
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

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    e.name     = validateRequired(form.name, "Name");
    e.email    = validateEmail(form.email);
    e.password = validatePassword(form.password);
    e.phone    = form.phone.trim() ? validatePhone(form.phone) : "";
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone.trim(), address: form.address.trim() };
      if (showOrgBranchPicker) {
        if (form.organization) payload.organization = form.organization;
        if (form.branch)       payload.branch       = form.branch;
      }
      await axiosInstance.post("/auth/add", payload);
      navigate("/users");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    ...SS,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%231a1a2e' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36, appearance: "none",
  };

  const infoRow = (iconPath, label, value) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 9, background: "rgba(124,58,237,.05)", border: "1px solid rgba(124,58,237,.15)", marginBottom: 10 }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={iconPath}/></svg>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#1a1a2e", fontFamily: "'DM Mono',monospace" }}>
          {value || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not assigned</span>}
        </div>
      </div>
    </div>
  );

  return (
    <PageShell title="Add User" subtitle="Create a new system user">
      <Card style={{ maxWidth: "min(520px, 100%)" }}>
        <FormError message={apiError} />

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <FieldLabel>Full Name *</FieldLabel>
          <input placeholder="Enter full name" value={form.name} onChange={set("name")}
            style={{ ...IS, borderColor: errors.name ? "rgba(239,68,68,.5)" : IS.borderColor }} />
          {errors.name && <div style={{ color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"-8px",marginBottom:"10px" }}>{errors.name}</div>}

          {/* Email */}
          <FieldLabel>Email Address *</FieldLabel>
          <input placeholder="Enter email address" value={form.email} onChange={set("email")} type="email"
            style={{ ...IS, borderColor: errors.email ? "rgba(239,68,68,.5)" : IS.borderColor }} />
          {errors.email && <div style={{ color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"-8px",marginBottom:"10px" }}>{errors.email}</div>}

          {/* Password */}
          <FieldLabel>Password *</FieldLabel>
          <input placeholder="Minimum 6 characters" value={form.password} onChange={set("password")} type="password"
            style={{ ...IS, borderColor: errors.password ? "rgba(239,68,68,.5)" : IS.borderColor }} />
          {errors.password && <div style={{ color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"-8px",marginBottom:"10px" }}>{errors.password}</div>}

          {/* Phone */}
          <FieldLabel>Phone Number</FieldLabel>
          <input placeholder="10-digit mobile number (optional)" value={form.phone} onChange={set("phone")} type="tel"
            style={{ ...IS, borderColor: errors.phone ? "rgba(239,68,68,.5)" : IS.borderColor }} />
          {errors.phone && <div style={{ color:"#dc2626",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginTop:"-8px",marginBottom:"10px" }}>{errors.phone}</div>}

          {/* Address */}
          <FieldLabel>Address</FieldLabel>
          <input placeholder="Street, City, State (optional)" value={form.address} onChange={set("address")}
            style={IS} />

          {/* Role */}
          <FieldLabel>Role *</FieldLabel>
          <select value={form.role} onChange={set("role")} style={selectStyle}>
            {allowedRoles.map(r => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>

          {/* ── SUPER_ADMIN: interactive org + branch picker ── */}
          {showOrgBranchPicker && (
            <div style={{ marginTop: 4, padding: "16px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,.15)", background: "rgba(124,58,237,.03)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", textTransform: "uppercase" }}>
                  Assign to Organization &amp; Branch
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
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18"/></svg>
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
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                New STAFF will be automatically assigned to your organization and branch.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <Button type="submit" loading={loading} accent="#7c3aed" glow="rgba(124,58,237,.25)">
              Create User
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
