// ── Core validators ────────────────────────────────────────────────────────

export const validateEmail = (v) => {
  if (!v?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email address";
  return "";
};

export const validatePassword = (v) => {
  if (!v) return "Password is required";
  if (v.length < 6) return "Minimum 6 characters";
  return "";
};

export const validateStrongPassword = (v) => {
  if (!v) return "Password is required";
  if (v.length < 8) return "Minimum 8 characters";
  if (!/[A-Z]/.test(v)) return "Must contain at least one uppercase letter";
  if (!/[0-9]/.test(v)) return "Must contain at least one number";
  return "";
};

export const validateRequired = (v, label = "This field") => {
  if (!v?.toString().trim()) return `${label} is required`;
  return "";
};

export const validatePhone = (v) => {
  if (!v?.trim()) return "Phone number is required";
  if (!/^[6-9]\d{9}$/.test(v.trim())) return "Enter a valid 10-digit Indian mobile number";
  return "";
};

export const validatePositiveNumber = (v, label = "Value") => {
  if (v === "" || v === undefined || v === null) return `${label} is required`;
  if (isNaN(v) || Number(v) <= 0) return `${label} must be a positive number`;
  return "";
};

export const validateNonNegativeNumber = (v, label = "Value") => {
  if (v === "" || v === undefined || v === null) return `${label} is required`;
  if (isNaN(v) || Number(v) < 0) return `${label} cannot be negative`;
  return "";
};

export const validateGST = (v) => {
  if (!v?.trim()) return ""; // optional
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.trim().toUpperCase()))
    return "Enter a valid 15-character GST number (e.g. 27AAPFU0939F1ZV)";
  return "";
};

export const validateIFSC = (v) => {
  if (!v?.trim()) return ""; // optional
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.trim().toUpperCase()))
    return "Enter a valid IFSC code (e.g. SBIN0001234)";
  return "";
};

export const validateOTP = (v) => {
  if (!v || v.length !== 6) return "Enter the 6-digit OTP";
  return "";
};

export const validateConfirmPassword = (pw, confirm) => {
  if (!confirm) return "Please confirm your password";
  if (pw !== confirm) return "Passwords do not match";
  return "";
};

export const validateMinLength = (v, min, label = "This field") => {
  if (!v?.trim()) return `${label} is required`;
  if (v.trim().length < min) return `${label} must be at least ${min} characters`;
  return "";
};

export const validateDate = (v, label = "Date") => {
  if (!v) return `${label} is required`;
  return "";
};

export const validateSelect = (v, label = "Please select an option") => {
  if (!v) return label;
  return "";
};
