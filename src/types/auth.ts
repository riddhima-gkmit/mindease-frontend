export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'patient' | 'therapist';
  username?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    available_roles?: string[];
    has_profile?: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
  first_name?: string;
  last_name?: string;
  date_joined?: Date;
  has_profile?: boolean;
}
