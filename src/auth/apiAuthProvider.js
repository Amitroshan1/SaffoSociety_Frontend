import api from '@/services/api/axios';
import { ENDPOINTS } from '@/services/api/endpoints';
import { permissionGranted } from '@/auth/permissions';
import { isKnownRole, toFrontendRole } from '@/auth/roles';
import {
  accessTokenIsCurrent,
  clearSession,
  currentAuthEpoch,
  readAccessToken,
  readSession,
  setMemoryAccessToken,
  writeSession,
} from '@/auth/session';
import { societyById } from '@/tenant/loginSocieties';

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === 'object' && 'data' in body && body.data && typeof body.data === 'object') {
    return body.data;
  }
  return body ?? {};
}

export function authError(message, status = 401) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function safeText(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text || text.length > 300) return '';
  if (/bearer\s+/i.test(text) || text.includes('eyJ')) return '';
  return text;
}

export function messageFromResponse(err, fallback) {
  const detail = err?.response?.data?.detail ?? err?.data?.detail;
  if (typeof detail === 'string') {
    const text = safeText(detail);
    if (text) return text;
  }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const text = safeText(detail.message);
    if (text) return text;
  }
  if (Array.isArray(detail)) {
    const first = detail.find((item) => item && typeof item.msg === 'string');
    const text = first ? safeText(first.msg) : '';
    if (text) return text;
  }
  const message = safeText(err?.message);
  if (message && !message.startsWith('Request failed with status code')) return message;
  return fallback;
}

function societyNameFor(societyId, fallback = '') {
  return societyById(societyId)?.name || fallback || '';
}

function sessionFromTokens(tokens, me, fallbackUser = null) {
  const accessToken = tokens?.access_token;
  const refreshToken = tokens?.refresh_token;
  const fromProfile = Boolean(me);
  const societyId = fromProfile
    ? (me?.society_id ?? null)
    : (tokens?.society_id ?? fallbackUser?.societyId ?? null);
  const permissions = fromProfile
    ? (Array.isArray(me?.permissions) ? me.permissions : [])
    : (Array.isArray(tokens?.permissions) ? tokens.permissions : []);
  const role = toFrontendRole(fromProfile ? me?.role : tokens?.role);
  const user = {
    id: fromProfile ? me?.user_id : fallbackUser?.id,
    email: fromProfile ? (me?.email || '') : (fallbackUser?.email || ''),
    role,
    societyId,
    societyName: societyNameFor(societyId, fromProfile ? '' : fallbackUser?.societyName),
    permissions,
  };
  if (!accessToken || !refreshToken) throw authError('Login failed');
  const session = writeSession({ accessToken, refreshToken, user });
  if (!session) throw authError('Login failed');
  return session;
}

function applyMe(me, fallbackSession) {
  const session = readSession() || fallbackSession;
  if (!session?.accessToken || !session?.refreshToken) {
    clearSession();
    throw authError('Login failed');
  }
  try {
    return sessionFromTokens(
      { access_token: session.accessToken, refresh_token: session.refreshToken },
      me,
    );
  } catch (err) {
    clearSession();
    throw err;
  }
}

/**
 * Maps the backend auth contract onto the frontend session.
 * Login: POST /auth/login, then GET /auth/me for user id and email.
 */
export const apiAuthProvider = {
  async login({ societyId, email, password }) {
    const id = Number(societyId);
    if (!Number.isInteger(id)) throw authError('Select your society to continue.', 422);
    try {
      const res = await api.post(
        ENDPOINTS.login,
        {
          society_id: id,
          email: String(email || '').trim(),
          password,
        },
        { skipAuth: true },
      );
      const tokens = unwrap(res);
      if (!tokens?.access_token) throw authError('Login failed');
      const meRes = await api.get(ENDPOINTS.me, {
        skipAuth: true,
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      return sessionFromTokens(tokens, unwrap(meRes));
    } catch (err) {
      if (err?.status && !err?.response) throw err;
      throw authError(
        messageFromResponse(err, 'Invalid society, email, or password.'),
        err?.response?.status || 401,
      );
    }
  },

  async restore() {
    const stored = readSession();
    if (!stored?.refreshToken) return null;
    if (!accessTokenIsCurrent(readAccessToken())) {
      setMemoryAccessToken(null);
      await refreshAccessToken();
    }
    const session = readSession();
    if (!session?.refreshToken || !accessTokenIsCurrent(session.accessToken)) {
      clearSession();
      return null;
    }
    const meRes = await api.get(ENDPOINTS.me);
    return applyMe(unwrap(meRes), session);
  },

  async logout() {
    clearSession();
  },
};

let refreshInFlight = null;

/**
 * One refresh at a time. Callers share the same request.
 * POST /auth/refresh { refresh_token }
 * A failed or logged-out refresh is not retried here.
 */
export async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;
  const epoch = currentAuthEpoch();
  refreshInFlight = performRefresh(epoch).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function performRefresh(epoch) {
  const current = readSession();
  if (!current?.refreshToken || !current.user || epoch !== currentAuthEpoch()) {
    throw authError('No session to refresh');
  }
  const res = await api.post(
    ENDPOINTS.refresh,
    { refresh_token: current.refreshToken },
    { skipAuth: true },
  );
  if (epoch !== currentAuthEpoch()) throw authError('Logged out');
  const data = unwrap(res);
  const session = sessionFromTokens(data, null, current.user);
  if (epoch !== currentAuthEpoch()) throw authError('Logged out');
  return session.accessToken;
}

export function userHasPermission(user, permission) {
  return permissionGranted(user?.permissions, permission);
}

export function userHasRole(user, role) {
  if (!user?.role || !isKnownRole(user.role) || !isKnownRole(role)) return false;
  return toFrontendRole(user.role) === toFrontendRole(role);
}
