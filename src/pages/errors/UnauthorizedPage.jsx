import { Link } from 'react-router-dom';
import AuthBoot from '@/auth/AuthBoot';
import { homeForRole } from '@/auth/roles';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <AuthBoot />;
  const home = isAuthenticated ? homeForRole(user?.role) : '/login';

  return (
    <div className="page-placeholder">
      <h1>Unauthorized</h1>
      <p>You do not have access to this page.</p>
      <p>
        <Link to={home}>{isAuthenticated ? 'Back to dashboard' : 'Back to login'}</Link>
      </p>
    </div>
  );
}
