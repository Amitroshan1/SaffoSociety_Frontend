import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/auth/AuthContext';
import AuthBoot from '@/auth/AuthBoot';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();
  if (isLoading) return <AuthBoot />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
