import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";

const ac = "#b45309";
const acLight = "rgba(180,83,9,.08)";
const acBorder = "rgba(180,83,9,.2)";

const CART_KEY = "customer_cart";

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
}

function ProductCard({ product, onAddToCart, currency }) {
  const inStock = (product.stock ?? product.quantity ?? 0) > 0;
  return (
    <div style={{
      background: "#fff", borderRadius: "16px", border: "1px solid rgba(26,26,46,.08)",
      overflow: "hidden", transition: "all .22s", cursor: "default",
      boxShadow: "0 2px 12px rgba(26,26,46,.05)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(26,26,46,.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(26,26,46,.05)"; }}
    >
      {/* Image / Icon */}
      <div style={{ height: "140px", background: acLight, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="1.4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a2e", lineHeight: 1.3 }}>{product.name}</div>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "99px", flexShrink: 0, background: inStock ? "rgba(5,150,105,.1)" : "rgba(239,68,68,.1)", color: inStock ? "#059669" : "#dc2626" }}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
        {product.category?.name && (
          <div style={{ fontSize: "11px", color: ac, fontFamily: "'DM Mono',monospace", marginBottom: "6px", letterSpacing: ".04em" }}>{product.category.name}</div>
        )}
        {product.barcode && (
          <div style={{ fontSize: "11px", color: "rgba(26,26,46,.4)", marginBottom: "8px" }}>SKU: {product.barcode}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: ac, fontFamily: "'Poppins',sans-serif" }}>
            {currency}{Number(product.price || product.sellingPrice || 0).toLocaleString()}
          </div>
          <button
            onClick={() => inStock && onAddToCart(product)}
            disabled={!inStock}
            style={{
              padding: "7px 14px", borderRadius: "9px", border: "none", fontSize: "12px", fontWeight: 700,
              cursor: inStock ? "pointer" : "not-allowed", transition: "all .18s",
              background: inStock ? `linear-gradient(135deg,${ac},#92400e)` : "rgba(26,26,46,.08)",
              color: inStock ? "#fff" : "rgba(26,26,46,.3)",
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [cart, setCart] = useState(() => loadCart());
  const [showCart, setShowCart] = useState(false);
  const [qty, setQty] = useState({});
  const currency = "₹";

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/products"),
      axiosInstance.get("/categories"),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data || []);
      setCategories(cRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === "all" || p.category?._id === selectedCat || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const updateQty = (id, val) => {
    const n = parseInt(val);
    if (!n || n < 1) return;
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: n } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price || i.sellingPrice || 0) * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const placeOrder = () => {
    if (!cart.length) return;
    navigate("/customer/place-order");
  };

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Product Catalog</h1>
          <p style={{ color: "rgba(26,26,46,.5)", fontSize: "13.5px", marginTop: "5px" }}>Browse and add products to your cart</p>
        </div>
        {/* Cart Button */}
        <button onClick={() => setShowCart(true)} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
          borderRadius: "12px", border: `1.5px solid ${acBorder}`, background: acLight,
          cursor: "pointer", fontSize: "14px", fontWeight: 700, color: ac, position: "relative"
        }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={ac} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          Cart
          {cartCount > 0 && (
            <span style={{ position: "absolute", top: "-8px", right: "-8px", background: ac, color: "#fff", borderRadius: "99px", fontSize: "11px", fontWeight: 800, padding: "1px 7px" }}>{cartCount}</span>
          )}
        </button>
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.3)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ width: "100%", paddingLeft: "38px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "14px", outline: "none", background: "#fff", boxSizing: "border-box" }} />
        </div>
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "12px", border: "1.5px solid rgba(26,26,46,.1)", fontSize: "14px", background: "#fff", cursor: "pointer", outline: "none", minWidth: "160px" }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.4)" }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "rgba(26,26,46,.4)" }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.2)" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25" />
          </svg>
          <p>No products found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: "16px" }}>
          {filtered.map(p => <ProductCard key={p._id} product={p} onAddToCart={addToCart} currency={currency} />)}
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <>
          <div onClick={() => setShowCart(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,.45)", zIndex: 400 }} />
          <div style={{ position: "fixed", top: 0, right: 0, width: "380px", maxWidth: "95vw", height: "100vh", background: "#fff", zIndex: 401, boxShadow: "-8px 0 40px rgba(26,26,46,.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(26,26,46,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1a1a2e" }}>Your Cart ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(26,26,46,.5)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(26,26,46,.4)" }}>Cart is empty</div>
              ) : cart.map(item => (
                <div key={item._id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(26,26,46,.06)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1a1a2e" }}>{item.name}</div>
                    <div style={{ fontSize: "12px", color: ac, fontWeight: 700 }}>{currency}{Number(item.price || item.sellingPrice || 0).toLocaleString()} each</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button onClick={() => updateQty(item._id, item.qty - 1)} disabled={item.qty <= 1}
                      style={{ width: "26px", height: "26px", borderRadius: "7px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#1a1a2e" }}>−</button>
                    <span style={{ fontSize: "14px", fontWeight: 700, minWidth: "24px", textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item._id, item.qty + 1)}
                      style={{ width: "26px", height: "26px", borderRadius: "7px", border: "1.5px solid rgba(26,26,46,.12)", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#1a1a2e" }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#dc2626" }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "20px", borderTop: "1px solid rgba(26,26,46,.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#1a1a2e" }}>Total</span>
                  <span style={{ fontSize: "18px", fontWeight: 800, color: ac }}>{currency}{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={placeOrder} style={{
                  width: "100%", padding: "14px", borderRadius: "12px", border: "none", fontSize: "15px", fontWeight: 800,
                  background: `linear-gradient(135deg,${ac},#92400e)`, color: "#fff", cursor: "pointer"
                }}>
                  Place Order →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
