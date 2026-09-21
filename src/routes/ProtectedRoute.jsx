import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/common/Spinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, status, isLoading } = useAuth();

  // Never treat "still restoring session" as logged out
  if (isLoading || status === 'loading') {
    return <Spinner />;
  }

  if (status !== 'authenticated' || !user) {
    const panel =
      Array.isArray(allowedRoles) && allowedRoles.length === 1
        ? allowedRoles[0]
        : undefined;
    const to = panel ? `/login?panel=${panel}` : '/login';
    return <Navigate to={to} replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
}
