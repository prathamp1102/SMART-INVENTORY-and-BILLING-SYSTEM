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

export const validateRequired = (v, label = "This field") => {
  if (!v?.toString().trim()) return `${label} is required`;
  return "";
};

export const validatePhone = (v) => {
  if (!v?.trim()) return "Phone is required";
  if (!/^[6-9]\d{9}$/.test(v.trim())) return "Enter a valid 10-digit phone number";
  return "";
};

export const validatePositiveNumber = (v, label = "Value") => {
  if (v === "" || v === undefined || v === null) return `${label} is required`;
  if (isNaN(v) || Number(v) <= 0) return `${label} must be a positive number`;
  return "";
};
