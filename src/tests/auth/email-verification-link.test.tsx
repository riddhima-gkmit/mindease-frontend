import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmailVerificationLink from '../../components/auth/EmailVerificationLink';

const onNavigate = vi.fn();

describe('EmailVerificationLink', () => {
  it('shows verifying state', () => {
    render(<EmailVerificationLink verifying error={null} success={false} onNavigate={onNavigate} />);
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(<EmailVerificationLink verifying={false} error="Invalid link" success={false} onNavigate={onNavigate} />);
    expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
  });

  it('shows success state', () => {
    render(<EmailVerificationLink verifying={false} error={null} success onNavigate={onNavigate} />);
    expect(screen.getByText(/email verified successfully/i)).toBeInTheDocument();
  });
});


