import { createContext, useState, useEffect, useCallback } from "react";
import { loginSendOtpApi, loginVerifyOtpApi } from "../services/authService";
import { checkInApi, checkOutApi } from "../services/attendanceService";
import { saveSession, getToken, getStoredUser, clearSession } from "../utils/helpers";
import { ROLE_HOME } from "../utils/constants";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ─────────────────────────────
  useEffect(() => {
    const storedToken = getToken();
    const storedUser  = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // ── Step 1: verify credentials, send OTP ────────────────
  const loginSendOtp = useCallback(async (email, password, selectedRole) => {
    // This just validates credentials and fires OTP — does NOT set session
    await loginSendOtpApi(email, password);
    // Return nothing — caller handles the OTP step UI
  }, []);

  // ── Step 2: verify OTP, establish session ────────────────
  const loginVerifyOtp = useCallback(async (email, otp, selectedRole, remember = false) => {
    const data = await loginVerifyOtpApi(email, otp);

    // Validate the role the user picked matches their actual role
    if (data.user.role !== selectedRole) {
      throw new Error(
        `This account is registered as "${data.user.role}". Please select the correct role.`
      );
    }

    saveSession(data.token, data.user, remember);
    setToken(data.token);
    setUser(data.user);

    // Auto check-in on login (fire & forget)
    try {
      const { default: axiosInstance } = await import("../services/axiosInstance");
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
      await checkInApi();
    } catch {
      // Silently ignore (e.g., already checked in today)
    }

    return data.user;
  }, []);

  // Keep legacy login method so nothing else breaks
  const login = loginVerifyOtp;

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await checkOutApi(); } catch { }
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // ── Update stored user (after profile edit) ─────────────
  const updateUser = useCallback((updatedFields) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedFields };
      const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (storedToken) {
        const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const isAuthenticated = Boolean(token && user);
  const homePath = user ? ROLE_HOME[user.role] ?? "/" : "/login";

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, homePath, login, loginSendOtp, loginVerifyOtp, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
