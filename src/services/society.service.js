import api from './api';

export const listSocieties = (params) => api.get('/societies', { params });

export const getMySociety = () => api.get('/societies/me');

export const getSociety = (id) => api.get(`/societies/${id}`);

export const createSociety = (payload) => api.post('/societies', payload);

export const updateSociety = (id, payload) => api.patch(`/societies/${id}`, payload);

export const deactivateSociety = (id) => api.post(`/societies/${id}/deactivate`);

export const activateSociety = (id) => api.post(`/societies/${id}/activate`);
