import api from './axios';
import type { RegisterData, LoginResponse, User } from '../types/user';


export const authAPI = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', { email, password });
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
};

