import api from '@/services/api';

export const listVisits = (params) => api.get('/visits', { params });

export const getVisit = (id) => api.get(`/visits/${id}`);

export const createVisit = (payload) => api.post('/visits', payload);

export const updateVisit = (id, payload) => api.patch(`/visits/${id}`, payload);

export const approveVisit = (id, payload) => api.post(`/visits/${id}/approve`, payload || {});

export const rejectVisit = (id, payload) => api.post(`/visits/${id}/reject`, payload || {});

export const checkInVisit = (id, payload) => api.post(`/visits/${id}/check-in`, payload || {});

export const checkOutVisit = (id, payload) => api.post(`/visits/${id}/check-out`, payload || {});

export const cancelVisit = (id, payload) => api.post(`/visits/${id}/cancel`, payload || {});
