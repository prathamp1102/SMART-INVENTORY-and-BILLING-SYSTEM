import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell, Card } from "../../components/ui/PageShell";
import Button from "../../components/ui/Button";
import Loader from "../../components/ui/Loader";
import { IS, SS, TS, FormError, FieldLabel, FormDivider } from "../../components/forms/FormStyles";
import { validateRequired, validatePositiveNumber } from "../../utils/validators";
import { getProductById, updateProduct } from "../../services/productService";
import { ProductContext } from "../../context/ProductContext";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, suppliers, fetchCategories, fetchSuppliers } = useContext(ProductContext);

  const [form, setForm]     = useState({ name:"", price:"", costPrice:"", stock:"", barcode:"", category:"", supplier:"", description:"", isActive:true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    setErrors(p => ({ ...p, [k]: "" }));
    setApiError("");
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    getProductById(id)
      .then(d => setForm({
        name:        d.name || "",
        price:       d.price ?? "",
        costPrice:   d.costPrice ?? "",
        stock:       d.stock ?? "",
        barcode:     d.barcode || "",
        category:    d.category?._id || d.category || "",
        supplier:    d.supplier?._id || d.supplier || "",
        description: d.description || "",
        isActive:    d.isActive ?? true,
      }))
      .catch(() => setApiError("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

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
    setSaving(true); setApiError("");
    try {
      await updateProduct(id, {
        name:        form.name.trim(),
        price:       Number(form.price),
        costPrice:   Number(form.costPrice),
        stock:       Number(form.stock),
        barcode:     form.barcode.trim() || undefined,
        category:    form.category,
        supplier:    form.supplier || undefined,
        description: form.description.trim(),
        isActive:    form.isActive,
      });
      navigate("/products");
    } catch (err) {
      setApiError(err?.response?.data?.message || "Failed to update product.");
    } finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <PageShell title="Edit Product" subtitle={"Editing: " + form.name}>
      <Card style={{ maxWidth: "min(560px, 100%)" }}>
        <FormError message={apiError} />
        <form onSubmit={handleSubmit} noValidate>

          <FieldLabel>Product Name *</FieldLabel>
          <input placeholder="Product name" value={form.name} onChange={set("name")}
            style={{ ...IS, borderColor: errors.name ? "rgba(239,68,68,.5)" : undefined }} />
          {errors.name && <ErrMsg>{errors.name}</ErrMsg>}

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

          <FormDivider label="Inventory" />
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(200px,100%), 1fr))", gap:"12px" }}>
            <div>
              <FieldLabel>Stock Qty</FieldLabel>
              <input placeholder="0" value={form.stock} onChange={set("stock")} type="number" min="0" style={IS} />
            </div>
            <div>
              <FieldLabel>Barcode / SKU</FieldLabel>
              <input placeholder="Optional" value={form.barcode} onChange={set("barcode")} style={IS} />
            </div>
          </div>

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
          <textarea placeholder="Optional description…" value={form.description} onChange={set("description")} style={TS} />

          {/* Active toggle */}
          <div style={{ marginBottom:"18px" }}>
            <FieldLabel>Status</FieldLabel>
            <div onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", userSelect:"none" }}>
              <div style={{ width:"40px", height:"22px", borderRadius:"99px", background: form.isActive ? "#0284c7" : "rgba(26,26,46,.18)", position:"relative", transition:"background .2s", boxShadow: form.isActive ? "0 0 0 3px rgba(2,132,199,.15)" : "none" }}>
                <div style={{ position:"absolute", top:"3px", left: form.isActive ? "21px" : "3px", width:"16px", height:"16px", borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transition:"left .2s" }} />
              </div>
              <span style={{ fontSize:"13.5px", color: form.isActive ? "#1a1a2e" : "rgba(26,26,46,.4)", fontWeight:500 }}>
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div style={{ display:"flex", gap:"10px" }}>
            <Button type="submit" loading={saving} accent="#0284c7" glow="rgba(2,132,199,.25)">Save Changes</Button>
            <Button variant="secondary" onClick={() => navigate("/products")}>Cancel</Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}

function ErrMsg({ children }) {
  return <div style={{ color:"#dc2626", fontSize:"11px", fontFamily:"'DM Mono',monospace", marginTop:"-8px", marginBottom:"10px" }}>{children}</div>;
}
