import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register-request',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const SESSION_MARKER_KEY = 'hasSession';
const ACCESS_TOKEN_KEY = 'accessToken';
const USER_CACHE_KEY = 'authUser';

/** Single in-flight refresh — prevents Strict Mode / multi-caller token rotation races. */
let refreshPromise = null;

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function setSessionMarker(on) {
  if (on) localStorage.setItem(SESSION_MARKER_KEY, 'true');
  else localStorage.removeItem(SESSION_MARKER_KEY);
}

export function hasSessionMarker() {
  return localStorage.getItem(SESSION_MARKER_KEY) === 'true';
}

export function cacheAuthUser(user) {
  if (user) sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(USER_CACHE_KEY);
}

export function readCachedAuthUser() {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(SESSION_MARKER_KEY);
  sessionStorage.removeItem(USER_CACHE_KEY);
}

/** Decode JWT payload without verifying signature (backend still verifies). */
export function readAccessTokenPayload(token) {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Client-side expiry check only (signature verified by backend). */
export function isAccessTokenValid(token, skewMs = 30_000) {
  const payload = readAccessTokenPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now() + skewMs;
}

/**
 * Rotate/refresh session via HttpOnly refresh cookie.
 * Concurrent callers share one request so the refresh token is only rotated once.
 * @returns {Promise<{ accessToken: string, user: object }>}
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh-token')
      .then((res) => {
        const payload = res?.data?.data;
        const accessToken = payload?.accessToken;
        const user = payload?.user;
        if (!accessToken || !user) {
          throw new Error('Invalid refresh response');
        }
        setAccessToken(accessToken);
        setSessionMarker(true);
        cacheAuthUser(user);
        return { accessToken, user };
      })
      .catch((err) => {
        clearAuthStorage();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const requestUrl = original.url || '';
    const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) =>
      requestUrl.includes(path),
    );
    const isRefreshCall = requestUrl.includes('/auth/refresh-token');

    // Never try to refresh these — avoid loops / clearing session during bootstrap race.
    if (isRefreshCall || isPublicAuthCall) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { accessToken, user } = await refreshSession();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        window.dispatchEvent(
          new CustomEvent('auth:session', { detail: { user, accessToken } }),
        );
        return api(original);
      } catch (err) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
