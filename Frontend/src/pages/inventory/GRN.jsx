import { useState, useEffect, useCallback } from "react";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS, SS, FieldLabel, FormError } from "../../components/forms/FormStyles";
import axiosInstance from "../../services/axiosInstance";

export default function GRN() {
  const [tab, setTab]             = useState("create");
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [form, setForm] = useState({
    supplier: "", invoiceNo: "", receivedDate: new Date().toISOString().split("T")[0], notes: "",
  });
  const [items, setItems]       = useState([{ product: "", qty: "", costPrice: "" }]);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess]   = useState("");
  const [selectedGRN, setSelectedGRN] = useState(null);

  useEffect(() => {
    axiosInstance.get("/suppliers").then(r => setSuppliers(r.data)).catch(() => {});
    axiosInstance.get("/products").then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const fetchHistory = useCallback(() => {
    setHistoryLoading(true);
    axiosInstance.get("/grn")
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, fetchHistory]);

  const set = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: "" })); };

  const setItem = (i, k, v) => {
    const next = [...items];
    next[i] = { ...next[i], [k]: v };
    if (k === "product") {
      const found = products.find(p => p._id === v);
      if (found) next[i].costPrice = found.costPrice || "";
    }
    setItems(next);
  };

  const addItem    = () => setItems(p => [...p, { product: "", qty: "", costPrice: "" }]);
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i));
  const totalValue = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.costPrice) || 0), 0);

  const resetForm = () => {
    setForm({ supplier: "", invoiceNo: "", receivedDate: new Date().toISOString().split("T")[0], notes: "" });
    setItems([{ product: "", qty: "", costPrice: "" }]);
    setErrors({}); setApiError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const err = {};
    if (!form.supplier) err.supplier = "Supplier is required";
    if (items.some(it => !it.product || !it.qty || Number(it.qty) < 1)) err.items = "All items need a product and valid quantity";
    setErrors(err);
    if (Object.keys(err).length) return;
    setLoading(true); setApiError("");
    try {
      await axiosInstance.post("/grn", {
        supplier:     form.supplier,
        invoiceNo:    form.invoiceNo,
        receivedDate: form.receivedDate,
        notes:        form.notes,
        items: items.map(it => ({ product: it.product, qty: Number(it.qty), costPrice: Number(it.costPrice) || 0 })),
      });
      setSuccess(`GRN recorded successfully! ${items.length} product(s) stock updated.`);
      resetForm();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to record GRN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const supplierName = g => g?.supplier?.companyName || g?.supplier?.supplierName || "—";

  return (
    <PageShell title="Goods Received Note (GRN)" subtitle="Record incoming stock from suppliers">

      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "rgba(26,26,46,.06)", borderRadius: "12px", width: "fit-content", marginBottom: "22px" }}>
        {[["create", "📥 Record GRN"], ["history", "📋 GRN History"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} type="button"
            style={{ padding: "8px 20px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "'Poppins',sans-serif", transition: "all .18s", background: tab === key ? "#fff" : "transparent", color: tab === key ? "#1a1a2e" : "rgba(26,26,46,.45)", boxShadow: tab === key ? "0 1px 6px rgba(26,26,46,.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <form onSubmit={handleSubmit} noValidate>
          {success && <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(5,150,105,.08)", border: "1px solid rgba(5,150,105,.2)", color: "#059669", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>✓ {success}</div>}
          <FormError message={apiError} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%), 1fr))", gap: "16px", marginBottom: "16px" }}>
            <Card>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e", marginBottom: "16px" }}>GRN Details</div>
              <FieldLabel>Supplier *</FieldLabel>
              <select value={form.supplier} onChange={set("supplier")} style={{ ...SS, borderColor: errors.supplier ? "rgba(239,68,68,.5)" : undefined }}>
                <option value="">— Select Supplier —</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.companyName || s.supplierName || s.name}</option>)}
              </select>
              {errors.supplier && <div style={{ color: "#dc2626", fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "-8px", marginBottom: "10px" }}>{errors.supplier}</div>}
              <FieldLabel>Supplier Invoice No.</FieldLabel>
              <input placeholder="e.g. SI-2025-001 (optional)" value={form.invoiceNo} onChange={set("invoiceNo")} style={IS} />
              <FieldLabel>Received Date</FieldLabel>
              <input type="date" value={form.receivedDate} onChange={set("receivedDate")} style={IS} />
              <FieldLabel>Notes</FieldLabel>
              <input placeholder="Any remarks (optional)" value={form.notes} onChange={set("notes")} style={IS} />
            </Card>

            <Card>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e", marginBottom: "14px" }}>Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  ["Supplier",    suppliers.find(s => s._id === form.supplier)?.companyName || suppliers.find(s => s._id === form.supplier)?.supplierName || "—"],
                  ["Total Items", items.filter(it => it.product).length],
                  ["Total Qty",   items.reduce((s, it) => s + (Number(it.qty) || 0), 0)],
                  ["Total Value", `₹${totalValue.toLocaleString("en-IN")}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.07)" }}>
                    <span style={{ fontSize: "12px", color: "rgba(26,26,46,.5)", fontFamily: "'DM Mono',monospace", letterSpacing: ".06em" }}>{k}</span>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "15px", fontWeight: 800, color: "#1a1a2e" }}>Products Received</div>
              <button type="button" onClick={addItem} style={{ padding: "7px 16px", borderRadius: "9px", border: "1.5px solid rgba(5,150,105,.25)", background: "rgba(5,150,105,.08)", color: "#059669", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Poppins',sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "16px", lineHeight: 1 }}>+</span> Add Product
              </button>
            </div>
            {errors.items && <div style={{ color: "#dc2626", fontSize: "11px", fontFamily: "'DM Mono',monospace", marginBottom: "10px" }}>{errors.items}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,3fr) minmax(min(80px,100%), 1fr) minmax(min(80px,100%), 1fr) auto", gap: "10px", marginBottom: "8px" }}>
              {["Product", "Quantity", "Cost Price (₹)", ""].map(h => (
                <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(120px,3fr) minmax(min(80px,100%), 1fr) minmax(min(80px,100%), 1fr) auto", gap: "10px", marginBottom: "8px" }}>
                <select value={it.product} onChange={e => setItem(i, "product", e.target.value)} style={{ ...SS, marginBottom: 0 }}>
                  <option value="">— Select Product —</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="number" placeholder="0" min="1" value={it.qty} onChange={e => setItem(i, "qty", e.target.value)} style={{ ...IS, marginBottom: 0 }} />
                <input type="number" placeholder="0.00" min="0" value={it.costPrice} onChange={e => setItem(i, "costPrice", e.target.value)} style={{ ...IS, marginBottom: 0 }} />
                <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                  style={{ height: "46px", width: "40px", borderRadius: "10px", border: "1.5px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)", color: "#dc2626", cursor: items.length === 1 ? "not-allowed" : "pointer", fontSize: "16px", opacity: items.length === 1 ? 0.4 : 1 }}>✕</button>
              </div>
            ))}
          </Card>

          <div style={{ display: "flex", gap: "10px" }}>
            <Button type="submit" loading={loading} accent="#059669" glow="rgba(5,150,105,.25)">Record GRN</Button>
            <Button variant="secondary" type="button" onClick={resetForm}>Reset</Button>
          </div>
        </form>

      ) : (
        <div>
          {historyLoading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "rgba(26,26,46,.4)", fontSize: "13px" }}>Loading GRN history…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px", background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📦</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "17px", fontWeight: 800, color: "#1a1a2e", marginBottom: "6px" }}>No GRNs yet</div>
              <div style={{ fontSize: "13px", color: "rgba(26,26,46,.45)" }}>Record your first GRN to see history here.</div>
            </div>
          ) : (
            <>
              {selectedGRN && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => setSelectedGRN(null)}>
                  <div style={{ background: "#fff", borderRadius: "20px", padding: "28px", width: "min(600px, 95vw)", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "#059669", fontWeight: 700, marginBottom: "4px" }}>{selectedGRN.grnNumber}</div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>{supplierName(selectedGRN)}</div>
                      </div>
                      <button onClick={() => setSelectedGRN(null)} style={{ background: "rgba(26,26,46,.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px" }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                      {[
                        ["Invoice No.", selectedGRN.invoiceNo || "—"],
                        ["Received Date", new Date(selectedGRN.receivedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
                        ["Total Value", `₹${(selectedGRN.totalValue || 0).toLocaleString("en-IN")}`],
                        ["Created By", selectedGRN.createdBy?.name || "—"],
                      ].map(([k, v]) => (
                        <div key={k} style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.07)" }}>
                          <div style={{ fontSize: "10px", fontFamily: "'DM Mono',monospace", color: "rgba(26,26,46,.4)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "4px" }}>{k}</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {selectedGRN.notes && (
                      <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(26,26,46,.03)", border: "1px solid rgba(26,26,46,.07)", marginBottom: "20px", fontSize: "13px", color: "rgba(26,26,46,.6)" }}>📝 {selectedGRN.notes}</div>
                    )}
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: "14px", fontWeight: 800, color: "#1a1a2e", marginBottom: "12px" }}>Items Received</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(26,26,46,.08)" }}>
                          {["Product", "Qty", "Cost Price", "Total"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedGRN.items || []).map((it, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid rgba(26,26,46,.05)" }}>
                            <td style={{ padding: "10px", fontSize: "13px", fontWeight: 600, color: "#1a1a2e" }}>{it.productName || "—"}</td>
                            <td style={{ padding: "10px", fontSize: "13px", color: "rgba(26,26,46,.7)" }}>{it.qty}</td>
                            <td style={{ padding: "10px", fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "rgba(26,26,46,.6)" }}>₹{(it.costPrice || 0).toLocaleString("en-IN")}</td>
                            <td style={{ padding: "10px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>₹{((it.qty || 0) * (it.costPrice || 0)).toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid rgba(26,26,46,.08)", overflow: "hidden", boxShadow: "0 2px 16px rgba(26,26,46,.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(26,26,46,.03)", borderBottom: "1px solid rgba(26,26,46,.07)" }}>
                      {["GRN No.", "Supplier", "Date", "Items", "Total Value", "Created By"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: "'DM Mono',monospace", fontSize: "9.5px", color: "rgba(26,26,46,.35)", letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((g, i) => (
                      <tr key={g._id}
                        style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(26,26,46,.05)" : "none", cursor: "pointer" }}
                        onClick={() => setSelectedGRN(g)}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(26,26,46,.02)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "14px 16px", fontFamily: "'DM Mono',monospace", fontSize: "12px", fontWeight: 600, color: "#059669" }}>{g.grnNumber}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13.5px", fontWeight: 600, color: "#1a1a2e" }}>{supplierName(g)}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(26,26,46,.55)" }}>{new Date(g.receivedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(26,26,46,.7)" }}>{g.items?.length || 0} products</td>
                        <td style={{ padding: "14px 16px", fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: 700, color: "#1a1a2e" }}>₹{(g.totalValue || 0).toLocaleString("en-IN")}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(26,26,46,.5)" }}>{g.createdBy?.name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}
