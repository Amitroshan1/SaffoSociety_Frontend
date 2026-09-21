import api, { refreshSession } from '@/services/api';

export const authService = {
  register: (data) => api.post('/auth/register-request', data),
  adminRegister: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  /** Prefer shared refreshSession() so concurrent callers do not rotate twice. */
  refreshToken: () => refreshSession().then((session) => ({
    data: { success: true, data: session },
  })),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};
