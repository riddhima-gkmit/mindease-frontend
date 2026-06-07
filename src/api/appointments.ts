import api from './auth';
import type { Appointment, CreateAppointmentData, PaginatedResponse } from '../types/appointments';


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

// Get booked time slots for a specific therapist on a specific date
export const getTherapistBookedSlots = async (therapistId: string, date: string): Promise<string[]> => {
  const response = await api.get(`/appointments/therapist/${therapistId}/booked-slots/`, {
    params: { date }
  });
  return response.data.booked_slots || [];
};

// Approve or reject a pending appointment (therapist only)
export const approveAppointment = async (appointmentId: string): Promise<{ message: string }> => {
  const response = await api.patch(`/appointments/${appointmentId}/approve-reject/`, { action: 'approve' });
  return response.data;
};

export const rejectAppointment = async (appointmentId: string): Promise<{ message: string }> => {
  const response = await api.patch(`/appointments/${appointmentId}/approve-reject/`, { action: 'reject' });
  return response.data;
};
