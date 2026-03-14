import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { BillingProvider } from "./context/BillingContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <BillingProvider>
            <AppRoutes />
          </BillingProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
