import api from '@/services/api';

export const listFlats = (params) => api.get('/flats', { params });

export const getFlat = (id) => api.get(`/flats/${id}`);

export const createFlat = (payload) => api.post('/flats', payload);

export const updateFlat = (id, payload) => api.patch(`/flats/${id}`, payload);

export const deactivateFlat = (id) => api.post(`/flats/${id}/deactivate`);

export const activateFlat = (id) => api.post(`/flats/${id}/activate`);
