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
