import api from './api';

export const listAttendance = (params) => api.get('/staff-attendance', { params });
export const getAttendance = (id) => api.get(`/staff-attendance/${id}`);
export const checkInAttendance = (payload) => api.post('/staff-attendance/check-in', payload);
export const checkOutAttendance = (id, payload) =>
  api.post(`/staff-attendance/${id}/check-out`, payload || {});
export const voidAttendance = (id) => api.post(`/staff-attendance/${id}/void`);
