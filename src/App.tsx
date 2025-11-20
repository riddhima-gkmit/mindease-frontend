import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { authAPI } from './api/auth';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import EmailVerificationLink from './components/auth/EmailVerificationLink';
import PasswordReset from './components/auth/PasswordReset';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';

// Export View type for components that need it
export type View = 
  | 'login' 
  | 'register' 
  | 'email-verification' 
  | 'password-reset'
  | 'password-reset-confirm'
  | 'user-dashboard'
  | 'mood-tracker'
  | 'therapist-directory'
  | 'recommendations'
  | 'user-profile'
  | 'therapist-dashboard'
  | 'therapist-appointments'
  | 'therapist-availability'
  | 'admin-dashboard';

// Wrapper components for auth pages
function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to authenticated placeholder when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleNavigate = (view: string) => {
    if (view === 'register') navigate('/register');
    else if (view === 'password-reset') navigate('/password-reset');
    // Handle dashboard navigation - navigate to root which shows authenticated placeholder
    else if (view === 'admin-dashboard' || view === 'therapist-dashboard' || view === 'user-dashboard') {
      navigate('/', { replace: true });
    }
  };

  return <Login onNavigate={handleNavigate} />;
}

function RegisterPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    if (view === 'login') navigate('/login');
    else if (view === 'email-verification') navigate('/email-verification');
  };

  return <Register onNavigate={handleNavigate} />;
}

function EmailVerificationPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    if (view === 'login') navigate('/login');
  };

  return <EmailVerification onNavigate={handleNavigate} />;
}

function PasswordResetPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    if (view === 'login') navigate('/login');
  };

  return <PasswordReset onNavigate={handleNavigate} />;
}

// Component for email verification from URL
function EmailVerificationRoute() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    if (uidb64 && token) {
      const handleVerification = async () => {
        setVerifying(true);
        setVerificationError('');
        setVerificationSuccess(false);
        
        try {
          await authAPI.verifyEmail(uidb64, token);
          setVerificationSuccess(true);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } catch (err: any) {
          setVerificationError(err.response?.data?.error || err.message || 'Verification failed. The link may be invalid or expired.');
          setVerificationSuccess(false);
        } finally {
          setVerifying(false);
        }
      };
      handleVerification();
    }
  }, [uidb64, token, navigate]);

  const handleNavigate = (view: string) => {
    if (view === 'login') navigate('/login');
    else navigate('/');
  };

  return (
    <EmailVerificationLink
      verifying={verifying}
      error={verificationError}
      success={verificationSuccess}
      onNavigate={handleNavigate}
    />
  );
}

// Component for password reset from URL
function PasswordResetRoute() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();

  if (!uidb64 || !token) {
    return <Navigate to="/password-reset" replace />;
  }

  const handleNavigate = (view: string) => {
    if (view === 'login') navigate('/login');
    else navigate('/');
  };

  return (
    <PasswordResetConfirm 
      uidb64={uidb64} 
      token={token} 
      onNavigate={handleNavigate} 
    />
  );
}

// Authenticated placeholder component
function AuthenticatedPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white flex items-center justify-center p-4">
      <div className="text-center bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-teal-600 mb-4">
          Welcome, {user?.first_name} {user?.last_name}! <br /> 
          <span className="text-gray-500 text-sm">({user?.email})</span>
        </h1>
        <p className="text-gray-500 mb-6">Role: {user?.role}</p>
        <p className="text-gray-500 mb-6">Dashboard screens are disabled for this commit.</p>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-2xl h-12 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Root redirect component
function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedPlaceholder />;
  }

  return <Navigate to="/login" replace />;
}

function AppContent() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/email-verification" element={<EmailVerificationPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      
      {/* Dynamic routes for email verification and password reset */}
      <Route path="/verify-email/:uidb64/:token" element={<EmailVerificationRoute />} />
      <Route path="/reset-password/:uidb64/:token" element={<PasswordResetRoute />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
