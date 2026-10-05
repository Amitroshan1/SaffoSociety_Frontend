import { TenantContextProvider } from '@/context/TenantContext';

export default function TenantProvider({ children }) {
  return <TenantContextProvider>{children}</TenantContextProvider>;
}
