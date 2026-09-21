import api from '@/services/api';

export const listStaff = (params) => api.get('/staff', { params });
export const getStaff = (id) => api.get(`/staff/${id}`);
export const getMyStaff = () => api.get('/staff/me');
export const createStaff = (payload) => api.post('/staff', payload);
export const updateStaff = (id, payload) => api.patch(`/staff/${id}`, payload);
export const deactivateStaff = (id) => api.post(`/staff/${id}/deactivate`);
export const activateStaff = (id) => api.post(`/staff/${id}/activate`);
