export default function Loader({ fullScreen = false, size = 28, color = "#7c3aed" }) {
  const spinner = (
    <div style={{ width:`${size}px`,height:`${size}px`,borderRadius:"50%",border:`3px solid rgba(26,26,46,.1)`,borderTopColor:color,animation:"spin .7s linear infinite" }} />
  );
  if (fullScreen) {
    return (
      <div style={{ position:"fixed",inset:0,zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f5f3ee",gap:"14px" }}>
        {spinner}
        <span style={{ fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"rgba(26,26,46,.3)",letterSpacing:".14em",textTransform:"uppercase" }}>Loading…</span>
      </div>
    );
  }
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"48px" }}>
      {spinner}
    </div>
  );
}
