import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTherapistProfile } from './hooks/useTherapistProfile';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import EmailVerificationLink from './components/auth/EmailVerificationLink';
import PasswordReset from './components/auth/PasswordReset';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import TopNav from './components/shared/TopNav';
import BottomNav from './components/shared/BottomNav';
import ProtectedRoute from './components/shared/ProtectedRoute';
import UserDashboard from './components/user/UserDashboard';
import UserProfile from './components/user/UserProfile';
import MoodTracker from './components/user/MoodTracker';
import Recommendations from './components/user/Recommendations';
import TherapistDirectory from './components/user/TherapistDirectory';
import TherapistDashboard from './components/therapist/TherapistDashboard';
import TherapistAppointments from './components/therapist/TherapistAppointments';
import TherapistAvailability from './components/therapist/TherapistAvailability';
import TherapistProfile from './components/therapist/TherapistProfile';
import PWABadge from './components/PWABadge';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';

// Helper function to convert view to path
const viewToPath = (view: string, role: 'user' | 'therapist' = 'user'): string => {
  if (role === 'therapist') {
    if (view === 'therapist-dashboard') return '/therapist/dashboard';
    if (view === 'therapist-appointments') return '/therapist/appointments';
    if (view === 'therapist-availability') return '/therapist/availability';
    if (view === 'therapist-profile') return '/therapist/profile';
    if (view === 'user-profile') return '/therapist/profile';
    return '/therapist/dashboard';
  } else {
    if (view === 'user-dashboard') return '/dashboard';
    if (view === 'mood-tracker') return '/mood-tracker';
    if (view === 'therapist-directory') return '/therapist-directory';
    if (view === 'recommendations') return '/recommendations';
    if (view === 'user-profile') return '/profile';
    return '/dashboard';
  }
};

// Helper function to convert path to view
const pathToView = (path: string, role: 'user' | 'therapist' = 'user'): string => {
  if (role === 'therapist') {
    if (path === '/therapist/dashboard') return 'therapist-dashboard';
    if (path === '/therapist/appointments') return 'therapist-appointments';
    if (path === '/therapist/availability') return 'therapist-availability';
    if (path === '/therapist/profile') return 'therapist-profile';
    return 'therapist-dashboard';
  } else {
    if (path === '/dashboard' || path === '/') return 'user-dashboard';
    if (path === '/mood-tracker') return 'mood-tracker';
    if (path === '/therapist-directory') return 'therapist-directory';
    if (path === '/recommendations') return 'recommendations';
    if (path === '/profile') return 'user-profile';
    return 'user-dashboard';
  }
};

// Layout component for authenticated user pages
function UserLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'user'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white">
      <TopNav onNavigate={handleNavigate} />
      <main className="pb-20">
        {children}
      </main>
      <BottomNav 
        currentView={pathToView(location.pathname, 'user')} 
        onNavigate={handleNavigate}
        role="user"
      />
    </div>
  );
}

// Layout component for therapist pages
function TherapistLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasProfile, loading: profileLoading } = useTherapistProfile();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'therapist'));
  };

  // Don't show bottom nav if therapist doesn't have a profile
  const showBottomNav = !profileLoading && hasProfile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white">
      <TopNav onNavigate={handleNavigate} />
      <main className={showBottomNav ? 'pb-20' : ''}>
        {children}
      </main>
      {showBottomNav && (
        <BottomNav 
          currentView={pathToView(location.pathname, 'therapist')} 
          onNavigate={handleNavigate}
          role="therapist"
        />
      )}
    </div>
  );
}

// Wrapper components for auth pages
function LoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role from login response
      if (user.role === 'therapist') {
        navigate('/therapist/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleNavigate = (view: string) => {
    if (view === 'register') navigate('/register');
    else if (view === 'password-reset') navigate('/password-reset');
    else if (view === 'user-dashboard') navigate('/dashboard');
    else if (view === 'therapist-dashboard') navigate('/therapist/dashboard');
    else if (view === 'admin-dashboard') navigate('/admin/dashboard');
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
  const { verifyEmail } = useAuth();
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
          await verifyEmail(uidb64, token);
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
  }, [uidb64, token, verifyEmail, navigate]);

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

// Redirect component based on user role
function DashboardRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role === 'therapist' ? 'therapist' : 
                  user?.role === 'admin' ? 'admin' : 
                  'user';

  if (userRole === 'therapist') {
    // Always redirect to dashboard - ProtectedRoute will handle profile check
    return <Navigate to="/therapist/dashboard" replace />;
  } else if (userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
}

// Admin dashboard placeholder
function AdminDashboard() {
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
        <p className="text-gray-600 mb-4">Role: {user?.role}</p>
        <p className="text-gray-500 mb-6">Admin screens will be implemented next.</p>
        <Button onClick={handleLogout} variant="outline" className="w-full rounded-2xl h-12 flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Wrapper components for user pages
function UserDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (view: string | { view: string; tab?: string }) => {
    if (typeof view === 'string') {
      navigate(viewToPath(view, 'user'));
    } else {
      const path = viewToPath(view.view, 'user');
      const searchParams = new URLSearchParams(location.search);
      if (view.tab) {
        searchParams.set('tab', view.tab);
      }
      navigate(`${path}?${searchParams.toString()}`);
    }
  };

  return <UserDashboard onNavigate={handleNavigate} />;
}

function MoodTrackerPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (viewOrData: string | { view: string; tab?: string }) => {
    if (typeof viewOrData === 'string') {
      navigate(viewToPath(viewOrData, 'user'));
    } else {
      const path = viewToPath(viewOrData.view, 'user');
      const searchParams = new URLSearchParams(location.search);
      if (viewOrData.tab) {
        searchParams.set('tab', viewOrData.tab);
      }
      navigate(`${path}?${searchParams.toString()}`);
    }
  };

  return <MoodTracker onNavigate={handleNavigate} />;
}

function TherapistDirectoryPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'user'));
  };

  return <TherapistDirectory onNavigate={handleNavigate} />;
}

function RecommendationsPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'user'));
  };

  return <Recommendations onNavigate={handleNavigate} />;
}

function UserProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.pathname.startsWith('/therapist') ? 'therapist' : 'user';

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, role));
  };

  return <UserProfile onNavigate={handleNavigate} />;
}

// Wrapper components for therapist pages
function TherapistDashboardPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'therapist'));
  };

  return <TherapistDashboard onNavigate={handleNavigate} />;
}

function TherapistAppointmentsPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'therapist'));
  };

  return <TherapistAppointments onNavigate={handleNavigate} />;
}

function TherapistAvailabilityPage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'therapist'));
  };

  return <TherapistAvailability onNavigate={handleNavigate} />;
}

function TherapistProfilePage() {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(viewToPath(view, 'therapist'));
  };

  return <TherapistProfile onNavigate={handleNavigate} />;
}

function AppContent() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/email-verification" element={<EmailVerificationPage />} />
      <Route path="/password-reset" element={<PasswordResetPage />} />
      
      {/* Dynamic routes for email verification and password reset */}
      <Route path="/verify-email/:uidb64/:token" element={<EmailVerificationRoute />} />
      <Route path="/reset-password/:uidb64/:token" element={<PasswordResetRoute />} />

      {/* Protected user routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <UserLayout>
            <UserDashboardPage />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/mood-tracker" element={
        <ProtectedRoute>
          <UserLayout>
            <MoodTrackerPage />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/therapist-directory" element={
        <ProtectedRoute>
          <UserLayout>
            <TherapistDirectoryPage />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/recommendations" element={
        <ProtectedRoute>
          <UserLayout>
            <RecommendationsPage />
          </UserLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <UserLayout>
            <UserProfilePage />
          </UserLayout>
        </ProtectedRoute>
      } />

      {/* Protected therapist routes */}
      <Route path="/therapist/dashboard" element={
        <ProtectedRoute requiredRole="therapist">
          <TherapistLayout>
            <TherapistDashboardPage />
          </TherapistLayout>
        </ProtectedRoute>
      } />
      <Route path="/therapist/appointments" element={
        <ProtectedRoute requiredRole="therapist">
          <TherapistLayout>
            <TherapistAppointmentsPage />
          </TherapistLayout>
        </ProtectedRoute>
      } />
      <Route path="/therapist/availability" element={
        <ProtectedRoute requiredRole="therapist">
          <TherapistLayout>
            <TherapistAvailabilityPage />
          </TherapistLayout>
        </ProtectedRoute>
      } />
      <Route path="/therapist/profile" element={
        <ProtectedRoute requiredRole="therapist" allowWithoutProfile={true}>
          <TherapistLayout>
            <TherapistProfilePage />
          </TherapistLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Root redirect */}
      <Route path="/" element={<DashboardRedirect />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<DashboardRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <PWABadge />
    </AuthProvider>
  );
}
