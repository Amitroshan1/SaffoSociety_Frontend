import api from './api';

export const listOccupancies = (params) => api.get('/occupancies', { params });

export const getOccupancy = (id) => api.get(`/occupancies/${id}`);

export const createOccupancy = (payload) => api.post('/occupancies', payload);

export const updateOccupancy = (id, payload) => api.patch(`/occupancies/${id}`, payload);

export const moveOutOccupancy = (id, payload) => api.post(`/occupancies/${id}/move-out`, payload);

export const cancelOccupancy = (id) => api.post(`/occupancies/${id}/cancel`);

export const listFlatOccupancies = (flatId, params) =>
  api.get(`/flats/${flatId}/occupancies`, { params });

export const getFlatHousehold = (flatId) => api.get(`/flats/${flatId}/household`);
