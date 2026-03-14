// API - reads from env (falls back to localhost for dev)
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

// Roles (must match backend enum exactly)
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
};

// Role display config: colors, icons, labels
export const ROLE_CONFIG = {
  SUPER_ADMIN: {
    key: "SUPER_ADMIN",
    name: "Super Admin",
    level: "Level 01",
    workspace: "Super Admin workspace",
    email: "superadmin@demo.com",
    desc: "Full system access. Manage all users, settings and configurations.",
    accent: "#7c3aed", btnFrom: "#7c3aed", btnTo: "#6d28d9",
    blob1: "rgba(124,58,237,.28)", blob2: "rgba(109,40,217,.18)",
    glow: "rgba(124,58,237,.38)", light: "rgba(124,58,237,.14)",
    border: "rgba(124,58,237,.6)", halo: "rgba(124,58,237,.35)",
    iconPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  ADMIN: {
    key: "ADMIN",
    name: "Admin",
    level: "Level 02",
    workspace: "Admin workspace",
    email: "admin@demo.com",
    desc: "Manage operations, reports and team-level configurations.",
    accent: "#0284c7", btnFrom: "#0284c7", btnTo: "#0369a1",
    blob1: "rgba(2,132,199,.28)", blob2: "rgba(3,105,161,.16)",
    glow: "rgba(2,132,199,.38)", light: "rgba(2,132,199,.14)",
    border: "rgba(2,132,199,.6)", halo: "rgba(2,132,199,.35)",
    iconPath: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4c1.4 0 2.8 1.1 2.8 2.5v1c.6.5 1.2 1.4 1.2 2.5H8c0-1.1.5-2 1.2-2.5v-1C9.2 6.1 10.6 5 12 5z",
  },
  STAFF: {
    key: "STAFF",
    name: "Staff",
    level: "Level 03",
    workspace: "Staff workspace",
    email: "staff@demo.com",
    desc: "Track stock, manage products and handle warehouse operations.",
    accent: "#059669", btnFrom: "#059669", btnTo: "#047857",
    blob1: "rgba(5,150,105,.28)", blob2: "rgba(4,120,87,.16)",
    glow: "rgba(5,150,105,.38)", light: "rgba(5,150,105,.14)",
    border: "rgba(5,150,105,.6)", halo: "rgba(5,150,105,.35)",
    iconPath: "M20 2H4v2l8 4 8-4V2zM4 8v12h4v-7h8v7h4V8L12 12 4 8z",
  },
  CUSTOMER: {
    key: "CUSTOMER",
    name: "Customer",
    level: "Level 04",
    workspace: "Customer workspace",
    email: "customer@demo.com",
    desc: "View orders, track deliveries and manage your account.",
    accent: "#b45309", btnFrom: "#b45309", btnTo: "#92400e",
    blob1: "rgba(180,83,9,.28)", blob2: "rgba(146,64,14,.16)",
    glow: "rgba(180,83,9,.35)", light: "rgba(180,83,9,.14)",
    border: "rgba(180,83,9,.6)", halo: "rgba(180,83,9,.35)",
    iconPath: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z",
  },
};

// Dashboard routes per role
export const ROLE_HOME = {
  SUPER_ADMIN: "/dashboard/superadmin",
  ADMIN: "/dashboard/admin",
  STAFF: "/dashboard/inventory",
  CUSTOMER: "/dashboard/cashier",
};

// Nav items per role (with icon SVG paths)
// Icons: Phosphor Icons style — bold, expressive, distinct per function
export const ROLE_NAV = {
  SUPER_ADMIN: [
    // Dashboard — speedometer / gauge
    { label: "Dashboard",  path: "/dashboard/superadmin", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" },
    // Organization — office building
    { label: "Organization",path: "/organization",         icon: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z" },
    // Branch Assignment — account tree / hierarchy
    { label: "Branch Assignment", path: "/branch-assignment", icon: "M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z" },
    // Users — group of people
    { label: "Users",      path: "/users",                icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
    // Products — cube / package
    { label: "Products",   path: "/products",             icon: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" },
    // Categories — apps grid
    { label: "Categories", path: "/categories",           icon: "M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" },
    // Suppliers — local shipping / truck
    { label: "Suppliers",  path: "/suppliers",            icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
    // Purchase Orders — clipboard list
    { label: "Purchase Orders", path: "/suppliers/purchase-orders", icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    // Record Purchases — add shopping cart
    { label: "Record Purchases", path: "/suppliers/record-purchases", icon: "M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z" },
    // Supplier Payments — payments / wallet
    { label: "Supplier Payments", path: "/suppliers/payments", icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" },
    // Inventory — inventory / warehouse
    { label: "Inventory",  path: "/inventory/stock",      icon: "M20 2H4v2l8 4 8-4V2zM4 8v12h4v-7h8v7h4V8L12 12 4 8z" },
    // Reports — bar chart
    { label: "Reports",    path: "/reports",              icon: "M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" },
    // Attendance — calendar check
    { label: "Attendance", path: "/attendance/report",    icon: "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13zm-9.5-4.5l5.77-5.77-1.06-1.06-4.71 4.71-1.97-1.97-1.06 1.06 3.03 3.03z" },
    // System Settings — tune / sliders
    { label: "System Settings", path: "/settings/system", icon: "M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" },
    // System Monitoring — monitor / screen
    { label: "System Monitoring", path: "/system-monitoring", icon: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v1H7v2h10v-2h-1v-1h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM8 15l1.5-3 2 2.5 2.5-5L17 15H8z" },
    // Service Management — build / wrench
    { label: "Service Management", path: "/service/management", icon: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" },
  ],
  ADMIN: [
    // Dashboard — speedometer
    { label: "Dashboard",  path: "/dashboard/admin",      icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" },
    // Products — cube package
    { label: "Products",   path: "/products",             icon: "M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" },
    // Categories — apps grid
    { label: "Categories", path: "/categories",           icon: "M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" },
    // Suppliers — truck
    { label: "Suppliers",  path: "/suppliers",            icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
    // Purchase Orders — clipboard list
    { label: "Purchase Orders", path: "/suppliers/purchase-orders", icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    // Record Purchases — add cart
    { label: "Record Purchases", path: "/suppliers/record-purchases", icon: "M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z" },
    // Supplier Payments — credit card
    { label: "Supplier Payments", path: "/suppliers/payments", icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" },
    // Inventory — warehouse
    { label: "Inventory",  path: "/inventory/stock",      icon: "M20 2H4v2l8 4 8-4V2zM4 8v12h4v-7h8v7h4V8L12 12 4 8z" },
    // Reports — bar chart
    { label: "Reports",    path: "/reports",              icon: "M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" },
    // Invoices — receipt
    { label: "Invoices",   path: "/billing/invoice",      icon: "M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z" },
    // Returns — undo / return arrow
    { label: "Returns",    path: "/billing/returns",      icon: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" },
    // Approve Discounts — local offer / tag
    { label: "Approve Discounts", path: "/billing/approve-discounts", icon: "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" },
    // Attendance — calendar check
    { label: "Attendance", path: "/attendance/report",    icon: "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13zm-9.5-4.5l5.77-5.77-1.06-1.06-4.71 4.71-1.97-1.97-1.06 1.06 3.03 3.03z" },
    // Staff Performance — trending up
    { label: "Staff Performance",  path: "/staff/performance",     icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" },
    // Assign Shifts — event note
    { label: "Assign Shifts",      path: "/staff/shifts",          icon: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" },
    // Billing Activity — receipt long
    { label: "Billing Activity",   path: "/staff/billing-activity", icon: "M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5zm-1.5 15H6V5h12v13.5zM8 15h8v2H8zm0-4h8v2H8zm0-4h8v2H8z" },
    // Service Management — build wrench
    { label: "Service Management", path: "/admin/service-management", icon: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" },
  ],
  STAFF: [
    // Dashboard — speedometer
    { label: "Dashboard",      path: "/dashboard/inventory",  icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" },
    // Stock — inventory warehouse
    { label: "Stock",          path: "/inventory/stock",      icon: "M20 2H4v2l8 4 8-4V2zM4 8v12h4v-7h8v7h4V8L12 12 4 8z" },
    // GRN — move to inbox / receiving
    { label: "GRN",            path: "/inventory/grn",        icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3l5 5h-3v4h-4v-4H7l5-5z" },
    // Sales Desk — point of sale
    { label: "Sales Desk",     path: "/sales/desk",           icon: "M17 2H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM3 22h18v-2H3v2zm2-4h14c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2z" },
    // Invoices — receipt
    { label: "Invoices",       path: "/billing/invoice",      icon: "M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z" },
    // Returns — undo arrow
    { label: "Returns",        path: "/billing/returns",      icon: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" },
    // Reports — assessment chart
    { label: "Reports",        path: "/staff/reports",        icon: "M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" },
    // My Reports — person chart
    { label: "My Reports",     path: "/staff/my-reports",     icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    // Attendance — calendar check
    { label: "Attendance",     path: "/attendance/my",        icon: "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13zm-9.5-4.5l5.77-5.77-1.06-1.06-4.71 4.71-1.97-1.97-1.06 1.06 3.03 3.03z" },
    // Service Requests — build wrench
    { label: "Service Requests", path: "/staff/service-requests", icon: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" },
  ],
  CUSTOMER: [
    // Dashboard — home
    { label: "Dashboard",     path: "/dashboard/cashier",      icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" },
    // Products — storefront / shop
    { label: "Products",      path: "/customer/products",      icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 7z" },
    // Place Order — add shopping cart
    { label: "Place Order",   path: "/customer/place-order",   icon: "M11 9h2V6h3V4h-3V1h-2v3H8v2h3v3zm-4 9c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zm-9.83-3.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.13 0-.25-.11-.25-.25z" },
    // Order History — history clock
    { label: "Order History", path: "/customer/order-history", icon: "M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" },
    // Track Order — location pin
    { label: "Track Order",   path: "/customer/track-order",   icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
    // Invoices — receipt
    { label: "Invoices",      path: "/billing/invoice",        icon: "M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z" },
    // My Returns — assignment return
    { label: "My Returns",    path: "/customer/my-returns",    icon: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" },
    // Register Warranty — verified shield
    { label: "Register Warranty",   path: "/customer/register-warranty",  icon: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 7z" },
    // Service Request — wrench/build (matches staff service icon)
    { label: "Service Request",     path: "/customer/service-request",    icon: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" },
    // Track Complaint — find in page / search
    { label: "Track Complaint",     path: "/customer/track-complaint",    icon: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" },
  ],
};

// Token storage keys
export const TOKEN_KEY = "sm_token";
export const USER_KEY = "sm_user";