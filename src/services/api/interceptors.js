import { clearSession, currentAuthEpoch, readAccessToken } from '@/auth/session';

export const ACCOUNT_DEACTIVATED_DETAIL = 'Account is deactivated';

export function accountDeactivated(error) {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' && detail.trim() === ACCOUNT_DEACTIVATED_DETAIL;
}

function leaveToLogin() {
  clearSession();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

export function attachInterceptors(api) {
  api.interceptors.request.use((config) => {
    if (!config.skipAuth) {
      const token = readAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const status = error?.response?.status;
      const config = error?.config;

      if (status === 403 && accountDeactivated(error)) {
        leaveToLogin();
        return Promise.reject(error);
      }

      const url = String(config?.url || '');
      const isRefreshCall = url.includes('/auth/refresh');
      const isLoginCall = url.includes('/auth/login');
      if (status !== 401 || !config || config._retry || isRefreshCall || isLoginCall) {
        return Promise.reject(error);
      }

      const epoch = currentAuthEpoch();
      config._retry = true;
      try {
        const { refreshAccessToken } = await import('@/auth/apiAuthProvider');
        const token = await refreshAccessToken();
        if (!token || currentAuthEpoch() !== epoch) {
          return Promise.reject(error);
        }
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        if (currentAuthEpoch() === epoch) leaveToLogin();
        return Promise.reject(error);
      }
    },
  );
}
