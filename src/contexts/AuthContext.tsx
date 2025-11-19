import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, type RegisterData, type User, type LoginResponse } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyEmail: (uidb64: string, token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uidb64: string, token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Try to fetch user profile
      authAPI.getProfile()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response: LoginResponse = await authAPI.login(email, password);
    
    // Store tokens
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    
    // Set user data from login response (includes role)
    setUser({
      id: response.user.id,
      username: response.user.username || email.split('@')[0],
      email: response.user.email,
      role: response.user.role, // Use role from login response
      email_verified: false, // Will be updated when profile is fetched
    });

    // Fetch full profile to get email_verified status and other details
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Keep the user data from login response even if profile fetch fails
    }
  };

  const register = async (data: RegisterData) => {
    await authAPI.register(data);
    // Registration successful, user needs to verify email
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const verifyEmail = async (uidb64: string, token: string) => {
    await authAPI.verifyEmail(uidb64, token);
  };

  const requestPasswordReset = async (email: string) => {
    await authAPI.requestPasswordReset(email);
  };

  const confirmPasswordReset = async (uidb64: string, token: string, newPassword: string) => {
    await authAPI.confirmPasswordReset(uidb64, token, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        verifyEmail,
        requestPasswordReset,
        confirmPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

