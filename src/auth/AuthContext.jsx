import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '@/auth/authService';
import { userHasPermission, userHasRole } from '@/auth/apiAuthProvider';
import { isKnownRole } from '@/auth/roles';
import { SESSION_KEY } from '@/auth/session';

const AuthContext = createContext(null);

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let live = true;

    async function boot() {
      const session = await authService.restore();
      if (!live) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
    }

    function onStorage(event) {
      if (event.key !== SESSION_KEY || event.newValue) return;
      authService.logout();
      setUser(null);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    boot();
    window.addEventListener('storage', onStorage);
    return () => {
      live = false;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = useCallback(async (payload) => {
    const session = await authService.login(payload);
    setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await authService.logout();
  }, []);

  const hasRole = useCallback((role) => userHasRole(user, role), [user]);

  const hasPermission = useCallback(
    (permission) => userHasPermission(user, permission),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && isKnownRole(user.role)),
      isLoading,
      login,
      logout,
      hasRole,
      hasPermission,
    }),
    [user, isLoading, login, logout, hasRole, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
