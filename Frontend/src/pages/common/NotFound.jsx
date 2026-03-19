import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ width:"100vw",height:"100vh",background:"#f5f3ee",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Figtree',sans-serif" }}>
      <div style={{ background:"#fff",borderRadius:"24px",border:"1px solid rgba(26,26,46,.08)",boxShadow:"0 8px 40px rgba(26,26,46,.1)",padding:"48px 52px",textAlign:"center",maxWidth: "min(400px, 100%)",width:"90%" }}>
        <div style={{ fontFamily:"'Fraunces',serif",fontSize:"80px",fontWeight:900,color:"rgba(26,26,46,.07)",lineHeight:1,marginBottom:"4px" }}>404</div>
        <h1 style={{ fontFamily:"'Fraunces',serif",fontSize:"24px",fontWeight:800,color:"#1a1a2e",marginBottom:"10px" }}>Page Not Found</h1>
        <p style={{ fontSize:"14px",color:"rgba(26,26,46,.45)",marginBottom:"28px",lineHeight:1.6 }}>The page you're looking for doesn't exist.</p>
        <button onClick={() => navigate(-1)}
          style={{ padding:"11px 28px",borderRadius:"12px",border:"1.5px solid rgba(26,26,46,.14)",cursor:"pointer",fontFamily:"'Figtree',sans-serif",fontSize:"14px",fontWeight:700,background:"#fff",color:"#1a1a2e",boxShadow:"0 2px 8px rgba(26,26,46,.08)" }}>
          Go Back
        </button>
      </div>
    </div>
  );
}
