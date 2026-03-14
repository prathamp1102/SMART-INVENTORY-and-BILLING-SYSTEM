import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS as ISBase, SS, FieldLabel, FormError, FormDivider } from "../../components/forms/FormStyles";
import { getSuppliers, getProducts } from "../../services/productService";
import useAuth from "../../hooks/useAuth";
import axiosInstance from "../../services/axiosInstance";

const B = "#0284c7", BL = "rgba(2,132,199,.08)", BB = "rgba(2,132,199,.2)";
const RD = "#dc2626", RDL = "rgba(239,68,68,.08)", RDB = "rgba(239,68,68,.2)";
const P = "#059669", PL = "rgba(5,150,105,.08)", PB = "rgba(5,150,105,.2)";

const IS = { ...ISBase, height: "42px", marginBottom: "0" };

const emptyItem = () => ({ product: "", productName: "", quantity: 1, unitCost: 0 });

export default function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [form, setForm] = useState({
    supplier: "", expectedDate: "", notes: "", status: "ORDERED", branch: "",
  });
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([getSuppliers(), getProducts()]).then(([s, p]) => {
      setSuppliers(s.filter(x => x.status === "ACTIVE"));
      setProducts(p);
    }).catch(console.error);
  }, []);

  const setF = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); setErrors(p => ({ ...p, [k]: "" })); };

  const addItem = () => setItems(p => [...p, emptyItem()]);
  const removeItem = i => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem = (i, k, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const onProductChange = (i, prodId) => {
    const prod = products.find(p => p._id === prodId);
    setItems(prev => prev.map((it, idx) => idx === i ? {
      ...it, product: prodId, productName: prod?.name || "", unitCost: prod?.costPrice || 0,
    } : it));
  };

  const totals = useMemo(() => {
    const totalAmount = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitCost)), 0);
    return { totalAmount };
  }, [items]);

  const validate = () => {
    const e = {};
    if (!form.supplier) e.supplier = "Supplier is required";
    const badItems = items.some(it => !it.product || it.quantity < 1 || it.unitCost < 0);
    if (badItems) e.items = "All items need a product, quantity ≥ 1 and valid cost";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      await axiosInstance.post("/purchase-orders", {
        supplier: form.supplier,
        items: items.map(it => ({
          product: it.product,
          productName: it.productName,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
        expectedDate: form.expectedDate || undefined,
        notes: form.notes || undefined,
        status: form.status,
      });
      navigate("/suppliers/purchase-orders");
    } catch (err) {
      console.error("PO creation error:", err?.response?.data);
      setApiError(err?.response?.data?.message || "Failed to create purchase order. Check console for details.");
    } finally { setLoading(false); }
  };

  return (
    <PageShell title="Create Purchase Order" subtitle="Place a new order with a supplier">
      <Card style={{ maxWidth: "720px" }}>
        <FormError message={apiError} />
        {errors.items && <div style={{ padding: "10px 14px", borderRadius: "10px", marginBottom: "14px", background: RDL, border: `1px solid ${RDB}`, fontSize: "12px", color: RD, fontFamily: "'DM Mono',monospace" }}>{errors.items}</div>}

        {/* Supplier + Meta */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px", marginBottom: "12px" }}>
          <div>
            <FieldLabel>Supplier *</FieldLabel>
            <select value={form.supplier} onChange={setF("supplier")} style={{ ...SS, height: "42px", marginBottom: 0, borderColor: errors.supplier ? "rgba(239,68,68,.5)" : undefined }}>
              <option value="">— Select Supplier —</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}{s.companyName ? ` (${s.companyName})` : ""}</option>)}
            </select>
            {errors.supplier && <div style={{ color: RD, fontSize: "11px", fontFamily: "'DM Mono',monospace", marginTop: "4px" }}>{errors.supplier}</div>}
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={form.status} onChange={setF("status")} style={{ ...SS, height: "42px", marginBottom: 0 }}>
              {["DRAFT", "ORDERED"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Expected Delivery Date</FieldLabel>
            <input type="date" value={form.expectedDate} onChange={setF("expectedDate")} style={{ ...IS }} />
          </div>
        </div>

        <FormDivider label="Order Items" />

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 110px 90px 24px", gap: "8px", padding: "0 0 4px" }}>
            {["Product", "Qty", "Unit Cost (₹)", "Total", ""].map(h => (
              <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 80px 110px 90px 24px", gap: "8px", alignItems: "center" }}>
              <select value={item.product} onChange={e => onProductChange(i, e.target.value)}
                style={{ ...SS, height: "38px", marginBottom: 0, fontSize: "13px" }}>
                <option value="">— Pick product —</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}{p.barcode ? ` [${p.barcode}]` : ""}</option>)}
              </select>
              <input type="number" min="1" value={item.quantity}
                onChange={e => setItem(i, "quantity", e.target.value)}
                style={{ ...IS, textAlign: "center", paddingLeft: "8px", paddingRight: "8px" }} />
              <input type="number" min="0" step="0.01" value={item.unitCost}
                onChange={e => setItem(i, "unitCost", e.target.value)}
                style={{ ...IS }} />
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: "13px", fontWeight: 700, color: B, textAlign: "right" }}>
                ₹{(Number(item.quantity) * Number(item.unitCost)).toLocaleString("en-IN")}
              </div>
              <button onClick={() => removeItem(i)} disabled={items.length === 1}
                style={{ width: "24px", height: "24px", borderRadius: "6px", border: `1px solid ${RDB}`, background: RDL, color: RD, cursor: items.length === 1 ? "not-allowed" : "pointer", opacity: items.length === 1 ? 0.35 : 1, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
          <button onClick={addItem} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "9px", border: `1.5px dashed ${BB}`, background: BL, color: B, fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Figtree',sans-serif" }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Item
          </button>
        </div>

        {/* Total Summary */}
        <div style={{ background: "linear-gradient(135deg,rgba(2,132,199,.06),rgba(2,132,199,.02))", border: `1px solid ${BB}`, borderRadius: "12px", padding: "14px 18px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: B, letterSpacing: ".12em", textTransform: "uppercase" }}>Order Total</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: "22px", fontWeight: 900, color: "#1a1a2e", marginTop: "2px" }}>₹{totals.totalAmount.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "rgba(26,26,46,.4)", letterSpacing: ".12em", textTransform: "uppercase" }}>Items</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "rgba(26,26,46,.7)" }}>{items.length}</div>
          </div>
        </div>

        <FormDivider label="Notes (Optional)" />
        <textarea value={form.notes} onChange={setF("notes")} placeholder="Any special instructions or notes for this order…"
          style={{ ...ISBase, height: "72px", padding: "10px 12px", resize: "vertical", marginBottom: "16px" }} />

        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="button" onClick={handleSubmit} loading={loading} accent={B} glow="rgba(2,132,199,.25)">Create Purchase Order</Button>
          <Button variant="secondary" onClick={() => navigate("/suppliers/purchase-orders")}>Cancel</Button>
        </div>
      </Card>
    </PageShell>
  );
}
