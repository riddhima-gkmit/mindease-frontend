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
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(onNavigate).toHaveBeenCalledWith('user-dashboard');
    });
  });

  it('navigates to admin dashboard when email includes admin', async () => {
    const onNavigate = vi.fn();
    login.mockResolvedValueOnce(undefined);

    renderLogin(onNavigate);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@company.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('admin-dashboard');
    });
  });

  it('navigates to therapist dashboard when email includes therapist', async () => {
    const onNavigate = vi.fn();
    login.mockResolvedValueOnce(undefined);

    renderLogin(onNavigate);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'therapist@company.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('therapist-dashboard');
    });
  });

  it('shows error when login fails', async () => {
    const error = { response: { data: { error: 'Invalid email or password' } } };
    login.mockRejectedValueOnce(error);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
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


