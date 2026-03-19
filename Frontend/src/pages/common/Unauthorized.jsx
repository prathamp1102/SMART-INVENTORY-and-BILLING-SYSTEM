import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { homePath } = useAuth();
  return (
    <div style={{ width:"100vw",height:"100vh",background:"#f5f3ee",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Figtree',sans-serif" }}>
      <div style={{ background:"#fff",borderRadius:"24px",border:"1px solid rgba(26,26,46,.08)",boxShadow:"0 8px 40px rgba(26,26,46,.1)",padding:"48px 52px",textAlign:"center",maxWidth: "min(400px, 100%)",width:"90%" }}>
        <div style={{ fontSize:"52px",marginBottom:"16px" }}>🚫</div>
        <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:"26px",fontWeight:800,color:"#1a1a2e",marginBottom:"10px" }}>Access Denied</h1>
        <p style={{ fontSize:"14px",color:"rgba(26,26,46,.45)",marginBottom:"28px",lineHeight:1.6 }}>You don't have permission to view this page.</p>
        <button onClick={() => navigate(homePath)}
          style={{ padding:"11px 28px",borderRadius:"12px",border:"none",cursor:"pointer",fontFamily:"'Figtree',sans-serif",fontSize:"14px",fontWeight:700,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",boxShadow:"0 4px 16px rgba(124,58,237,.3)" }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
