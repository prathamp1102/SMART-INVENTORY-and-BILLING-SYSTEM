import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import useAuth from "../hooks/useAuth";

// Guards
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Layouts (keep eager — needed immediately)
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";

// Loader fallback
const PageLoader = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#0f172a" }}>
    <div style={{ width:40, height:40, border:"4px solid #334155", borderTop:"4px solid #7c3aed", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// Lazy-loaded pages (prevents chunk cache failures)
const Login               = lazy(() => import("../pages/auth/Login"));
const ForgotPassword      = lazy(() => import("../pages/auth/ForgotPassword"));
const ChangePassword      = lazy(() => import("../pages/auth/ChangePassword"));

const SuperAdminDashboard = lazy(() => import("../pages/dashboard/SuperAdminDashboard"));
const AdminDashboard      = lazy(() => import("../pages/dashboard/AdminDashboard"));
const InventoryDashboard  = lazy(() => import("../pages/dashboard/InventoryDashboard"));
const CashierDashboard    = lazy(() => import("../pages/dashboard/CashierDashboard"));

const UserList            = lazy(() => import("../pages/users/UserList"));
const AddUser             = lazy(() => import("../pages/users/AddUser"));
const EditUser            = lazy(() => import("../pages/users/EditUser"));

const ProductList         = lazy(() => import("../pages/products/ProductList"));
const AddProduct          = lazy(() => import("../pages/products/AddProduct"));
const EditProduct         = lazy(() => import("../pages/products/EditProduct"));

const CategoryList        = lazy(() => import("../pages/categories/CategoryList"));
const AddCategory         = lazy(() => import("../pages/categories/AddCategory"));
const EditCategory        = lazy(() => import("../pages/categories/EditCategory"));

const SupplierList        = lazy(() => import("../pages/suppliers/SupplierList"));
const AddSupplier         = lazy(() => import("../pages/suppliers/AddSupplier"));
const EditSupplier        = lazy(() => import("../pages/suppliers/EditSupplier"));
const PurchaseOrders      = lazy(() => import("../pages/suppliers/PurchaseOrders"));
const CreatePurchaseOrder = lazy(() => import("../pages/suppliers/CreatePurchaseOrder"));
const PurchaseOrderDetail = lazy(() => import("../pages/suppliers/PurchaseOrderDetail"));
const RecordPurchases     = lazy(() => import("../pages/suppliers/RecordPurchases"));
const SupplierPayments    = lazy(() => import("../pages/suppliers/SupplierPayments"));

const StockManagement     = lazy(() => import("../pages/inventory/StockManagement"));
const GRN                 = lazy(() => import("../pages/inventory/GRN"));
const InventoryReports    = lazy(() => import("../pages/inventory/InventoryReports"));

const InvoiceList         = lazy(() => import("../pages/billing/InvoiceList"));
const InvoiceDetails      = lazy(() => import("../pages/billing/InvoiceDetails"));
const Returns             = lazy(() => import("../pages/billing/Returns"));

const SalesReport         = lazy(() => import("../pages/reports/SalesReport"));
const StockReport         = lazy(() => import("../pages/reports/StockReport"));
const ProfitLossReport    = lazy(() => import("../pages/reports/ProfitLossReport"));
const LowStockReport      = lazy(() => import("../pages/reports/LowStockReport"));
const PurchaseReport      = lazy(() => import("../pages/reports/PurchaseReport"));
const Reports             = lazy(() => import("../pages/reports/Reports"));

const OrganizationControl = lazy(() => import("../pages/organization/OrganizationControl"));
const BranchAssignment    = lazy(() => import("../pages/organization/BranchAssignment"));
const DataMigration       = lazy(() => import("../pages/migration/DataMigration"));

const Profile             = lazy(() => import("../pages/common/Profile"));
const Unauthorized        = lazy(() => import("../pages/common/Unauthorized"));
const NotFound            = lazy(() => import("../pages/common/NotFound"));

const SystemSettings      = lazy(() => import("../pages/settings/SystemSettings"));
const SystemMonitoring    = lazy(() => import("../pages/superadmin/SystemMonitoring"));
const ServiceManagement   = lazy(() => import("../pages/superadmin/ServiceManagement"));

const MyAttendance        = lazy(() => import("../pages/attendance/MyAttendance"));
const AttendanceReport    = lazy(() => import("../pages/attendance/AttendanceReport"));
const StaffReports        = lazy(() => import("../pages/staff/StaffReports"));
const StaffLimitedReports = lazy(() => import("../pages/staff/StaffLimitedReports"));
const StaffPerformance    = lazy(() => import("../pages/staff/StaffPerformance"));
const AssignShifts        = lazy(() => import("../pages/staff/AssignShifts"));
const BillingActivity     = lazy(() => import("../pages/staff/BillingActivity"));
const SalesDesk        = lazy(() => import("../pages/staff/SalesDesk"));
const StaffServiceRequests = lazy(() => import("../pages/staff/StaffServiceRequests"));
const ApproveDiscounts    = lazy(() => import("../pages/billing/ApproveDiscounts"));
const AdminServiceManagement = lazy(() => import("../pages/admin/AdminServiceManagement"));

// Customer pages
const CustomerProducts    = lazy(() => import("../pages/customer/CustomerProducts"));
const PlaceOrder          = lazy(() => import("../pages/customer/PlaceOrder"));
const OrderHistory        = lazy(() => import("../pages/customer/OrderHistory"));
const TrackOrder          = lazy(() => import("../pages/customer/TrackOrder"));

// Customer - Service pages
const RegisterWarranty    = lazy(() => import("../pages/customer/RegisterWarranty"));
const ServiceRequest      = lazy(() => import("../pages/customer/ServiceRequest"));
const TrackComplaint      = lazy(() => import("../pages/customer/TrackComplaint"));
const MyReturns           = lazy(() => import("../pages/customer/MyReturns"));

const SA = "SUPER_ADMIN";
const AD = "ADMIN";
const ST = "STAFF";
const CU = "CUSTOMER";

export default function AppRoutes() {
  const { isAuthenticated, homePath } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Root redirect ───────────────────────────────────── */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to={homePath} replace /> : <Navigate to="/login" replace />}
        />

        {/* ── Auth (public) routes ────────────────────────────── */}
        <Route element={<AuthLayout />}>
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* ── Protected routes ────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>

            <Route path="/profile" element={<Profile />} />

            {/* Dashboards */}
            <Route element={<RoleRoute roles={[SA]} />}>
              <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/dashboard/inventory" element={<InventoryDashboard />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD, ST, CU]} />}>
              <Route path="/dashboard/cashier" element={<CashierDashboard />} />
            </Route>

            {/* Users & Org (Super Admin only) */}
            <Route element={<RoleRoute roles={[SA]} />}>
              <Route path="/users"              element={<UserList />} />
              <Route path="/users/add"          element={<AddUser />} />
              <Route path="/users/edit/:id"     element={<EditUser />} />
              <Route path="/organization"       element={<OrganizationControl />} />
              <Route path="/branch-assignment"  element={<BranchAssignment />} />
              <Route path="/settings/system"    element={<SystemSettings />} />
              <Route path="/system-monitoring"  element={<SystemMonitoring />} />
              <Route path="/service/management" element={<ServiceManagement />} />
            </Route>

            {/* Products */}
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/products"           element={<ProductList />} />
              <Route path="/products/add"       element={<AddProduct />} />
              <Route path="/products/edit/:id"  element={<EditProduct />} />
            </Route>

            {/* Categories */}
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/categories"           element={<CategoryList />} />
              <Route path="/categories/add"       element={<AddCategory />} />
              <Route path="/categories/edit/:id"  element={<EditCategory />} />
            </Route>

            {/* Suppliers */}
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/suppliers"                              element={<SupplierList />} />
              <Route path="/suppliers/add"                          element={<AddSupplier />} />
              <Route path="/suppliers/edit/:id"                     element={<EditSupplier />} />
              <Route path="/suppliers/purchase-orders"              element={<PurchaseOrders />} />
              <Route path="/suppliers/purchase-orders/create"       element={<CreatePurchaseOrder />} />
              <Route path="/suppliers/purchase-orders/:id"          element={<PurchaseOrderDetail />} />
              <Route path="/suppliers/record-purchases"             element={<RecordPurchases />} />
              <Route path="/suppliers/payments"                     element={<SupplierPayments />} />
            </Route>

            {/* Inventory */}
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/inventory/stock"   element={<StockManagement />} />
              <Route path="/inventory/grn"     element={<GRN />} />
              <Route path="/inventory/reports" element={<InventoryReports />} />
            </Route>

            {/* Billing */}
            <Route element={<RoleRoute roles={[SA, AD, ST, CU]} />}>
              <Route path="/billing/invoice"     element={<InvoiceList />} />
              <Route path="/billing/invoice/:id" element={<InvoiceDetails />} />
              <Route path="/billing/returns"     element={<Returns />} />
            </Route>

            {/* Customer - Purchase & Orders */}
            <Route element={<RoleRoute roles={[CU]} />}>
              <Route path="/customer/products"           element={<CustomerProducts />} />
              <Route path="/customer/place-order"        element={<PlaceOrder />} />
              <Route path="/customer/order-history"      element={<OrderHistory />} />
              <Route path="/customer/track-order"        element={<TrackOrder />} />
              <Route path="/customer/my-returns"         element={<MyReturns />} />
              {/* Service */}
              <Route path="/customer/register-warranty"  element={<RegisterWarranty />} />
              <Route path="/customer/service-request"    element={<ServiceRequest />} />
              <Route path="/customer/track-complaint"    element={<TrackComplaint />} />
            </Route>

            {/* Reports */}
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/billing/approve-discounts" element={<ApproveDiscounts />} />
              <Route path="/reports"              element={<Reports />} />
              <Route path="/reports/sales"        element={<SalesReport />} />
              <Route path="/reports/stock"        element={<StockReport />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/reports/low-stock"    element={<LowStockReport />} />
              <Route path="/reports/purchase"     element={<PurchaseReport />} />
              <Route path="/reports/profit-loss"  element={<ProfitLossReport />} />
            </Route>

            {/* Attendance */}
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/attendance/my"     element={<MyAttendance />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/attendance/report" element={<AttendanceReport />} />
            </Route>

            {/* Staff Management */}
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/staff/reports"          element={<StaffReports />} />
              <Route path="/staff/my-reports"       element={<StaffLimitedReports />} />
              <Route path="/staff/service-requests" element={<StaffServiceRequests />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD]} />}>
              <Route path="/admin/service-management" element={<AdminServiceManagement />} />
              <Route path="/staff/performance"     element={<StaffPerformance />} />
              <Route path="/staff/shifts"          element={<AssignShifts />} />
              <Route path="/staff/billing-activity" element={<BillingActivity />} />
            </Route>
            <Route element={<RoleRoute roles={[SA, AD, ST]} />}>
              <Route path="/sales/desk" element={<SalesDesk />} />
            </Route>

          </Route>
        </Route>

        {/* Fallback */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*"             element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
