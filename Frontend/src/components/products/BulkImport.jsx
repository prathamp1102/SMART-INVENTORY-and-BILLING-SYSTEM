import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { createProduct } from "../../services/productService";
import { Card } from "../ui/PageShell";
import Button from "../ui/Button";

// ── helpers ───────────────────────────────────────────────────
const REQUIRED_COLS = ["name", "costPrice", "price"];

function matchCategory(catName, categories) {
  if (!catName) return null;
  const lower = catName.toString().trim().toLowerCase();
  return categories.find(c => c.name.toLowerCase() === lower)?._id || null;
}

function rowToProduct(row, categories) {
  const errors = [];
  if (!row.name?.toString().trim()) errors.push("name is required");
  if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0) errors.push("price must be > 0");
  if (!row.costPrice || isNaN(Number(row.costPrice)) || Number(row.costPrice) <= 0) errors.push("costPrice must be > 0");

  const catId = matchCategory(row.categoryName, categories);
  if (!catId) errors.push(`category "${row.categoryName}" not found`);

  return {
    valid: errors.length === 0,
    errors,
    payload: {
      name:        row.name?.toString().trim(),
      price:       Number(row.price),
      costPrice:   Number(row.costPrice),
      stock:       Number(row.stock) || 0,
      barcode:     row.barcode?.toString().trim() || undefined,
      description: row.description?.toString().trim() || undefined,
      category:    catId,
    },
  };
}

// ── component ─────────────────────────────────────────────────
export default function BulkImport({ categories, onSuccess, onCancel }) {
  const [rows, setRows]         = useState([]);   // parsed preview rows
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults]   = useState(null); // { ok, failed }
  const [parseError, setParseError] = useState("");
  const inputRef = useRef();

  // ── parse file ───────────────────────────────────────────────
  const parseFile = (file) => {
    setParseError(""); setRows([]); setResults(null);
    if (!file) return;

    const allowed = ["xlsx", "xls", "csv"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setParseError("Unsupported file type. Please use .xlsx, .xls or .csv");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: "binary" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (data.length === 0) { setParseError("File is empty or has no data rows."); return; }

        // validate columns
        const missing = REQUIRED_COLS.filter(c => !(c in data[0]));
        if (missing.length) {
          setParseError(`Missing required columns: ${missing.join(", ")}. Make sure row 1 has the exact header names.`);
          return;
        }
        setRows(data.map((r, i) => ({ ...rowToProduct(r, categories), raw: r, idx: i + 2 }))); // idx = Excel row number
      } catch {
        setParseError("Could not read file. Make sure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const onFileChange = (e) => parseFile(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]); };

  // ── import all valid rows ────────────────────────────────────
  const handleImport = async () => {
    const valid = rows.filter(r => r.valid);
    if (!valid.length) return;
    setImporting(true);

    const ok = [], failed = [];
    for (const r of valid) {
      try {
        await createProduct(r.payload);
        ok.push(r.raw.name);
      } catch (err) {
        failed.push({ name: r.raw.name, reason: err?.response?.data?.message || "Unknown error" });
      }
    }
    setImporting(false);
    setResults({ ok, failed });
    if (failed.length === 0) setTimeout(onSuccess, 1800);
  };

  const validCount   = rows.filter(r => r.valid).length;
  const invalidCount = rows.filter(r => !r.valid).length;

  // ── download template ────────────────────────────────────────
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "costPrice", "price", "stock", "barcode", "description", "categoryName"],
      ["Wireless Mouse", 500, 899, 50, "BAR001", "Ergonomic mouse", "Electronics"],
      ["Office Chair",   4500, 7999, 15, "BAR002", "Adjustable chair", "Furniture"],
    ]);
    ws["!cols"] = [22,12,12,10,14,30,18].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "evara_products_template.xlsx");
  };

  return (
    <div style={{ maxWidth: "720px" }}>

      {/* ── Result screen ──────────────────────────────────── */}
      {results && (
        <Card style={{ marginBottom: "16px" }}>
          <div style={{ fontFamily:"'Fraunces',serif", fontSize:"17px", fontWeight:700, color:"#1a1a2e", marginBottom:"16px" }}>Import Results</div>
          {results.ok.length > 0 && (
            <div style={{ padding:"12px 16px", borderRadius:"10px", background:"rgba(5,150,105,.07)", border:"1px solid rgba(5,150,105,.2)", marginBottom:"10px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#059669", marginBottom:"6px", display:"flex", alignItems:"center", gap:"6px" }}>
                <svg viewBox="0 0 24 24" fill="#059669" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
                {results.ok.length} product{results.ok.length !== 1 ? "s" : ""} imported successfully
              </div>
              <div style={{ fontSize:"12px", color:"rgba(26,26,46,.55)", lineHeight:1.7 }}>{results.ok.join(", ")}</div>
            </div>
          )}
          {results.failed.length > 0 && (
            <div style={{ padding:"12px 16px", borderRadius:"10px", background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#dc2626", marginBottom:"8px", display:"flex", alignItems:"center", gap:"6px" }}>
                <svg viewBox="0 0 24 24" fill="#dc2626" width="16" height="16"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                {results.failed.length} failed
              </div>
              {results.failed.map((f, i) => (
                <div key={i} style={{ fontSize:"12px", color:"rgba(26,26,46,.6)", marginBottom:"3px" }}>
                  <strong>{f.name}</strong> — {f.reason}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:"14px", display:"flex", gap:"8px" }}>
            <Button variant="secondary" onClick={() => { setRows([]); setResults(null); setFileName(""); }}>Import Another File</Button>
            <Button accent="#0284c7" glow="rgba(2,132,199,.25)" onClick={onSuccess}>Go to Products</Button>
          </div>
        </Card>
      )}

      {!results && (<>

        {/* ── Instructions + template download ─────────────── */}
        <Card style={{ marginBottom:"16px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"16px", flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:"16px", fontWeight:700, color:"#1a1a2e", marginBottom:"10px" }}>How to import</div>
              <div style={{ fontSize:"13px", color:"rgba(26,26,46,.55)", lineHeight:1.9 }}>
                1. Download the template below and fill in your products.<br />
                2. Required columns: <Code>name</Code>, <Code>costPrice</Code>, <Code>price</Code>, <Code>categoryName</Code>.<br />
                3. <Code>categoryName</Code> must <strong>exactly match</strong> an existing category (case-sensitive).<br />
                4. Upload the filled file — invalid rows are skipped, valid ones are imported.
              </div>
            </div>
            <button onClick={downloadTemplate}
              style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 18px", borderRadius:"11px", border:"1.5px solid rgba(2,132,199,.25)", background:"rgba(2,132,199,.06)", color:"#0284c7", cursor:"pointer", fontFamily:"'Poppins',sans-serif", fontSize:"13px", fontWeight:700, whiteSpace:"nowrap", transition:"all .18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(2,132,199,.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(2,132,199,.06)"; }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Template
            </button>
          </div>
        </Card>

        {/* ── Drop zone ────────────────────────────────────── */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? "#0284c7" : "rgba(26,26,46,.15)"}`,
            borderRadius: "16px", padding: "40px 24px",
            background: dragging ? "rgba(2,132,199,.04)" : "#fff",
            display: "flex", flexDirection: "column", alignItems: "center",
            cursor: "pointer", transition: "all .2s", marginBottom: "16px",
            boxShadow: dragging ? "0 0 0 4px rgba(2,132,199,.1)" : "none",
          }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} style={{ display:"none" }} />
          <div style={{ width:"52px", height:"52px", borderRadius:"14px", background: fileName ? "rgba(2,132,199,.1)" : "rgba(26,26,46,.05)", border:`1.5px solid ${fileName ? "rgba(2,132,199,.25)" : "rgba(26,26,46,.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"14px" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={fileName ? "#0284c7" : "rgba(26,26,46,.4)"} strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          {fileName
            ? <div style={{ fontSize:"14px", fontWeight:700, color:"#0284c7", marginBottom:"4px" }}>{fileName}</div>
            : <div style={{ fontSize:"14px", fontWeight:600, color:"#1a1a2e", marginBottom:"4px" }}>Drop your Excel or CSV file here</div>
          }
          <div style={{ fontSize:"12px", color:"rgba(26,26,46,.4)" }}>
            {fileName ? "Click to change file" : "or click to browse — .xlsx, .xls, .csv"}
          </div>
        </div>

        {/* ── Parse error ───────────────────────────────────── */}
        {parseError && (
          <div style={{ padding:"10px 14px", borderRadius:"10px", marginBottom:"14px", background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", fontSize:"12px", color:"#dc2626", fontFamily:"'DM Mono',monospace" }}>
            ⚠ {parseError}
          </div>
        )}

        {/* ── Preview table ─────────────────────────────────── */}
        {rows.length > 0 && (
          <Card style={{ padding:0, overflow:"hidden" }}>
            {/* Summary bar */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid rgba(26,26,46,.07)", flexWrap:"wrap", gap:"8px" }}>
              <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                <span style={{ fontSize:"13px", fontWeight:600, color:"#1a1a2e" }}>{rows.length} rows found</span>
                {validCount > 0 && <Badge color="#059669" bg="rgba(5,150,105,.08)" border="rgba(5,150,105,.2)">✓ {validCount} valid</Badge>}
                {invalidCount > 0 && <Badge color="#dc2626" bg="rgba(239,68,68,.08)" border="rgba(239,68,68,.2)">✗ {invalidCount} invalid</Badge>}
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <Button variant="secondary" size="sm" onClick={() => { setRows([]); setFileName(""); }}>Clear</Button>
                <Button
                  size="sm" loading={importing} disabled={validCount === 0}
                  accent="#0284c7" glow="rgba(2,132,199,.25)"
                  onClick={handleImport}
                >
                  Import {validCount} Product{validCount !== 1 ? "s" : ""}
                </Button>
              </div>
            </div>

            {/* Rows */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"rgba(26,26,46,.03)" }}>
                    {["Row","Name","Cost ₹","Price ₹","Stock","Category","Barcode","Status"].map(h => (
                      <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontFamily:"'DM Mono',monospace", fontSize:"9px", color:"rgba(26,26,46,.35)", letterSpacing:".13em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop:"1px solid rgba(26,26,46,.05)", background: r.valid ? "transparent" : "rgba(239,68,68,.02)" }}>
                      <td style={{ padding:"10px 12px", fontSize:"11px", color:"rgba(26,26,46,.4)", fontFamily:"'DM Mono',monospace" }}>{r.idx}</td>
                      <td style={{ padding:"10px 12px", fontSize:"13px", fontWeight:600, color:"#1a1a2e", whiteSpace:"nowrap" }}>{r.raw.name || <span style={{color:"rgba(26,26,46,.3)"}}>—</span>}</td>
                      <td style={{ padding:"10px 12px", fontSize:"12px", color:"rgba(26,26,46,.6)", fontFamily:"'DM Mono',monospace" }}>{r.raw.costPrice || "—"}</td>
                      <td style={{ padding:"10px 12px", fontSize:"12px", color:"rgba(26,26,46,.6)", fontFamily:"'DM Mono',monospace" }}>{r.raw.price || "—"}</td>
                      <td style={{ padding:"10px 12px", fontSize:"12px", color:"rgba(26,26,46,.6)", fontFamily:"'DM Mono',monospace" }}>{r.raw.stock ?? "0"}</td>
                      <td style={{ padding:"10px 12px", fontSize:"12px", color:"rgba(26,26,46,.6)" }}>{r.raw.categoryName || <span style={{color:"rgba(26,26,46,.3)"}}>—</span>}</td>
                      <td style={{ padding:"10px 12px", fontSize:"11px", color:"rgba(26,26,46,.4)", fontFamily:"'DM Mono',monospace" }}>{r.raw.barcode || "—"}</td>
                      <td style={{ padding:"10px 12px" }}>
                        {r.valid
                          ? <Badge color="#059669" bg="rgba(5,150,105,.08)" border="rgba(5,150,105,.2)">✓ Ready</Badge>
                          : (
                            <div>
                              <Badge color="#dc2626" bg="rgba(239,68,68,.08)" border="rgba(239,68,68,.2)">✗ Error</Badge>
                              {r.errors.map((e, j) => (
                                <div key={j} style={{ fontSize:"10px", color:"#dc2626", marginTop:"3px", fontFamily:"'DM Mono',monospace" }}>{e}</div>
                              ))}
                            </div>
                          )
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Cancel */}
        <div style={{ marginTop:"14px" }}>
          <Button variant="ghost" onClick={onCancel} accent="rgba(26,26,46,.5)">← Back to manual entry</Button>
        </div>
      </>)}
    </div>
  );
}

function Badge({ color, bg, border, children }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:"99px", background:bg, border:`1px solid ${border}`, color, fontSize:"11px", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function Code({ children }) {
  return (
    <code style={{ fontFamily:"'DM Mono',monospace", fontSize:"11.5px", color:"#0284c7", background:"rgba(2,132,199,.08)", padding:"1px 6px", borderRadius:"4px" }}>
      {children}
    </code>
  );
}
