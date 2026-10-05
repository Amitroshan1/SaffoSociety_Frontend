import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthContext';
import { isKnownRole } from '@/auth/roles';
import ProtectedRoute from '@/auth/ProtectedRoute';

function RoleAllowed({ role, children }) {
  const { hasRole, user } = useAuthContext();
  if (!user || !isKnownRole(user.role) || !isKnownRole(role) || !hasRole(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

export default function RoleGuard({ role, children }) {
  return (
    <ProtectedRoute>
      <RoleAllowed role={role}>{children}</RoleAllowed>
    </ProtectedRoute>
  );
}
