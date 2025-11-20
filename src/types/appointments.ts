export type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: string;
  therapist_id: string;
  therapist_name: string;
  therapist_email: string;
  date: string;
  time_slot: string;
  status: Status;
  therapist_note?: string;
}

export interface CreateAppointmentData {
  therapist_id: string;
  date: string;
  time_slot: string;
}