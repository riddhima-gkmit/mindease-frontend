import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordReset from '../../components/auth/PasswordReset';

const requestPasswordReset = vi.fn();
vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      requestPasswordReset,
    }),
  };
});

function renderPR(onNavigate: (view: any) => void = vi.fn()) {
  return render(<PasswordReset onNavigate={onNavigate} />);
}

describe('PasswordReset', () => {
  it('submits email and shows submitted state', async () => {
    requestPasswordReset.mockResolvedValueOnce(undefined);

    renderPR();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });
  });

  it('shows 404 specific error', async () => {
    requestPasswordReset.mockRejectedValueOnce({ response: { status: 404 } });

    renderPR();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'missing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/no account found/i)).toBeInTheDocument();
  });
});


