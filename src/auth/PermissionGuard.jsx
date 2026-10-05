import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthContext';
import { isKnownRole } from '@/auth/roles';
import ProtectedRoute from '@/auth/ProtectedRoute';

function PermissionAllowed({ permission, children }) {
  const { hasPermission, user } = useAuthContext();
  if (!user || !isKnownRole(user.role)) return <Navigate to="/unauthorized" replace />;
  if (permission && !hasPermission(permission)) return <Navigate to="/unauthorized" replace />;
  return children;
}

export default function PermissionGuard({ permission, children }) {
  return (
    <ProtectedRoute>
      <PermissionAllowed permission={permission}>{children}</PermissionAllowed>
    </ProtectedRoute>
  );
}
