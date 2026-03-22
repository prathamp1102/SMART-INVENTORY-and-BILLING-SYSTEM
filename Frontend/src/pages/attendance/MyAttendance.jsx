import { useState, useEffect } from "react";
import { getMyAttendanceApi, getTodayAttendanceApi, checkOutApi } from "../../services/attendanceService";
import { PageShell } from "../../components/ui/PageShell";
import useAuth from "../../hooks/useAuth";

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

const STATUS_STYLE = {
  PRESENT:  { bg: "rgba(5,150,105,.1)",   color: "#059669", label: "Present"  },
  HALF_DAY: { bg: "rgba(245,158,11,.1)",  color: "#d97706", label: "Half Day" },
  ABSENT:   { bg: "rgba(239,68,68,.1)",   color: "#dc2626", label: "Absent"   },
};

export default function MyAttendance() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [recs, todayRec] = await Promise.all([
        getMyAttendanceApi(month, year),
        getTodayAttendanceApi(),
      ]);
      setRecords(recs);
      setToday(todayRec);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleManualCheckout = async () => {
    setCheckingOut(true);
    try {
      const result = await checkOutApi();
      setToday(result.attendance);
      load();
    } catch (e) {
      console.error("Checkout failed", e);
    } finally {
      setCheckingOut(false);
    }
  };

  const present  = records.filter(r => r.status === "PRESENT").length;
  const halfDay  = records.filter(r => r.status === "HALF_DAY").length;
  const totalHrs = Math.round(records.reduce((a, r) => a + (r.duration || 0), 0) / 60 * 10) / 10;

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <PageShell title="My Attendance">
      {/* Today's Status Card */}
      <div style={{
        background: "#fff", borderRadius: "18px", padding: "24px 28px",
        border: "1px solid rgba(26,26,46,.08)", boxShadow: "0 2px 16px rgba(26,26,46,.06)",
        marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(26,26,46,.4)", marginBottom: "6px" }}>
            Today's Attendance
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#1a1a2e" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {today ? (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <Stat label="Login Time"  value={fmt(today.loginTime)} color="#059669" />
            <Stat label="Logout Time" value={fmt(today.logoutTime)} color="#7c3aed" />
            <Stat label="Duration"    value={fmtDuration(today.duration)} color="#0284c7" />
            <div style={{
              padding: "4px 14px", borderRadius: "20px",
              background: STATUS_STYLE[today.status]?.bg,
              color: STATUS_STYLE[today.status]?.color,
              fontWeight: 700, fontSize: "13px",
            }}>
              {STATUS_STYLE[today.status]?.label || today.status}
            </div>
            {!today.logoutTime && (
              <button
                onClick={handleManualCheckout}
                disabled={checkingOut}
                style={{
                  padding: "9px 20px", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff",
                  fontWeight: 700, fontSize: "13px", cursor: "pointer",
                }}
              >
                {checkingOut ? "Checking out…" : "Manual Check-out"}
              </button>
            )}
          </div>
        ) : (
          <div style={{ color: "rgba(26,26,46,.4)", fontStyle: "italic" }}>Not checked in yet today</div>
        )}
      </div>

      {/* Month Filter + Summary */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(26,26,46,.15)", fontSize: "13px", background: "#fff" }}
        >
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(26,26,46,.15)", fontSize: "13px", background: "#fff" }}
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div style={{ display: "flex", gap: "12px", marginLeft: "auto", flexWrap: "wrap" }}>
          <SummaryPill label="Present"  value={present}  color="#059669" />
          <SummaryPill label="Half Day" value={halfDay}  color="#d97706" />
          <SummaryPill label="Total Hrs" value={`${totalHrs}h`} color="#0284c7" />
        </div>
      </div>

      {/* Records Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "rgba(26,26,46,.4)" }}>Loading…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "rgba(26,26,46,.4)" }}>No attendance records found</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
                {["Date","Login","Logout","Duration","Status"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(26,26,46,.4)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={r._id} style={{ borderBottom: "1px solid rgba(26,26,46,.05)", background: i % 2 === 0 ? "#fff" : "rgba(26,26,46,.01)" }}>
                  <td style={{ padding: "12px 16px", fontSize: "13.5px", fontWeight: 600, color: "#1a1a2e" }}>
                    {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#059669", fontWeight: 600 }}>{fmt(r.loginTime)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: r.logoutTime ? "#7c3aed" : "rgba(26,26,46,.35)", fontWeight: r.logoutTime ? 600 : 400 }}>{fmt(r.logoutTime)}</td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "#0284c7" }}>{fmtDuration(r.duration)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                      background: STATUS_STYLE[r.status]?.bg || "rgba(26,26,46,.07)",
                      color: STATUS_STYLE[r.status]?.color || "#1a1a2e",
                    }}>
                      {STATUS_STYLE[r.status]?.label || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(26,26,46,.4)", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{
      padding: "8px 16px", borderRadius: "12px",
      background: `${color}18`, border: `1px solid ${color}44`,
      display: "flex", gap: "8px", alignItems: "center",
    }}>
      <span style={{ fontSize: "12px", color: "rgba(26,26,46,.5)" }}>{label}</span>
      <span style={{ fontSize: "15px", fontWeight: 800, color }}>{value}</span>
    </div>
  );
}
