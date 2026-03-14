import axiosInstance from "./axiosInstance";

export const checkInApi = async () => {
  const { data } = await axiosInstance.post("/attendance/checkin");
  return data;
};

export const checkOutApi = async () => {
  const { data } = await axiosInstance.post("/attendance/checkout");
  return data;
};

export const getTodayAttendanceApi = async () => {
  const { data } = await axiosInstance.get("/attendance/today");
  return data;
};

export const getMyAttendanceApi = async (month, year) => {
  const { data } = await axiosInstance.get("/attendance/my", {
    params: { month, year },
  });
  return data;
};

export const getAllAttendanceApi = async (params = {}) => {
  const { data } = await axiosInstance.get("/attendance/all", { params });
  return data;
};

export const getAttendanceSummaryApi = async (month, year, { organizationId, branchId } = {}) => {
  const { data } = await axiosInstance.get("/attendance/summary", {
    params: { month, year, organizationId, branchId },
  });
  return data;
};

export const updateAttendanceApi = async (id, payload) => {
  const { data } = await axiosInstance.put(`/attendance/${id}`, payload);
  return data;
};
