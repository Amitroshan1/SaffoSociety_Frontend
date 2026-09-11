import api from './api';

export const listResidents = (params) => api.get('/residents', { params });

export const getResident = (id) => api.get(`/residents/${id}`);

export const createResident = (payload) => api.post('/residents', payload);

export const updateResident = (id, payload) => api.patch(`/residents/${id}`, payload);

export const deactivateResident = (id) => api.post(`/residents/${id}/deactivate`);

export const activateResident = (id) => api.post(`/residents/${id}/activate`);
