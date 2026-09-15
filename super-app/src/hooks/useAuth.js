// mobile/src/hooks/useAuth.js
import { useEffect, useState, useCallback } from 'react';
import authService from '../stores/authService';

/**
 * useAuth()
 * Same shape as the web's useAuthStore(), but hook-based.
 *
 * Returns:
 *   user, token, isAuthenticated, userRole, userFullName, userAvatar,
 *   userStoreId, userGroupId, availableRoles, isLoggedOut,
 *   login, loginWithStore, logout, fetchProfile, changePassword, hasRole,
 *   fetchStoresByUsername, setUserStoreAndGroup
 */
export function useAuth() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Bump a counter whenever the auth service notifies
    const unsub = authService.subscribe(() => setVersion((v) => v + 1));
    return () => unsub();
  }, []);

  // Re-read all getters on every render (they're cheap)
  const auth = {
    user: authService.user,
    token: authService.token,
    refreshToken: authService.refreshToken,
    isLoggedOut: authService.isLoggedOut,
    availableRoles: authService.availableRoles,

    isAuthenticated: authService.isAuthenticated,
    userRole: authService.userRole,
    userFullName: authService.userFullName,
    userAvatar: authService.userAvatar,
    userStoreId: authService.userStoreId,
    userGroupId: authService.userGroupId,

    login: useCallback((u, p) => authService.login(u, p), []),
    loginWithStore: useCallback((c) => authService.loginWithStore(c), []),
    logout: useCallback(() => authService.logout(), []),
    fetchProfile: useCallback(() => authService.fetchProfile(), []),
    changePassword: useCallback(
      (c, n) => authService.changePassword(c, n),
      []
    ),
    hasRole: useCallback((r) => authService.hasRole(r), []),
    fetchStoresByUsername: useCallback(
      (u) => authService.fetchStoresByUsername(u),
      []
    ),
    setUserStoreAndGroup: useCallback(
      (u) => authService.setUserStoreAndGroup(u),
      []
    ),
  };

  return auth;
}