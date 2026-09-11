import api from './api';

export const listComplaints = (params) => api.get('/complaints', { params });
export const getComplaintDashboard = () => api.get('/complaints/dashboard');
export const getComplaint = (id) => api.get(`/complaints/${id}`);
export const createComplaint = (payload) => api.post('/complaints', payload);
export const updateComplaint = (id, payload) => api.patch(`/complaints/${id}`, payload);
export const assignComplaint = (id, payload) => api.post(`/complaints/${id}/assign`, payload);
export const updateComplaintStatus = (id, payload) => api.post(`/complaints/${id}/status`, payload);
export const updateComplaintPriority = (id, payload) => api.post(`/complaints/${id}/priority`, payload);
export const addComplaintComment = (id, payload) => api.post(`/complaints/${id}/comments`, payload);
export const resolveComplaint = (id, payload) => api.post(`/complaints/${id}/resolve`, payload || {});
export const reopenComplaint = (id, payload) => api.post(`/complaints/${id}/reopen`, payload || {});
export const closeComplaint = (id, payload) => api.post(`/complaints/${id}/close`, payload || {});

export const listResidentComplaints = (params) => api.get('/resident/complaints', { params });
export const getResidentComplaint = (id) => api.get(`/resident/complaints/${id}`);
export const createResidentComplaint = (payload) => api.post('/resident/complaints', payload);
export const addResidentComplaintComment = (id, payload) =>
  api.post(`/resident/complaints/${id}/comments`, payload);
export const closeResidentComplaint = (id, payload) =>
  api.post(`/resident/complaints/${id}/close`, payload || {});
