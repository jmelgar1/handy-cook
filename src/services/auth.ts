import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

// Cognito configuration - these should come from environment variables
const USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID,
  ClientId: CLIENT_ID,
});

export type SignUpParams = {
  email: string;
  password: string;
  displayName: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: User;
};

export const authService = {
  /**
   * Sign up a new user
   */
  signUp: async ({ email, password, displayName }: SignUpParams): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'custom:displayName', Value: displayName }),
      ];

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        resolve({
          success: true,
          user: {
            id: result?.userSub || '',
            email,
            displayName,
            createdAt: new Date().toISOString(),
            achievements: [],
          },
        });
      });
    });
  },

  /**
   * Confirm sign up with verification code
   */
  confirmSignUp: async (email: string, code: string): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }
        resolve({ success: true });
      });
    });
  },

  /**
   * Sign in an existing user
   */
  signIn: async ({ email, password }: SignInParams): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          const accessToken = session.getAccessToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();
          const idToken = session.getIdToken();

          const payload = idToken.decodePayload();

          const user: User = {
            id: payload.sub,
            email: payload.email,
            displayName: payload['custom:displayName'] || payload.email,
            createdAt: new Date().toISOString(),
            achievements: [],
          };

          useAuthStore.getState().setUser(user);
          useAuthStore.getState().setTokens(accessToken, refreshToken);

          resolve({ success: true, user });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
        newPasswordRequired: () => {
          resolve({ success: false, error: 'New password required' });
        },
      });
    });
  },

  /**
   * Sign out the current user
   */
  signOut: async (): Promise<void> => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    useAuthStore.getState().logout();
  },

  /**
   * Send password reset code
   */
  forgotPassword: async (email: string): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
      });
    });
  },

  /**
   * Confirm password reset with code and new password
   */
  confirmForgotPassword: async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<AuthResult> => {
    return new Promise((resolve) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve({ success: true });
        },
        onFailure: (err) => {
          resolve({ success: false, error: err.message });
        },
      });
    });
  },

  /**
   * Get current session and refresh if needed
   */
  getCurrentSession: async (): Promise<CognitoUserSession | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession(
        (err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session) {
            resolve(null);
            return;
          }

          if (session.isValid()) {
            resolve(session);
          } else {
            resolve(null);
          }
        }
      );
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const session = await authService.getCurrentSession();
    return session !== null && session.isValid();
  },
};
