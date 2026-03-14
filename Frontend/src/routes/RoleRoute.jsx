import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/**
 * Restricts a route to users with specific roles.
 * Usage: <RoleRoute roles={["SUPER_ADMIN", "ADMIN"]} />
 */
export default function RoleRoute({ roles = [] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
