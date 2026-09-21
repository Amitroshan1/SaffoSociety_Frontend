import api from '@/services/api';

export const listVisitors = (params) => api.get('/visitors', { params });

export const getVisitor = (id) => api.get(`/visitors/${id}`);

export const createVisitor = (payload) => api.post('/visitors', payload);

export const updateVisitor = (id, payload) => api.patch(`/visitors/${id}`, payload);

export const deactivateVisitor = (id) => api.post(`/visitors/${id}/deactivate`);

export const activateVisitor = (id) => api.post(`/visitors/${id}/activate`);

export const getVisitorHistory = (id, params) => api.get(`/visitors/${id}/history`, { params });
