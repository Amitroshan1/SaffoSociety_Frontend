import api from '@/services/api';

export const listWings = (params) => api.get('/wings', { params });

export const getWing = (id) => api.get(`/wings/${id}`);

export const createWing = (payload) => api.post('/wings', payload);

export const updateWing = (id, payload) => api.patch(`/wings/${id}`, payload);

export const deactivateWing = (id) => api.post(`/wings/${id}/deactivate`);

export const activateWing = (id) => api.post(`/wings/${id}/activate`);
