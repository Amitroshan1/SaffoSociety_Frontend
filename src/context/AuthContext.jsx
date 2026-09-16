import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import {
  cacheAuthUser,
  clearAuthStorage,
  getAccessToken,
  hasSessionMarker,
  isAccessTokenValid,
  readAccessTokenPayload,
  readCachedAuthUser,
  refreshSession,
  setAccessToken,
  setSessionMarker,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  /** loading | authenticated | unauthenticated */
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  const isLoading = status === 'loading';

  const applySession = useCallback((nextUser, accessToken) => {
    if (accessToken) setAccessToken(accessToken);
    setSessionMarker(true);
    cacheAuthUser(nextUser);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    const handler = () => {
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession, navigate]);

  useEffect(() => {
    const handler = (event) => {
      const nextUser = event?.detail?.user;
      const accessToken = event?.detail?.accessToken;
      if (nextUser) applySession(nextUser, accessToken);
    };
    window.addEventListener('auth:session', handler);
    return () => window.removeEventListener('auth:session', handler);
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      if (!hasSessionMarker()) {
        clearAuthStorage();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
        return;
      }

      const existingToken = getAccessToken();
      const cachedUser = readCachedAuthUser();
      const tokenRole = readAccessTokenPayload(existingToken)?.role;
      const cacheMatchesToken =
        cachedUser &&
        (!tokenRole ||
          String(cachedUser.role || '').toLowerCase() ===
            String(tokenRole || '').toLowerCase());

      // Trust cache only when it matches the JWT role — avoids guard UI + admin token mismatch.
      if (isAccessTokenValid(existingToken) && cacheMatchesToken) {
        if (!cancelled) {
          setUser(cachedUser);
          setStatus('authenticated');
        }
        return;
      }

      try {
        const { accessToken, user: nextUser } = await refreshSession();
        if (cancelled) return;
        applySession(nextUser, accessToken);
      } catch {
        if (cancelled) return;
        clearSession();
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authService.login({ email, password });
      const nextUser = data.data.user;
      const accessToken = data.data.accessToken;
      applySession(nextUser, accessToken);
      return nextUser;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    clearSession();
    navigate('/login', { replace: true });
  }, [clearSession, navigate]);

  const clearLocalSession = useCallback(async () => {
    await authService.logout().catch(() => {});
    clearSession();
  }, [clearSession]);

  const ROLE_REDIRECT = useMemo(
    () => ({
      admin: '/admin/dashboard',
      finance: '/finance/dashboard',
      resident: '/resident/dashboard',
      guard: '/guard/dashboard',
      super_admin: '/superadmin/dashboard',
      platform_support: '/superadmin/dashboard',
      platform_auditor: '/superadmin/dashboard',
      platform_billing: '/superadmin/dashboard',
    }),
    [],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      clearLocalSession,
      ROLE_REDIRECT,
    }),
    [user, status, isLoading, login, logout, clearLocalSession, ROLE_REDIRECT],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('useAuth must be used inside AuthProvider');
  return authContext;
};
