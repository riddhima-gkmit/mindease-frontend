import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../components/auth/Login';

const login = vi.fn();
vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      login,
    }),
  };
});

function renderLogin(onNavigate: (view: any) => void = vi.fn()) {
  return render(<Login onNavigate={onNavigate} />);
}

describe('Login', () => {
  it('calls login and navigates to user dashboard by default', async () => {
    const onNavigate = vi.fn();
    login.mockResolvedValueOnce(undefined);

    renderLogin(onNavigate);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Login now includes role parameter (defaults to 'patient')
      expect(login).toHaveBeenCalledWith('user@example.com', 'password123', 'patient');
      // Navigation is now handled by App.tsx, not onNavigate
    });
  });

  it('calls login with patient role by default', async () => {
    const onNavigate = vi.fn();
    login.mockResolvedValueOnce(undefined);

    renderLogin(onNavigate);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@company.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Login always includes role parameter (defaults to 'patient')
      // Note: Navigation is now handled by App.tsx based on user role from backend
      expect(login).toHaveBeenCalledWith('admin@company.com', 'password123', 'patient');
    });
  });

  it('calls login with therapist role when therapist role is selected', async () => {
    const onNavigate = vi.fn();
    login.mockResolvedValueOnce(undefined);

    renderLogin(onNavigate);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'therapist@company.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    // Click the therapist role button - find button containing "Therapist" text but not "Sign In"
    const buttons = screen.getAllByRole('button');
    const therapistButton = buttons.find(button => 
      button.textContent?.includes('Therapist') && !button.textContent?.includes('Sign In')
    );
    expect(therapistButton).toBeDefined();
    fireEvent.click(therapistButton!);
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Login should be called with 'therapist' role when therapist button is selected
      expect(login).toHaveBeenCalledWith('therapist@company.com', 'password123', 'therapist');
      // Navigation is now handled by App.tsx based on user role from backend
    });
  });

  it('shows error when login fails', async () => {
    const error = { response: { data: { error: 'Invalid email or password' } } };
    login.mockRejectedValueOnce(error);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('navigates to password reset screen on link click', () => {
    const onNavigate = vi.fn();
    renderLogin(onNavigate);
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
    expect(onNavigate).toHaveBeenCalledWith('password-reset');
  });
});


