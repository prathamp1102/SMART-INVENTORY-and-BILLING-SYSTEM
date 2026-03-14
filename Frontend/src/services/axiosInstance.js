import axios from "axios";
import { API_BASE } from "../utils/constants";
import { getToken, clearSession } from "../utils/helpers";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — only logout if token is truly invalid/expired
// Don't logout on every 401 (e.g. a route returning 401 for wrong permissions
// should NOT clear the session — that would cause the sidebar logout bug)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = (error.response?.data?.message || "").toLowerCase();
      const isTokenError =
        msg.includes("not authorized") ||
        msg.includes("invalid token") ||
        msg.includes("token expired") ||
        msg.includes("no token") ||
        msg.includes("jwt");

      if (isTokenError) {
        clearSession();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
