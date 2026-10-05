import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeForRole, isKnownRole } from '@/auth/roles';
import { useAuth } from '@/hooks/useAuth';

/**
 * Public actions never open a panel URL and never assign a role.
 * A session confirmed by /auth/me goes to that user's own panel.
 * Otherwise the login page is shown.
 */
export function usePublicEntry() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  return useCallback(() => {
    if (!isLoading && isAuthenticated && isKnownRole(user?.role)) {
      navigate(homeForRole(user.role));
      return;
    }
    navigate('/login');
  }, [isAuthenticated, isLoading, navigate, user]);
}
