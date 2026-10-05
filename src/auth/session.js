import { isKnownRole, toFrontendRole } from '@/auth/roles';

export const SESSION_KEY = 'saffo_auth_session';

const LEGACY_TOKEN_KEYS = ['access_token', 'accessToken', 'token', 'refresh_token', 'refreshToken'];

/** Access tokens stay in memory. Only the refresh token and user profile are persisted. */
let memoryAccessToken = null;
let authEpoch = 0;

export function currentAuthEpoch() {
  return authEpoch;
}

export function setMemoryAccessToken(token) {
  memoryAccessToken = typeof token === 'string' && token ? token : null;
}

function storage() {
  return storageBucket('localStorage');
}

function dropLegacyKeys(store) {
  LEGACY_TOKEN_KEYS.forEach((key) => store.removeItem(key));
}

function storageBucket(kind) {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind];
  } catch {
    return null;
  }
}

/** Client clock check only. This does not authorize the user. */
export function accessTokenIsCurrent(token) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length < 3 || !parts[1]) return false;
  try {
    const segment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = segment + '='.repeat((4 - (segment.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp)) return false;
    return exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
}

function publicUser(user) {
  if (!user || user.id == null) return null;
  const role = toFrontendRole(user.role);
  if (!isKnownRole(role)) return null;
  const societyId = user.societyId ?? null;
  if (role !== 'super_admin' && societyId == null) return null;
  return {
    id: user.id,
    email: user.email || '',
    role,
    societyId,
    societyName: user.societyName || '',
    permissions: Array.isArray(user.permissions) ? [...user.permissions] : [],
  };
}

function discardStoredSession() {
  memoryAccessToken = null;
  [storage(), storageBucket('sessionStorage')].forEach((store) => {
    if (!store) return;
    store.removeItem(SESSION_KEY);
    dropLegacyKeys(store);
  });
}

export function readSession() {
  const store = storage();
  if (!store) return null;
  let session;
  try {
    const raw = store.getItem(SESSION_KEY);
    if (!raw) return null;
    session = JSON.parse(raw);
  } catch {
    discardStoredSession();
    return null;
  }

  if (session?.accessToken && !memoryAccessToken && accessTokenIsCurrent(session.accessToken)) {
    setMemoryAccessToken(session.accessToken);
  }

  const user = publicUser(session?.user);
  if (!session?.refreshToken || !user) {
    discardStoredSession();
    return null;
  }

  if (session.accessToken) {
    store.setItem(SESSION_KEY, JSON.stringify({ refreshToken: session.refreshToken, user }));
    dropLegacyKeys(store);
  }

  return {
    refreshToken: session.refreshToken,
    accessToken: memoryAccessToken,
    user,
  };
}

export function writeSession(session) {
  const store = storage();
  if (!store) return null;
  const user = publicUser(session?.user);
  if (!session?.refreshToken || !user) return null;
  if (session.accessToken) setMemoryAccessToken(session.accessToken);
  store.setItem(
    SESSION_KEY,
    JSON.stringify({
      refreshToken: session.refreshToken,
      user,
    }),
  );
  dropLegacyKeys(store);
  return readSession();
}

/** Local logout only. This does not revoke the JWT on the server. */
export function clearSession() {
  authEpoch += 1;
  discardStoredSession();
}

export function readAccessToken() {
  return memoryAccessToken;
}

export function readRefreshToken() {
  return readSession()?.refreshToken || null;
}
