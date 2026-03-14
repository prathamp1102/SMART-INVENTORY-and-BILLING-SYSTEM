import useAuth from "./useAuth";
import { ROLES } from "../utils/constants";

export default function useRole() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    role,
    isSuperAdmin: role === ROLES.SUPER_ADMIN,
    isAdmin:      role === ROLES.ADMIN,
    isStaff:      role === ROLES.STAFF,
    isCustomer:   role === ROLES.CUSTOMER,
    hasRole: (...roles) => roles.includes(role),
  };
}
