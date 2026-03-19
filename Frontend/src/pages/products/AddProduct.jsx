import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import { IS, SS, TS, FormError, FieldLabel, FormDivider } from "../../components/forms/FormStyles";
import { validateRequired, validatePositiveNumber } from "../../utils/validators";
import { createProduct } from "../../services/productService";
import { ProductContext } from "../../context/ProductContext";
import BulkImport from "../../components/products/BulkImport";

export default function AddProduct() {
  const navigate = useNavigate();
  const { categories, suppliers, fetchCategories, fetchSuppliers } = useContext(ProductContext);

  const [tab, setTab]   = useState("manual");
  const [form, setForm] = useState({ name:"", price:"", costPrice:"", stock:"0", barcode:"", category:"", supplier:"", description:"" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => { fetchCategories(); fetchSuppliers(); }, []);

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
    setApiError("");
  };

  const validate = () => {
    const e = {
      name:      validateRequired(form.name, "Product name"),
      price:     validatePositiveNumber(form.price, "Selling price"),
      costPrice: validatePositiveNumber(form.costPrice, "Cost price"),
      category:  validateRequired(form.category, "Category"),
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setApiError("");
    try {
      await createProduct({
        name:        form.name.trim(),
        price:       Number(form.price),
        costPrice:   Number(form.costPrice),
        stock:       Number(form.stock) || 0,
        barcode:     form.barcode.trim() || undefined,
        category:    form.category,
        supplier:    form.supplier || undefined,
        description: form.description.trim(),
      });
      navigate("/products");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to create product.");
    } finally { setLoading(false); }
  };

  return (
    <PageShell title="Add Product" subtitle="Add a single product or import many via Excel">

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:"4px", padding:"4px", background:"rgba(26,26,46,.06)", borderRadius:"12px", width:"fit-content", marginBottom:"24px" }}>
        {[["manual","✏️ Manual Entry"],["bulk","📊 Bulk Import (Excel/CSV)"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} type="button"
            style={{ padding:"8px 20px", borderRadius:"9px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600, fontFamily:"'Figtree',sans-serif", transition:"all .18s",
              background: tab === key ? "#fff" : "transparent",
              color: tab === key ? "#1a1a2e" : "rgba(26,26,46,.45)",
              boxShadow: tab === key ? "0 1px 6px rgba(26,26,46,.1)" : "none",
            }}>{label}
          </button>
        ))}
      </div>

      {tab === "manual" ? (
        <Card style={{ maxWidth: "min(560px, 100%)" }}>
          <FormError message={apiError} />
          <form onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <FieldLabel>Product Name *</FieldLabel>
            <input placeholder="e.g. Wireless Mouse" value={form.name} onChange={set("name")}
              style={{ ...IS, borderColor: errors.name ? "rgba(239,68,68,.5)" : undefined }} />
            {errors.name && <ErrMsg>{errors.name}</ErrMsg>}

            {/* Pricing */}
            <FormDivider label="Pricing" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
              <div>
                <FieldLabel>Cost Price (₹) *</FieldLabel>
                <input placeholder="0.00" value={form.costPrice} onChange={set("costPrice")} type="number" min="0" step="0.01"
                  style={{ ...IS, borderColor: errors.costPrice ? "rgba(239,68,68,.5)" : undefined }} />
                {errors.costPrice && <ErrMsg>{errors.costPrice}</ErrMsg>}
              </div>
              <div>
                <FieldLabel>Selling Price (₹) *</FieldLabel>
                <input placeholder="0.00" value={form.price} onChange={set("price")} type="number" min="0" step="0.01"
                  style={{ ...IS, borderColor: errors.price ? "rgba(239,68,68,.5)" : undefined }} />
                {errors.price && <ErrMsg>{errors.price}</ErrMsg>}
              </div>
            </div>

            {/* Profit preview */}
           {form.price && form.costPrice && Number(form.price) > 0 && (() => {
              const price = Number(form.price);
              const costPrice = Number(form.costPrice);

              const profit = price - costPrice;

              const profitPercentage = costPrice > 0
                ? ((profit / costPrice) * 100).toFixed(1)
                : 0;

              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: "rgba(2,132,199,.06)",
                    border: "1px solid rgba(2,132,199,.15)",
                    marginBottom: "12px",
                    fontSize: "12px",
                    fontFamily: "'DM Mono', monospace"
                  }}
                >
                  <span style={{ color: "rgba(26,26,46,.5)" }}>
                    Profit
                  </span>

                  <span style={{ color: "#0284c7", fontWeight: 600 }}>
                    ₹{profit.toFixed(2)}
                  </span>

                  <span style={{ color: "rgba(26,26,46,.5)" }}>
                    Profit %
                  </span>

                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    {profitPercentage}%
                  </span>
                </div>
              );
            })()}

            {/* Inventory */}
            <FormDivider label="Inventory" />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
              <div>
                <FieldLabel>Initial Stock Qty</FieldLabel>
                <input placeholder="0" value={form.stock} onChange={set("stock")} type="number" min="0" style={IS} />
              </div>
              <div>
                <FieldLabel>Barcode / SKU</FieldLabel>
                <input placeholder="Optional" value={form.barcode} onChange={set("barcode")} style={IS} />
              </div>
            </div>

            {/* Classification */}
            <FormDivider label="Classification" />
            <FieldLabel>Category *</FieldLabel>
            <select value={form.category} onChange={set("category")}
              style={{ ...SS, borderColor: errors.category ? "rgba(239,68,68,.5)" : undefined }}>
              <option value="">— Select Category —</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.category && <ErrMsg>{errors.category}</ErrMsg>}

            <FieldLabel>Supplier</FieldLabel>
            <select value={form.supplier} onChange={set("supplier")} style={SS}>
              <option value="">— Select Supplier (optional) —</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
            </select>

            <FieldLabel>Description</FieldLabel>
            <textarea placeholder="Optional product description…" value={form.description} onChange={set("description")} style={TS} />

            <div style={{ display:"flex", gap:"10px", marginTop:"6px" }}>
              <Button type="submit" loading={loading} accent="#0284c7" glow="rgba(2,132,199,.25)">Add Product</Button>
              <Button variant="secondary" onClick={() => navigate("/products")}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : (
        <BulkImport categories={categories} suppliers={suppliers} onSuccess={() => navigate("/products")} onCancel={() => setTab("manual")} />
      )}
    </PageShell>
  );
}

function ErrMsg({ children }) {
  return <div style={{ color:"#dc2626", fontSize:"11px", fontFamily:"'DM Mono',monospace", marginTop:"-8px", marginBottom:"10px" }}>{children}</div>;
}
