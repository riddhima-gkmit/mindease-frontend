import api from './auth';

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

// Get all appointments for the current user
export const getAppointments = async (page?: number, pageSize?: number): Promise<PaginatedResponse<Appointment> | Appointment[]> => {
  const params: any = {};
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get('/appointments/', { params });
  return response.data;
};

// Create a new appointment
export const createAppointment = async (data: CreateAppointmentData): Promise<{ message: string }> => {
  const response = await api.post('/appointments/', data);
  return response.data;
};

// Cancel an appointment
export const cancelAppointment = async (appointmentId: string): Promise<{ message: string }> => {
  const response = await api.patch(`/appointments/${appointmentId}/cancel/`);
  return response.data;
};

// Add therapist notes to an appointment
export const addAppointmentNotes = async (appointmentId: string, therapistNote: string): Promise<{ message: string }> => {
  const response = await api.patch(`/appointments/${appointmentId}/notes/`, { therapist_note: therapistNote });
  return response.data;
};

