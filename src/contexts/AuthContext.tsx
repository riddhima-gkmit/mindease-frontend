import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/auth';
import type { RegisterData, User, LoginResponse } from '../types/auth';

// Helper function to decode JWT token and extract active_role
const getActiveRoleFromToken = (token: string): string | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.active_role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (uidb64: string, token: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uidb64: string, token: string, newPassword: string) => Promise<void>;
  addRole: (role: string) => Promise<void>;
  updateHasProfile: (hasProfile: boolean) => void;
  availableRoles: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Extract active role from JWT token
      const activeRole = getActiveRoleFromToken(token);
      
      // Restore available roles from localStorage
      const storedRoles = localStorage.getItem('available_roles');
      if (storedRoles) {
        try {
          const roles = JSON.parse(storedRoles);
          setAvailableRoles(roles);
        } catch (error) {
          console.error('Error parsing stored roles:', error);
        }
      }
      
      // Restore has_profile from localStorage
      const storedHasProfile = localStorage.getItem('has_profile');
      let hasProfileFlag: boolean | undefined;
      if (storedHasProfile !== null) {
        hasProfileFlag = storedHasProfile === 'true';
      }

      
      // Check if we're on therapist profile page OR if therapist has no profile - skip profile API call
      const isTherapistProfilePage = window.location.pathname.includes('/therapist/profile');
      const isTherapistWithoutProfile = activeRole === 'therapist' && hasProfileFlag === false;
      
      if ((isTherapistProfilePage || isTherapistWithoutProfile) && activeRole === 'therapist') {
        // For therapist profile page or therapist without profile, construct minimal user from token without API call
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          
          setUser({
            id: payload.user_id || '',
            username: payload.username || payload.email?.split('@')[0] || '',
            email: payload.email || '',
            role: activeRole,
            email_verified: true, // Assume verified since they logged in
            has_profile: hasProfileFlag,
          });
          setLoading(false);
        } catch (error) {
          console.error('Failed to decode token:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('available_roles');
          localStorage.removeItem('has_profile');
          setLoading(false);
        }
      } else {
        // For other pages, fetch full profile
        authAPI.getProfile()
          .then((userData) => {
            // Set user with active role from token and has_profile from storage
            setUser({
              ...userData,
              role: activeRole || userData.role, // Use active role from token, fallback to profile role
              has_profile: hasProfileFlag !== false, // Use stored value if available
            });
          })
          .catch((error) => {
            // If 404, user might not have profile yet (therapist), create minimal user
            if (error.response?.status === 404 && activeRole === 'therapist') {
              try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                
                setUser({
                  id: payload.user_id || '',
                  username: payload.username || payload.email?.split('@')[0] || '',
                  email: payload.email || '',
                  role: activeRole,
                  email_verified: true,
                  has_profile: false, // Set to false on 404
                });
                // Update localStorage
                localStorage.setItem('has_profile', 'false');
              } catch (decodeError) {
                console.error('Failed to decode token:', decodeError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('available_roles');
                localStorage.removeItem('has_profile');
              }
            } else {
              // Token invalid or other error, clear it
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('available_roles');
              localStorage.removeItem('has_profile');
            }
        })
        .finally(() => {
          setLoading(false);
        });
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    // Clear any existing user data first to prevent stale data
    setUser(null);
    
    const response: LoginResponse = await authAPI.login(email, password, role);
    
    // Store tokens
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    
    // Store available roles in localStorage for persistence across reloads
    const roles = response.user.available_roles || [response.user.role];
    setAvailableRoles(roles);
    localStorage.setItem('available_roles', JSON.stringify(roles));
    
    // Store has_profile flag in localStorage (explicitly from response)
    const hasProfile = response.user.has_profile === true;
    localStorage.setItem('has_profile', String(hasProfile));
    
    // For therapists without profile, set minimal user data from login response
    // For patients, always fetch full profile
    if (response.user.role === 'therapist' && response.user.has_profile === false) {
      // Therapist without profile - set minimal data, don't fetch profile
    setUser({
      id: response.user.id,
      username: response.user.username || email.split('@')[0],
      email: response.user.email,
        role: response.user.role,
        email_verified: true, // They logged in, so email is verified
        has_profile: false, // Store has_profile flag
    });
    } else {
      // For patients or therapists with profile, fetch full profile data
    try {
      const profile = await authAPI.getProfile();
        setUser({
          ...profile, 
          role: response.user.role, // Keep the active role from login
          has_profile: hasProfile, // Use the has_profile from login response
        });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
        // Fallback to login response data if profile fetch fails
        setUser({
          id: response.user.id,
          username: response.user.username || email.split('@')[0],
          email: response.user.email,
          role: response.user.role,
          email_verified: true,
          has_profile: hasProfile, // Use the has_profile from login response
        });
      }
    }
  };

  const addRole = async (role: string) => {
    const response = await authAPI.addRole(role);
    setAvailableRoles(response.available_roles);
    // Also update localStorage to persist across reloads
    localStorage.setItem('available_roles', JSON.stringify(response.available_roles));
  };

  const register = async (data: RegisterData) => {
    await authAPI.register(data);
    // Registration successful, user needs to verify email
  };

  const logout = async () => {
    try {
      // Call logout API to blacklist the refresh token
      await authAPI.logout();
    } catch (error) {
      // Even if API call fails, we still clear local storage
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and user state
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
      localStorage.removeItem('available_roles');
      localStorage.removeItem('has_profile');
    setUser(null);
      setAvailableRoles([]);
    }
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

  const updateHasProfile = (hasProfile: boolean) => {
    // Update localStorage
    localStorage.setItem('has_profile', String(hasProfile));
    // Update user state
    if (user) {
      setUser({ ...user, has_profile: hasProfile });
    }
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
        addRole,
        updateHasProfile,
        availableRoles,
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

