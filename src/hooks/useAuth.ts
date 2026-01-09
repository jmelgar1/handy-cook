import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService, type SignInParams, type SignUpParams } from '../services/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading, setLoading, setUser, logout } = useAuthStore();

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setLoading, setUser]);

  const signIn = useCallback(async (params: SignInParams) => {
    setLoading(true);
    try {
      const result = await authService.signIn(params);
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signUp = useCallback(async (params: SignUpParams) => {
    setLoading(true);
    try {
      const result = await authService.signUp(params);
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    setLoading(true);
    try {
      const result = await authService.confirmSignUp(email, code);
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authService.signOut();
      logout();
    } finally {
      setLoading(false);
    }
  }, [setLoading, logout]);

  const forgotPassword = useCallback(async (email: string) => {
    const result = await authService.forgotPassword(email);
    return result;
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      const result = await authService.confirmForgotPassword(email, code, newPassword);
      return result;
    },
    []
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    forgotPassword,
    confirmForgotPassword,
  };
}
