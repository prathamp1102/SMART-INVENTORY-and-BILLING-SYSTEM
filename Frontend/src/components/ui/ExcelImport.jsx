import { useState, useRef } from "react";

const ac = "#7c3aed";
const acLight = "rgba(124,58,237,.08)";
const acBorder = "rgba(124,58,237,.2)";
const green = "#059669";
const greenLight = "rgba(5,150,105,.08)";
const greenBorder = "rgba(5,150,105,.2)";
const red = "#dc2626";
const redLight = "rgba(239,68,68,.08)";
const redBorder = "rgba(239,68,68,.2)";
const amber = "#b45309";

/**
 * ExcelImport – drop-in Excel import button for any list page.
 *
 * Props:
 *   entity      – string key that matches a SCHEMA entry below
 *   onImport    – async (rows: object[]) => void   called with parsed rows
 *   buttonLabel – optional override for button text
 *   accent      – optional {color, light, border} for different pages
 */

/* ── Column schemas per entity ─────────────────────────────── */
const SCHEMAS = {
  organizations: {
    label: "Organizations",
    columns: ["name", "gstNumber", "email", "phone", "address", "city", "state", "status"],
    required: ["name"],
    notes: ["status: ACTIVE or INACTIVE (default ACTIVE)"],
    sample: [
      { name: "Alpha Corp", gstNumber: "27AAACS1234A1Z5", email: "admin@alpha.in", phone: "9876543210", address: "123 MG Road", city: "Mumbai", state: "Maharashtra", status: "ACTIVE" },
      { name: "Beta Pvt Ltd", gstNumber: "", email: "info@beta.com", phone: "9123456789", address: "45 Park St", city: "Chennai", state: "Tamil Nadu", status: "ACTIVE" },
    ],
  },
  branches: {
    label: "Branches",
    columns: ["branchName", "organizationName", "address", "city", "state", "status"],
    required: ["branchName", "organizationName"],
    notes: ["organizationName must match an existing organization exactly", "status: ACTIVE or INACTIVE"],
    sample: [
      { branchName: "Head Office - Andheri", organizationName: "Alpha Corp", address: "Andheri East", city: "Mumbai", state: "Maharashtra", status: "ACTIVE" },
      { branchName: "South Branch", organizationName: "Beta Pvt Ltd", address: "Anna Nagar", city: "Chennai", state: "Tamil Nadu", status: "ACTIVE" },
    ],
  },
  users: {
    label: "Users",
    columns: ["name", "email", "phone", "role", "organizationName", "branchName", "isActive"],
    required: ["name", "email", "role"],
    notes: ["role: SUPER_ADMIN | ADMIN | STAFF | CUSTOMER", "isActive: true or false", "branchName must match existing branch"],
    sample: [
      { name: "Ravi Kumar", email: "ravi@alpha.in", phone: "9876500001", role: "ADMIN", organizationName: "Alpha Corp", branchName: "Head Office - Andheri", isActive: "true" },
      { name: "Priya Shah", email: "priya@alpha.in", phone: "9876500002", role: "STAFF", organizationName: "Alpha Corp", branchName: "Head Office - Andheri", isActive: "true" },
    ],
  },
  products: {
    label: "Products",
    columns: ["name", "barcode", "categoryName", "supplierName", "price", "costPrice", "stock", "unit", "description", "isActive", "branchName"],
    required: ["name", "price"],
    notes: ["price & costPrice in ₹ numbers", "stock default 0", "isActive: true or false", "categoryName & supplierName must match existing records"],
    sample: [
      { name: "Basmati Rice 5kg", barcode: "8901234567890", categoryName: "Grains", supplierName: "Agro Suppliers", price: 450, costPrice: 380, stock: 100, unit: "bag", description: "Premium basmati", isActive: "true", branchName: "Head Office - Andheri" },
      { name: "Toor Dal 1kg", barcode: "8901234567891", categoryName: "Pulses", supplierName: "Agro Suppliers", price: 130, costPrice: 110, stock: 200, unit: "kg", description: "", isActive: "true", branchName: "" },
    ],
  },
  categories: {
    label: "Categories",
    columns: ["name", "description", "isActive"],
    required: ["name"],
    notes: ["isActive: true or false (default true)"],
    sample: [
      { name: "Grains", description: "Rice, wheat and other grains", isActive: "true" },
      { name: "Pulses", description: "Dals and legumes", isActive: "true" },
    ],
  },
  suppliers: {
    label: "Suppliers",
    columns: ["supplierName", "companyName", "phoneNumber", "email", "address", "city", "state", "gstNumber", "openingBalance", "status", "branchName"],
    required: ["supplierName", "phoneNumber"],
    notes: ["status: ACTIVE or INACTIVE", "openingBalance in ₹ (default 0)", "branchName must match existing branch"],
    sample: [
      { supplierName: "Ramesh Traders", companyName: "Ramesh & Co", phoneNumber: "9988776655", email: "ramesh@traders.in", address: "12 Market Rd", city: "Pune", state: "Maharashtra", gstNumber: "27AABCT1234C1Z3", openingBalance: 5000, status: "ACTIVE", branchName: "Head Office - Andheri" },
      { supplierName: "Agro Suppliers", companyName: "Agro India Ltd", phoneNumber: "9977665544", email: "", address: "8 Farm Lane", city: "Nagpur", state: "Maharashtra", gstNumber: "", openingBalance: 0, status: "ACTIVE", branchName: "" },
    ],
  },
  inventory: {
    label: "Inventory / Stock",
    columns: ["productName", "branchName", "adjustmentQty", "reason"],
    required: ["productName", "adjustmentQty"],
    notes: ["adjustmentQty: positive to add stock, negative to reduce", "reason: GRN | ADJUSTMENT | CORRECTION | RETURN"],
    sample: [
      { productName: "Basmati Rice 5kg", branchName: "Head Office - Andheri", adjustmentQty: 50, reason: "GRN" },
      { productName: "Toor Dal 1kg", branchName: "Head Office - Andheri", adjustmentQty: -5, reason: "ADJUSTMENT" },
    ],
  },
  attendance: {
    label: "Attendance",
    columns: ["employeeName", "employeeEmail", "date", "checkIn", "checkOut", "status", "branchName"],
    required: ["employeeEmail", "date", "status"],
    notes: ["date: YYYY-MM-DD", "checkIn / checkOut: HH:MM (24h)", "status: PRESENT | ABSENT | HALF_DAY"],
    sample: [
      { employeeName: "Ravi Kumar", employeeEmail: "ravi@alpha.in", date: "2025-06-01", checkIn: "09:00", checkOut: "18:00", status: "PRESENT", branchName: "Head Office - Andheri" },
      { employeeName: "Priya Shah", employeeEmail: "priya@alpha.in", date: "2025-06-01", checkIn: "", checkOut: "", status: "ABSENT", branchName: "Head Office - Andheri" },
    ],
  },
  reports: {
    label: "Sales / Reports",
    columns: ["date", "productName", "branchName", "quantity", "unitPrice", "totalAmount", "customerName", "paymentMethod"],
    required: ["date", "productName", "quantity"],
    notes: ["date: YYYY-MM-DD", "paymentMethod: CASH | UPI | CARD | CREDIT"],
    sample: [
      { date: "2025-06-01", productName: "Basmati Rice 5kg", branchName: "Head Office - Andheri", quantity: 2, unitPrice: 450, totalAmount: 900, customerName: "Walk-in", paymentMethod: "CASH" },
      { date: "2025-06-01", productName: "Toor Dal 1kg", branchName: "South Branch", quantity: 5, unitPrice: 130, totalAmount: 650, customerName: "Suresh Mehta", paymentMethod: "UPI" },
    ],
  },
};

/* ── Tiny XLSX parser (no external lib needed) ──────────────── */
// We use SheetJS from the CDN if available, otherwise CSV fallback
async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        // Try SheetJS
        if (window.XLSX) {
          const wb = window.XLSX.read(data, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
          resolve(rows);
        } else {
          // CSV fallback
          const text = typeof data === "string" ? data : new TextDecoder().decode(data);
          const lines = text.split("\n").filter(l => l.trim());
          if (lines.length < 2) return reject(new Error("File has no data rows"));
          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
          const rows = lines.slice(1).map(line => {
            const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
            const obj = {};
            headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
            return obj;
          });
          resolve(rows);
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}

/* ── Download template as CSV ───────────────────────────────── */
function downloadTemplate(schema) {
  const header = schema.columns.join(",");
  const rows = schema.sample.map(row =>
    schema.columns.map(col => {
      const v = row[col] ?? "";
      const str = String(v);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template_${schema.label.replace(/\s/g, "_").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Validate parsed rows ───────────────────────────────────── */
function validate(rows, schema) {
  const errors = [];
  rows.forEach((row, idx) => {
    schema.required.forEach(col => {
      if (!row[col] && row[col] !== 0) {
        errors.push(`Row ${idx + 2}: "${col}" is required`);
      }
    });
  });
  return errors;
}

/* ── UI helpers ─────────────────────────────────────────────── */
function Spinner({ size = 16, color = "#fff" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid rgba(255,255,255,.3)`, borderTopColor: color, animation: "spin .7s linear infinite", flexShrink: 0 }} />
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ExcelImport({ entity, onImport, buttonLabel, accent }) {
  const schema = SCHEMAS[entity];
  const fileRef = useRef();
  const [showPanel, setShowPanel] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | "parsing" | "preview" | "importing" | "done" | "error"
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [result, setResult] = useState(null);

  const btn = accent || { color: ac, light: acLight, border: acBorder };

  if (!schema) return null;

  const reset = () => {
    setStatus(null); setRows([]); setErrors([]); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setStatus("error"); setErrors(["Only .xlsx, .xls, or .csv files are supported."]);
      return;
    }
    setStatus("parsing"); setErrors([]);
    try {
      // Inject SheetJS if not present
      if (!window.XLSX && ext !== "csv") {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const parsed = await parseFile(file);
      const errs = validate(parsed, schema);
      setRows(parsed);
      setErrors(errs);
      setStatus("preview");
    } catch (err) {
      setStatus("error"); setErrors([err.message || "Failed to parse file."]);
    }
  };

  const handleImport = async () => {
    setStatus("importing");
    try {
      await onImport(rows);
      setResult({ success: rows.length });
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrors([err.response?.data?.message || err.message || "Import failed."]);
    }
  };

  const colPreview = schema.columns.slice(0, 6);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { reset(); setShowPanel(true); }}
        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "11px", border: `1.5px solid ${btn.border}`, background: btn.light, color: btn.color, fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", transition: "all .15s" }}
        onMouseEnter={e => e.currentTarget.style.background = btn.color + "22"}
        onMouseLeave={e => e.currentTarget.style.background = btn.light}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {buttonLabel || `Import ${schema.label}`}
      </button>

      {/* Panel overlay */}
      {showPanel && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => e.target === e.currentTarget && setShowPanel(false)}
        >
          <div style={{ background: "#fff", borderRadius: "22px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflow: "auto", boxShadow: "0 28px 80px rgba(26,26,46,.22)", animation: "fadeUp .22s ease both" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(26,26,46,.07)", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "10px", background: `linear-gradient(135deg,${btn.color},#6d28d9)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "16px", fontWeight: 800, color: "#1a1a2e" }}>Import {schema.label}</div>
                  <div style={{ fontSize: "11.5px", color: "rgba(26,26,46,.42)", marginTop: "1px" }}>Upload Excel or CSV to bulk import data</div>
                </div>
              </div>
              <button onClick={() => setShowPanel(false)} style={{ width: 28, height: 28, borderRadius: "8px", border: "1px solid rgba(26,26,46,.12)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(26,26,46,.4)" }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ padding: "22px 24px" }}>
              {/* Step 1 – Template download */}
              <div style={{ background: "rgba(26,26,46,.025)", borderRadius: "14px", padding: "16px 18px", marginBottom: "18px", border: "1px solid rgba(26,26,46,.07)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a1a2e", marginBottom: "4px" }}>Step 1 — Download Template</div>
                    <div style={{ fontSize: "11.5px", color: "rgba(26,26,46,.45)", lineHeight: 1.6 }}>
                      Required columns: <span style={{ fontFamily: "'DM Mono',monospace", color: btn.color }}>{schema.required.join(", ")}</span>
                    </div>
                    {schema.notes.map((n, i) => (
                      <div key={i} style={{ fontSize: "11px", color: "rgba(26,26,46,.38)", marginTop: "2px" }}>• {n}</div>
                    ))}
                  </div>
                  <button
                    onClick={() => downloadTemplate(schema)}
                    style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "10px", border: `1.5px solid ${greenBorder}`, background: greenLight, color: green, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", whiteSpace: "nowrap" }}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" /></svg>
                    Download CSV Template
                  </button>
                </div>

                {/* Column chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
                  {schema.columns.map(col => (
                    <span key={col} style={{ padding: "2px 9px", borderRadius: "99px", background: schema.required.includes(col) ? btn.light : "rgba(26,26,46,.05)", border: `1px solid ${schema.required.includes(col) ? btn.border : "rgba(26,26,46,.1)"}`, color: schema.required.includes(col) ? btn.color : "rgba(26,26,46,.45)", fontSize: "10.5px", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
                      {col}{schema.required.includes(col) ? " *" : ""}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 2 – Upload */}
              {(status === null || status === "error") && (
                <div>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a1a2e", marginBottom: "10px" }}>Step 2 — Upload Your File</div>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${dragging ? btn.color : "rgba(26,26,46,.18)"}`, borderRadius: "16px", padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragging ? btn.light : "rgba(26,26,46,.015)", transition: "all .18s" }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: "12px", background: btn.light, border: `1.5px solid ${btn.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={btn.color} strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>Drop your file here</div>
                    <div style={{ fontSize: "12px", color: "rgba(26,26,46,.4)", marginTop: "5px" }}>or click to browse — .xlsx, .xls, .csv supported</div>
                  </div>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                </div>
              )}

              {/* Parsing */}
              {status === "parsing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: "14px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${btn.border}`, borderTopColor: btn.color, animation: "spin .7s linear infinite" }} />
                  <div style={{ fontSize: "13px", color: "rgba(26,26,46,.5)" }}>Parsing file…</div>
                </div>
              )}

              {/* Preview */}
              {status === "preview" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#1a1a2e" }}>
                      Step 3 — Preview <span style={{ color: btn.color }}>{rows.length}</span> rows
                    </div>
                    <button onClick={reset} style={{ fontSize: "11.5px", color: "rgba(26,26,46,.45)", background: "none", border: "none", cursor: "pointer" }}>← Re-upload</button>
                  </div>

                  {errors.length > 0 && (
                    <div style={{ background: redLight, border: `1px solid ${redBorder}`, borderRadius: "11px", padding: "12px 14px", marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: red, marginBottom: "6px" }}>⚠ Validation Issues ({errors.length})</div>
                      {errors.slice(0, 5).map((e, i) => <div key={i} style={{ fontSize: "11.5px", color: red, marginTop: "3px" }}>• {e}</div>)}
                      {errors.length > 5 && <div style={{ fontSize: "11px", color: "rgba(220,38,38,.6)", marginTop: "4px" }}>+{errors.length - 5} more…</div>}
                    </div>
                  )}

                  {/* Table preview */}
                  <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(26,26,46,.08)", marginBottom: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "rgba(26,26,46,.03)" }}>
                          <th style={{ padding: "9px 12px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: "1px solid rgba(26,26,46,.07)" }}>#</th>
                          {colPreview.map(col => (
                            <th key={col} style={{ padding: "9px 12px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", borderBottom: "1px solid rgba(26,26,46,.07)" }}>{col}</th>
                          ))}
                          {schema.columns.length > 6 && <th style={{ padding: "9px 12px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.25)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>+{schema.columns.length - 6} more</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 8).map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid rgba(26,26,46,.042)" }}>
                            <td style={{ padding: "8px 12px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.28)", fontSize: "11px" }}>{idx + 1}</td>
                            {colPreview.map(col => (
                              <td key={col} style={{ padding: "8px 12px", color: "#1a1a2e", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                            {schema.columns.length > 6 && <td style={{ padding: "8px 12px", color: "rgba(26,26,46,.3)", fontSize: "11px" }}>…</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 8 && <div style={{ textAlign: "center", padding: "10px", fontSize: "11px", color: "rgba(26,26,46,.35)", borderTop: "1px solid rgba(26,26,46,.07)" }}>…and {rows.length - 8} more rows</div>}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button onClick={reset} style={{ padding: "10px 20px", borderRadius: "11px", border: "1.5px solid rgba(26,26,46,.14)", background: "transparent", color: "rgba(26,26,46,.6)", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>Cancel</button>
                    <button
                      onClick={handleImport}
                      disabled={errors.length > 0}
                      style={{ padding: "10px 24px", borderRadius: "11px", border: "none", cursor: errors.length > 0 ? "not-allowed" : "pointer", background: errors.length > 0 ? "rgba(26,26,46,.15)" : `linear-gradient(135deg,${btn.color},#6d28d9)`, color: errors.length > 0 ? "rgba(26,26,46,.35)" : "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Poppins',sans-serif", boxShadow: errors.length > 0 ? "none" : `0 4px 16px rgba(124,58,237,.25)` }}
                    >
                      Import {rows.length} {schema.label}
                    </button>
                  </div>
                </div>
              )}

              {/* Importing */}
              {status === "importing" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", gap: "14px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${btn.border}`, borderTopColor: btn.color, animation: "spin .7s linear infinite" }} />
                  <div style={{ fontSize: "13px", color: "rgba(26,26,46,.5)" }}>Importing {rows.length} rows…</div>
                </div>
              )}

              {/* Done */}
              {status === "done" && (
                <div style={{ textAlign: "center", padding: "28px 20px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: greenLight, border: `2px solid ${greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={green} strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "20px", fontWeight: 800, color: "#1a1a2e", marginBottom: "6px" }}>Import Complete!</div>
                  <div style={{ fontSize: "13px", color: "rgba(26,26,46,.5)", marginBottom: "20px" }}>{result?.success} {schema.label.toLowerCase()} imported successfully.</div>
                  <button onClick={() => setShowPanel(false)} style={{ padding: "10px 28px", borderRadius: "11px", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${green},#047857)`, color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>Close</button>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div>
                  <div style={{ background: redLight, border: `1px solid ${redBorder}`, borderRadius: "12px", padding: "16px 18px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: red, marginBottom: "8px" }}>✗ Error</div>
                    {errors.map((e, i) => <div key={i} style={{ fontSize: "12px", color: red, marginTop: "3px" }}>• {e}</div>)}
                  </div>
                  <button onClick={reset} style={{ padding: "9px 20px", borderRadius: "10px", border: `1.5px solid ${btn.border}`, background: btn.light, color: btn.color, fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif" }}>Try Again</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(14px); } to { opacity:1;transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}
