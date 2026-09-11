import api from './api';

export const getResidentDashboard = () => api.get('/resident/dashboard');
export const getResidentProfile = () => api.get('/resident/profile');
export const updateResidentProfile = (payload) => api.patch('/resident/profile', payload);
export const getResidentHousehold = () => api.get('/resident/household');
export const getResidentFlat = () => api.get('/resident/flat');
export const listResidentVisitors = (params) => api.get('/resident/visitors', { params });
export const createResidentVisitorInvitation = (payload) =>
  api.post('/resident/visitor-invitations', payload);
export const residentVisitorApproval = (payload) => api.post('/resident/visitor-approval', payload);
export const getResidentNotices = () => api.get('/resident/notices');
export const getResidentDocuments = () => api.get('/resident/documents');
export const getResidentNotifications = () => api.get('/resident/notifications');
