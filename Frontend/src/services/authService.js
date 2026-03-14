import axiosInstance from "./axiosInstance";

// ── Login (OTP-based) ────────────────────────────────────────────────────────

/** Step 1: verify credentials → sends OTP to email */
export const loginSendOtpApi = async (email, password) => {
  const { data } = await axiosInstance.post("/auth/login/send-otp", { email, password });
  return data;
};

/** Step 2: verify OTP → returns { token, user } */
export const loginVerifyOtpApi = async (email, otp) => {
  const { data } = await axiosInstance.post("/auth/login/verify-otp", { email, otp });
  return data;
};

// Legacy (kept as fallback — not used by frontend)
export const loginApi = async (email, password) => {
  const { data } = await axiosInstance.post("/auth/login", { email, password });
  return data;
};

// ── Forgot Password (OTP-based) ──────────────────────────────────────────────

export const forgotPasswordSendOtpApi = async (email) => {
  const { data } = await axiosInstance.post("/auth/forgot-password", { email });
  return data;
};

export const forgotPasswordApi = forgotPasswordSendOtpApi;

export const forgotPasswordResetApi = async ({ email, otp, newPassword }) => {
  const { data } = await axiosInstance.post("/auth/forgot-password/reset", { email, otp, newPassword });
  return data;
};

// ── Change Password (OTP-based, authenticated) ───────────────────────────────

export const changePasswordSendOtpApi = async () => {
  const { data } = await axiosInstance.post("/auth/change-password/send-otp");
  return data;
};

export const changePasswordApi = async (payload) => {
  const { data } = await axiosInstance.post("/auth/change-password", payload);
  return data;
};

// ── User management ──────────────────────────────────────────────────────────

export const addUserApi = async (payload) => {
  const { data } = await axiosInstance.post("/auth/add", payload);
  return data;
};

export const getUsersApi = async () => {
  const { data } = await axiosInstance.get("/auth/users");
  return data;
};

export const getUserByIdApi = async (id) => {
  const { data } = await axiosInstance.get(`/auth/users/${id}`);
  return data;
};

export const updateUserApi = async (id, payload) => {
  const { data } = await axiosInstance.put(`/auth/users/${id}`, payload);
  return data;
};

export const updateProfileApi = async (payload) => {
  const { data } = await axiosInstance.put("/auth/profile", payload);
  return data;
};
