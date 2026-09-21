import api from '@/services/api';

export const listBuildings = (params) => api.get('/buildings', { params });

export const getBuilding = (id) => api.get(`/buildings/${id}`);

export const createBuilding = (payload) => api.post('/buildings', payload);

export const updateBuilding = (id, payload) => api.patch(`/buildings/${id}`, payload);

export const deactivateBuilding = (id) => api.post(`/buildings/${id}/deactivate`);

export const activateBuilding = (id) => api.post(`/buildings/${id}/activate`);
