export interface Appointment {
  id: string;
  therapist: string;
  therapist_id?: string;
  therapist_name: string;
  therapist_email: string;
  patient_id?: string;
  patient_email?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  therapist_note?: string;
}

export interface CreateAppointmentData {
  therapist: string;
  date: string;
  time_slot: string;
}

// Paginated response interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}