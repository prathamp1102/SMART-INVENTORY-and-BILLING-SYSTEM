import { useState } from "react";
import * as XLSX from "xlsx";

/**
 * ExcelExport – drop-in Excel export button for any list page.
 * Uses xlsx npm package (already in package.json) — no CDN needed.
 *
 * Props:
 *   data        – array of objects to export
 *   columns     – array of { key, label, format? }
 *                 key supports dot-notation: "branch.branchName"
 *   filename    – base filename (without extension)
 *   sheetName   – Excel sheet name (defaults to filename)
 *   buttonLabel – optional override
 *   accent      – optional { color, light, border }
 */

const green       = "#059669";
const greenLight  = "rgba(5,150,105,.08)";
const greenBorder = "rgba(5,150,105,.2)";

function resolve(obj, key) {
  return key.split(".").reduce((o, k) => o?.[k], obj);
}

function downloadXLSX(data, columns, filename, sheetName) {
  const header = columns.map(c => c.label);
  const rows = data.map(row =>
    columns.map(c => {
      const raw = resolve(row, c.key);
      const val = c.format ? c.format(raw, row) : raw;
      return val === null || val === undefined ? "" : val;
    })
  );
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = columns.map((c, i) => ({
    wch: Math.max(c.label.length, ...rows.slice(0, 100).map(r => String(r[i] ?? "").length)) + 2,
  }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName || filename);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export default function ExcelExport({ data = [], columns = [], filename = "export", sheetName, buttonLabel, accent }) {
  const [loading, setLoading] = useState(false);
  const btn = accent || { color: green, light: greenLight, border: greenBorder };
  const isEmpty = !data || data.length === 0;

  const handleExport = () => {
    if (isEmpty || loading) return;
    setLoading(true);
    try { downloadXLSX(data, columns, filename, sheetName); }
    catch (err) { console.error("Export failed:", err); }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isEmpty || loading}
      title={isEmpty ? "No data to export" : `Export ${data.length} rows to Excel`}
      style={{
        display:"flex", alignItems:"center", gap:"7px", padding:"8px 16px",
        borderRadius:"10px", border:`1.5px solid ${isEmpty?"rgba(26,26,46,.12)":btn.border}`,
        background:isEmpty?"rgba(26,26,46,.04)":btn.light,
        color:isEmpty?"rgba(26,26,46,.3)":btn.color,
        fontSize:"13px", fontWeight:700, cursor:isEmpty||loading?"not-allowed":"pointer",
        fontFamily:"'Poppins',sans-serif", transition:"all .15s", whiteSpace:"nowrap",
        opacity:loading?0.7:1,
      }}
      onMouseEnter={e=>{ if(!isEmpty&&!loading) e.currentTarget.style.background=btn.color+"22"; }}
      onMouseLeave={e=>{ if(!isEmpty&&!loading) e.currentTarget.style.background=btn.light; }}
    >
      {loading
        ? <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${btn.border}`,borderTopColor:btn.color,animation:"xlsxSpin .7s linear infinite"}}/>
        : <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5"/>
          </svg>
      }
      {buttonLabel||(loading?"Exporting…":`Export${data.length?` (${data.length})`:""}`)}
      <style>{`@keyframes xlsxSpin{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
