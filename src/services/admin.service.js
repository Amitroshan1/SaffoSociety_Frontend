import api from './api';

export const getProfile = () => api.get('/admin/profile');

export const updateProfile = (fields) => api.patch('/admin/profile', fields);

export const changePassword = (currentPassword, newPassword) =>
  api.patch('/admin/change-password', { currentPassword, newPassword });
