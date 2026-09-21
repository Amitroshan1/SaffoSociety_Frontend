import api from '@/services/api';

export const listGates = (params) => api.get('/gates', { params });
export const getGate = (id) => api.get(`/gates/${id}`);
export const createGate = (payload) => api.post('/gates', payload);
export const updateGate = (id, payload) => api.patch(`/gates/${id}`, payload);
export const deactivateGate = (id) => api.post(`/gates/${id}/deactivate`);
export const activateGate = (id) => api.post(`/gates/${id}/activate`);
export const getGateDashboard = () => api.get('/gates/dashboard');
export const getGateOnDuty = (id) => api.get(`/gates/${id}/on-duty`);
