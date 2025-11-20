import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordResetConfirm from '../../components/auth/PasswordResetConfirm';

const confirmPasswordReset = vi.fn();
vi.mock('../../contexts/AuthContext', () => {
  return {
    useAuth: () => ({
      confirmPasswordReset,
    }),
  };
});

function renderPRC(props?: Partial<React.ComponentProps<typeof PasswordResetConfirm>>) {
  const defaultProps = { uidb64: 'uid', token: 'token', onNavigate: vi.fn() };
  return render(<PasswordResetConfirm {...defaultProps} {...props} />);
}

describe('PasswordResetConfirm', () => {
  it('validates mismatched passwords', async () => {
    renderPRC();
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('validates minimum password length', async () => {
    renderPRC();
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/at least 7 characters/i)).toBeInTheDocument();
  });

  it('calls confirmPasswordReset and shows success', async () => {
    confirmPasswordReset.mockResolvedValueOnce(undefined);

    renderPRC();
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument();
  });
});


