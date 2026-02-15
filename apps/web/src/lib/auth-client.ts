'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback, useState } from 'react';

// User type that matches the old authStore interface
export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  firstName?: string;
  lastName?: string;
}

// Auth state interface matching old authStore
export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Auth actions interface
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, firstName: string, lastName?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// Combined hook return type
export type UseAuthReturn = AuthState & AuthActions;

/**
 * Main authentication hook for client components.
 * Provides similar interface to the old Zustand authStore.
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Map session to AuthUser
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      }
    : null;

  const loading = status === 'loading' || actionLoading;
  const initialized = status !== 'loading';

  // Sign in with email/password
  const handleSignIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setActionLoading(true);

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : result.error);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Sign up (register) new user
  const handleSignUp = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      setActionLoading(true);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to register');
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful, but auto sign-in failed. Please sign in manually.');
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Sign in with Google OAuth
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setError(null);
      await signIn('google', {
        callbackUrl: '/',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  }, []);

  // Sign out
  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      setActionLoading(true);
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Change password
  const handleChangePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      setError(null);
      setActionLoading(true);

      // Validate password strength
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    user,
    loading,
    error,
    initialized,
    // Actions
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    changePassword: handleChangePassword,
    clearError,
  };
}

/**
 * Hook to check if user is authenticated.
 * Useful for conditional rendering.
 */
export function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}

/**
 * Hook to get just the user ID.
 * Returns null if not authenticated.
 */
export function useUserId(): string | null {
  const { data: session } = useSession();
  return session?.user?.id ?? null;
}

/**
 * Hook that requires authentication.
 * Redirects to sign in page if not authenticated.
 * Use in client components that require auth.
 */
export function useRequireAuth(): AuthUser {
  const { data: session, status } = useSession();

  if (status === 'unauthenticated') {
    // In client components, we can't use redirect()
    // The parent should handle this with a loading state
    throw new Error('Authentication required');
  }

  if (!session?.user) {
    throw new Error('User not found in session');
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
  };
}
