import axios from 'axios';
import type { User, RegisterData, LoginResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export const authAPI = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  login: async (email: string, password: string, role?: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', { email, password, role });
    return response.data;
  },

  addRole: async (role: string) => {
    const response = await api.post('/auth/add-role/', { role });
    return response.data;
  },

  verifyEmail: async (uidb64: string, token: string) => {
    const response = await api.get(`/auth/verify-email/${uidb64}/${token}/`);
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },

  confirmPasswordReset: async (uidb64: string, token: string, newPassword: string) => {
    const response = await api.post(`/auth/password-reset-confirm/${uidb64}/${token}/`, {
      new_password: newPassword,
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const response = await api.post('/auth/logout/', {
          refresh: refreshToken,
        });
        return response.data;
      } catch (error) {
        // Even if logout API fails, we still want to clear local tokens
        console.error('Logout API failed:', error);
        throw error;
      }
    }
  },
};

export default api;

