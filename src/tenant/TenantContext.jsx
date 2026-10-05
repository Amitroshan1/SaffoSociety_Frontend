import { createContext, useContext, useMemo } from 'react';
import { useAuthContext } from '@/auth/AuthContext';

const TenantContext = createContext(null);

export function TenantContextProvider({ children }) {
  const { user } = useAuthContext();
  const tenant = useMemo(() => {
    if (!user?.societyId) return null;
    return { id: user.societyId, name: user.societyName || '' };
  }, [user]);

  const value = useMemo(
    () => ({
      tenant,
      societyId: tenant?.id ?? null,
      societyName: tenant?.name ?? null,
    }),
    [tenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
