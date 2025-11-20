import api from './axios';
import type { Appointment, CreateAppointmentData } from '../types/appointments';

// Get all appointments for the current user
export const getAppointments = async (): Promise<Appointment[]> => {
  const response = await api.get('/appointments/');
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

