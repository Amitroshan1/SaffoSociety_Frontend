import { apiAuthProvider, userHasPermission, userHasRole } from '@/auth/apiAuthProvider';
import { accessTokenIsCurrent, clearSession, readAccessToken, readSession } from '@/auth/session';

/**
 * True only after login or restore has confirmed the profile with /auth/me.
 * A refresh token in storage is not enough.
 */
let profileConfirmed = false;

/**
 * Single auth API for the UI. Pages call this, not the backend client.
 * Logout clears local state only. The backend does not revoke the JWT.
 */
export const authService = {
  async login(payload) {
    const session = await apiAuthProvider.login(payload);
    profileConfirmed = Boolean(session?.user);
    return session;
  },

  async restore() {
    try {
      const session = await apiAuthProvider.restore();
      profileConfirmed = Boolean(session?.user);
      return session;
    } catch {
      profileConfirmed = false;
      clearSession();
      return null;
    }
  },

  async logout() {
    profileConfirmed = false;
    clearSession();
  },

  getSession() {
    if (!this.isAuthenticated()) return null;
    return readSession();
  },

  isAuthenticated() {
    return profileConfirmed && accessTokenIsCurrent(readAccessToken());
  },

  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    return readSession()?.user ?? null;
  },

  hasRole(role) {
    return userHasRole(this.getCurrentUser(), role);
  },

  hasPermission(permission) {
    return userHasPermission(this.getCurrentUser(), permission);
  },
};
