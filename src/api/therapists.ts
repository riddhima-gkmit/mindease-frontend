import api from './auth';

export interface TherapistProfile {
  id: string;
  username: string;
  email: string;
  specialization: string;
  experience_years: number;
  consultation_mode: string;
  about?: string;
  clinic_address?: string;
  is_approved: boolean;
}

export interface TherapistAvailability {
  id: string;
  day_of_week: number;
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
}

export const listTherapists = async (specialization?: string): Promise<TherapistProfile[]> => {
  const params = specialization ? { specialization } : undefined;
  const response = await api.get('/therapists/', { params });
  return response.data;
};

export const getTherapistAvailability = async (therapistId: string): Promise<TherapistAvailability[]> => {
  const response = await api.get(`/therapists/availability/${therapistId}/`);
  return response.data;
};


