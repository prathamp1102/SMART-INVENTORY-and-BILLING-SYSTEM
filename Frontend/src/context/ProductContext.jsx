import { createContext, useState, useCallback } from "react";
import { getProducts, getCategories, getSuppliers } from "../services/productService";

export const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProducts = useCallback(async (params) => {
    setLoadingProducts(true);
    try {
      const data = await getProducts(params);
      setProducts(data);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    const data = await getCategories();
    setCategories(data);
  }, []);

  const fetchSuppliers = useCallback(async () => {
    const data = await getSuppliers();
    setSuppliers(data);
  }, []);

  return (
    <ProductContext.Provider value={{
      products, categories, suppliers, loadingProducts,
      fetchProducts, fetchCategories, fetchSuppliers,
      setProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}
