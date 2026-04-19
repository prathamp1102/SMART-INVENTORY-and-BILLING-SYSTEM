import ConfirmModal from "../../components/ui/ConfirmModal";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const STATUS_CONFIG = {
  SUBMITTED:           { label: "Submitted",           color: "#0284c7", bg: "rgba(2,132,199,.1)",  step: 1 },
  ACKNOWLEDGED:        { label: "Acknowledged",        color: "#7c3aed", bg: "rgba(124,58,237,.1)", step: 2 },
  TECHNICIAN_ASSIGNED: { label: "Technician Assigned", color: "#d97706", bg: "rgba(245,158,11,.1)", step: 3 },
  IN_PROGRESS:         { label: "In Progress",         color: "#ea580c", bg: "rgba(234,88,12,.1)",  step: 4 },
  RESOLVED:            { label: "Resolved",            color: "#059669", bg: "rgba(5,150,105,.1)",  step: 5 },
  CLOSED:              { label: "Closed",              color: "#059669", bg: "rgba(5,150,105,.1)",  step: 6 },
  CANCELLED:           { label: "Cancelled",           color: "#dc2626", bg: "rgba(239,68,68,.1)",  step: -1 },
};

const TIMELINE_STEPS = [
  { key: "SUBMITTED",           icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" },
  { key: "ACKNOWLEDGED",        icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { key: "TECHNICIAN_ASSIGNED", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
  { key: "IN_PROGRESS",         icon: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" },
  { key: "RESOLVED",            icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const PRIORITY_STYLE = {
  LOW:    { color: "#059669", bg: "rgba(5,150,105,.08)",   label: "Low" },
  MEDIUM: { color: "#d97706", bg: "rgba(245,158,11,.08)",  label: "Medium" },
  HIGH:   { color: "#ea580c", bg: "rgba(234,88,12,.08)",   label: "High" },
  URGENT: { color: "#dc2626", bg: "rgba(239,68,68,.08)",   label: "Urgent" },
};

export default function TrackComplaint() {
  const navigate = useNavigate();
  const [requests, setRequests]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [cancelling, setCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/service/requests");
      const data = Array.isArray(res.data) ? res.data : [];
      setRequests(data);
      // If navigated from "Track This Request" after submission, auto-select latest
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  const handleCancel = (id) => {
    setCancelError(null); 
    setCancelModal({id});
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatDateTime = d => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const filtered = requests.filter(r => {
    const matchSearch = (r.ticketNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.productName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const currentStep = selected ? (STATUS_CONFIG[selected.status]?.step || 1) : 0;
  const isCancelled = selected?.status === "CANCELLED";

  const confirmCancel=async()=>{
    if(!cancelModal)return;
    setCancelling(true); setCancelError(null);
    try{
      await axiosInstance.patch(`/service/requests/${cancelModal.id}/cancel`);
      setRequests(prev=>prev.map(r=>r._id===cancelModal.id?{...r,status:"CANCELLED"}:r));
      if (selected?._id === cancelModal.id) setSelected(prev => ({ ...prev, status: "CANCELLED" }));
      setCancelModal(null);
    }catch(err){ setCancelError(err?.response?.data?.message||"Failed to cancel."); }
    finally{ setCancelling(false); }
  };

  return (

    <>{cancelModal&&<ConfirmModal title="Cancel Service Request" message="Are you sure you want to cancel this service request?" variant="warning" loading={cancelling} error={cancelError} onConfirm={confirmCancel} onCancel={()=>{setCancelModal(null);setCancelError(null);}} confirmLabel="Yes, Cancel"/>}
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Track Complaint Status</h1>
          <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", margin: "5px 0 0" }}>Monitor all your service requests in real-time</p>
        </div>
        <button onClick={() => navigate("/customer/service-request")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "11px 18px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${ac},#92400e)`, color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Request
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "18px", alignItems: "start" }}>

        {/* Left: Request List */}
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ticket or product..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: "9px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              style={{ width: "100%", marginTop: "8px", padding: "9px 12px", borderRadius: "9px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "13px", background: "#fff", cursor: "pointer", outline: "none" }}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(26,26,46,.4)", fontSize: "13px" }}>Loading requests...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "rgba(26,26,46,.4)", fontSize: "13px", marginBottom: "12px" }}>No service requests found</p>
                <button onClick={() => navigate("/customer/service-request")} style={{ padding: "8px 16px", borderRadius: "9px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Raise First Request</button>
              </div>
            ) : filtered.map(r => {
              const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.SUBMITTED;
              const pr = PRIORITY_STYLE[r.priority] || PRIORITY_STYLE.MEDIUM;
              const isActive = selected?._id === r._id;
              return (
                <div key={r._id} onClick={() => setSelected(r)}
                  style={{ padding: "14px 18px", borderBottom: "1px solid rgba(26,26,46,.05)", cursor: "pointer", transition: "background .15s", background: isActive ? acLight : "transparent", borderLeft: isActive ? `3px solid ${ac}` : "3px solid transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: ac, fontFamily: "'DM Mono',monospace" }}>{r.ticketNo}</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a1a2e", marginBottom: "2px" }}>{r.productName}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(26,26,46,.45)" }}>{formatDate(r.createdAt)}</div>
                  <span style={{ display: "inline-block", marginTop: "5px", fontSize: "10.5px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", background: pr.bg, color: pr.color }}>{pr.label} Priority</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Header card */}
            <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: "4px" }}>Ticket Number</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: ac, fontFamily: "'DM Mono',monospace" }}>{selected.ticketNo}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "5px 14px", borderRadius: "99px", background: STATUS_CONFIG[selected.status]?.bg, color: STATUS_CONFIG[selected.status]?.color }}>{STATUS_CONFIG[selected.status]?.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "5px 14px", borderRadius: "99px", background: PRIORITY_STYLE[selected.priority]?.bg, color: PRIORITY_STYLE[selected.priority]?.color }}>{PRIORITY_STYLE[selected.priority]?.label} Priority</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(150px, 100%), 1fr))", gap: "12px", marginTop: "18px" }}>
                {[
                  { l: "Product",        v: selected.productName },
                  { l: "Serial No.",     v: selected.serialNumber || "—" },
                  { l: "Issue Type",     v: selected.issueType?.replace(/_/g, " ") },
                  { l: "Submitted",      v: formatDate(selected.createdAt) },
                  { l: "Preferred Date", v: selected.preferredDate ? formatDate(selected.preferredDate) : "Flexible" },
                ].map((info, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(26,26,46,.025)", border: "1px solid rgba(26,26,46,.06)" }}>
                    <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "4px" }}>{info.l}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>{info.v}</div>
                  </div>
                ))}
              </div>

              {/* ── Assigned Technician Card ── */}
              {(selected.assignedTo || selected.assignedToId) ? (
                <div style={{ marginTop: "14px", padding: "16px 18px", borderRadius: "14px", background: "linear-gradient(135deg,rgba(3,105,161,.06),rgba(3,105,161,.03))", border: "1.5px solid rgba(3,105,161,.2)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "#0369a1", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0369a1"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                    Assigned Technician
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "linear-gradient(135deg,#0369a1,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(3,105,161,.3)" }}>
                      <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>
                        {(selected.assignedTo?.name || selected.assignedTo || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginBottom: "4px" }}>
                        {selected.assignedTo?.name || selected.assignedTo || "Technician Assigned"}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {selected.assignedTo?.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "12px", color: "rgba(15,18,42,.55)", fontWeight: 600 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(15,18,42,.45)"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
                            {selected.assignedTo.phone}
                          </div>
                        )}
                        {selected.assignedTo?.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "12px", color: "rgba(15,18,42,.55)", fontWeight: 600 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(15,18,42,.45)"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                            {selected.assignedTo.email}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "11px", fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: "rgba(3,105,161,.1)", color: "#0369a1" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#0369a1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
                          Verified Staff
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", padding: "9px 12px", borderRadius: "9px", background: "rgba(3,105,161,.06)", fontSize: "12px", color: "#0369a1", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0369a1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                    Your request is being handled. You'll be contacted for scheduling.
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "14px", padding: "13px 16px", borderRadius: "12px", background: "rgba(26,26,46,.025)", border: "1px dashed rgba(26,26,46,.12)", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(26,26,46,.25)"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(26,26,46,.45)" }}>No Technician Assigned Yet</div>
                    <div style={{ fontSize: "11px", color: "rgba(26,26,46,.35)", marginTop: 2 }}>Our team will assign a technician shortly.</div>
                  </div>
                </div>
              )}
              {selected.issueDescription && (
                <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: "rgba(26,26,46,.025)", border: "1px solid rgba(26,26,46,.06)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.38)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>Issue Description</div>
                  <div style={{ fontSize: "13.5px", color: "#1a1a2e", lineHeight: 1.6 }}>{selected.issueDescription}</div>
                </div>
              )}
              {selected.resolutionNote && (
                <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "12px", background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.15)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "#059669", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "6px" }}>Resolution Note</div>
                  <div style={{ fontSize: "13.5px", color: "#1a1a2e", lineHeight: 1.6 }}>{selected.resolutionNote}</div>
                </div>
              )}
            </div>

            {/* Progress Timeline */}
            {!isCancelled && (
              <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
                <h3 style={{ margin: "0 0 20px", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: ".06em" }}>Progress Timeline</h3>
                {TIMELINE_STEPS.map((step, i) => {
                  const cfg = STATUS_CONFIG[step.key];
                  const done   = currentStep > cfg.step;
                  const active = currentStep === cfg.step;
                  return (
                    <div key={step.key} style={{ display: "flex", gap: "14px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: done || active ? acLight : "rgba(26,26,46,.04)", border: `2px solid ${done || active ? ac : "rgba(26,26,46,.1)"}` }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={done || active ? ac : "rgba(26,26,46,.25)"} strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                          </svg>
                        </div>
                        {i < TIMELINE_STEPS.length - 1 && <div style={{ width: "2px", flex: 1, minHeight: "24px", background: done ? ac : "rgba(26,26,46,.08)", margin: "4px 0" }} />}
                      </div>
                      <div style={{ paddingTop: "7px", paddingBottom: i < TIMELINE_STEPS.length - 1 ? "14px" : "0" }}>
                        <div style={{ fontSize: "14px", fontWeight: done || active ? 700 : 500, color: done || active ? "#1a1a2e" : "rgba(26,26,46,.35)" }}>{cfg.label}</div>
                        {active && <div style={{ fontSize: "12px", color: ac, marginTop: "2px", fontWeight: 600 }}>Current Status</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isCancelled && (
              <div style={{ background: "rgba(239,68,68,.06)", borderRadius: "16px", border: "1.5px solid rgba(239,68,68,.15)", padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#dc2626" }}>Request Cancelled</div>
                    <div style={{ fontSize: "12px", color: "rgba(239,68,68,.7)", marginTop: "2px" }}>This service request has been cancelled.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Status History */}
            {selected.statusHistory?.length > 0 && (
              <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "22px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", textTransform: "uppercase", letterSpacing: ".06em" }}>Activity Log</h3>
                {[...selected.statusHistory].reverse().map((h, i) => {
                  const cfg = STATUS_CONFIG[h.status] || STATUS_CONFIG.SUBMITTED;
                  return (
                    <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < selected.statusHistory.length - 1 ? "14px" : "0" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color, marginTop: "6px", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                          <span style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", fontFamily: "'DM Mono',monospace" }}>{formatDateTime(h.updatedAt)}</span>
                        </div>
                        {h.note && <div style={{ fontSize: "12.5px", color: "rgba(26,26,46,.55)", marginTop: "3px" }}>{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            {!["RESOLVED", "CLOSED", "CANCELLED"].includes(selected.status) && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleCancel(selected._id)} disabled={cancelling} style={{ padding: "12px 20px", borderRadius: "12px", border: "1.5px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.06)", color: "#dc2626", fontSize: "14px", fontWeight: 700, cursor: cancelling ? "not-allowed" : "pointer" }}>
                  {cancelling ? "Cancelling..." : "Cancel Request"}
                </button>
                <button onClick={() => navigate(`/customer/service-request`)} style={{ padding: "12px 20px", borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight, color: ac, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                  New Request
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(26,26,46,.08)", padding: "60px", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: acLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108" /></svg>
            </div>
            <p style={{ color: "rgba(26,26,46,.4)", fontSize: "14px" }}>Select a request from the list to view details</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}