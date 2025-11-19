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
  day_of_week: string; // "Monday", "Tuesday", etc.
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
}

export interface CreateTherapistProfileData {
  specialization: string;
  experience_years: number;
  consultation_mode: 'online' | 'offline' | 'both';
  about?: string;
  clinic_address?: string;
}

export interface UpdateTherapistProfileData extends Partial<CreateTherapistProfileData> {}

export interface CreateAvailabilityData {
  day_of_week: string;
  start_time: string; // "09:00:00"
  end_time: string;   // "17:00:00"
}

// Get therapist profile for current user
export const getTherapistProfile = async (): Promise<TherapistProfile> => {
  const response = await api.get('/therapists/profile/');
  return response.data;
};

// Create therapist profile
export const createTherapistProfile = async (data: CreateTherapistProfileData): Promise<{ message: string }> => {
  const response = await api.post('/therapists/profile/', data);
  return response.data;
};

// Update therapist profile
export const updateTherapistProfile = async (data: UpdateTherapistProfileData): Promise<{ message: string }> => {
  const response = await api.put('/therapists/profile/', data);
  return response.data;
};

// Paginated response interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// List all approved therapists (public)
export const listTherapists = async (specialization?: string, page?: number, pageSize?: number): Promise<PaginatedResponse<TherapistProfile> | TherapistProfile[]> => {
  const params: any = {};
  if (specialization) params.specialization = specialization;
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get('/therapists/', { params });
  return response.data;
};

// Get therapist availability by therapist ID
export const getTherapistAvailability = async (therapistId: string): Promise<TherapistAvailability[]> => {
  const response = await api.get(`/therapists/availability/${therapistId}/`);
  return response.data;
};

// Create availability slot for current therapist
export const createAvailability = async (data: CreateAvailabilityData): Promise<{ message: string }> => {
  const response = await api.post('/therapists/availability/create/', data);
  return response.data;
};


