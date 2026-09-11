import api from './api';

export const listShifts = (params) => api.get('/shifts', { params });
export const getTodayShifts = () => api.get('/shifts/today');
export const getShift = (id) => api.get(`/shifts/${id}`);
export const createShift = (payload) => api.post('/shifts', payload);
export const updateShift = (id, payload) => api.patch(`/shifts/${id}`, payload);
export const startShift = (id, payload) => api.post(`/shifts/${id}/start`, payload || {});
export const completeShift = (id, payload) => api.post(`/shifts/${id}/complete`, payload || {});
export const cancelShift = (id, payload) => api.post(`/shifts/${id}/cancel`, payload || {});
export const markNoShow = (id, payload) => api.post(`/shifts/${id}/no-show`, payload || {});
