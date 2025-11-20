import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/auth';
import type { RegisterData, User, LoginResponse } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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
    
    // Set user data
    setUser({
      id: response.user.id,
      username: response.user.username || email.split('@')[0],
      email: response.user.email,
      role: response.user.role,
      email_verified: false, // Will be updated when profile is fetched
    });

    // Fetch full profile to get email_verified status
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
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

