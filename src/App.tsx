import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import EmailVerificationLink from './components/auth/EmailVerificationLink';
import PasswordReset from './components/auth/PasswordReset';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import TopNav from './components/shared/TopNav';
import MoodTracker from './components/user/MoodTracker';
import BottomNav from './components/shared/BottomNav';
import UserDashboard from './components/user/UserDashboard';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';

type View = 
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

function AppContent() {
  const { user, isAuthenticated, loading, logout, verifyEmail } = useAuth();
  const [currentView, setCurrentView] = useState<View>('login');
  const [urlParams, setUrlParams] = useState<{ uidb64?: string; token?: string }>({});
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const navigate = (view: View) => {
    setCurrentView(view);
    // Clear URL params and verification state when navigating away
    if (view !== 'password-reset-confirm' && view !== 'email-verification') {
      window.history.replaceState({}, '', '/');
      setUrlParams({});
      setVerifying(false);
      setVerificationError('');
      setVerificationSuccess(false);
    }
    // Reset verification state when navigating to email-verification from registration
    if (view === 'email-verification' && !urlParams.uidb64) {
      setVerifying(false);
      setVerificationError('');
      setVerificationSuccess(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('login');
  };

  const handleEmailVerification = async (uidb64: string, token: string) => {
    setVerifying(true);
    setVerificationError('');
    setVerificationSuccess(false);
    
    try {
      await verifyEmail(uidb64, token);
      setVerificationSuccess(true);
      // Clear URL after successful verification
      window.history.replaceState({}, '', '/');
      // Success - redirect to login after a moment
      setTimeout(() => {
        navigate('login');
      }, 2000);
    } catch (err: any) {
      setVerificationError(err.response?.data?.error || err.message || 'Verification failed. The link may be invalid or expired.');
      setVerificationSuccess(false);
    } finally {
      setVerifying(false);
    }
  };

  // Determine user role for navigation (backend uses 'patient', frontend uses 'user')
  const userRole = user?.role === 'therapist' ? 'therapist' : 'user';
  const isPatient = user?.role === 'patient' || user?.role === 'user' || (!user?.role || (user?.role !== 'therapist' && user?.role !== 'admin'));

  // Check URL on mount for email verification or password reset
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for email verification route: /verify-email/:uidb64/:token
    if (path.startsWith('/verify-email/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 3) {
        const [, uidb64, token] = parts;
        setUrlParams({ uidb64, token });
        setCurrentView('email-verification');
        // Automatically verify email
        handleEmailVerification(uidb64, token);
      }
    }
    
    // Check for password reset route: /reset-password/:uidb64/:token
    if (path.startsWith('/reset-password/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 3) {
        const [, uidb64, token] = parts;
        setUrlParams({ uidb64, token });
        setCurrentView('password-reset-confirm');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default view when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // List of auth views that should redirect to dashboard
      const authViews = ['login', 'register', 'email-verification', 'password-reset', 'password-reset-confirm'];
      
      // If we're on an auth view or not on a dashboard view, redirect to appropriate dashboard
      if (authViews.includes(currentView) || 
          (!['user-dashboard', 'mood-tracker', 'therapist-directory', 'recommendations', 'user-profile', 'therapist-dashboard', 'admin-dashboard'].includes(currentView))) {
        if (userRole === 'user') {
          setCurrentView('user-dashboard');
        } else if (userRole === 'therapist') {
          setCurrentView('therapist-dashboard');
        } else if (user?.role === 'admin') {
          setCurrentView('admin-dashboard');
        }
      }
    }
  }, [isAuthenticated, user, userRole, currentView]);

  // Show loading state while checking authentication
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

  // Auth screens
  if (!isAuthenticated) {
    // Handle email verification from URL (when user clicks link from email)
    if (currentView === 'email-verification' && urlParams.uidb64 && urlParams.token) {
      return (
        <EmailVerificationLink
          verifying={verifying}
          error={verificationError}
          success={verificationSuccess}
          onNavigate={navigate}
        />
      );
    }

    // Handle password reset confirm from URL (when user clicks link from email)
    if (currentView === 'password-reset-confirm' && urlParams.uidb64 && urlParams.token) {
      return (
        <PasswordResetConfirm 
          uidb64={urlParams.uidb64} 
          token={urlParams.token} 
          onNavigate={navigate} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white">
        {currentView === 'login' && <Login onNavigate={navigate} />}
        {currentView === 'register' && <Register onNavigate={navigate} />}
        {/* Email verification screen shown after registration */}
        {currentView === 'email-verification' && !urlParams.uidb64 && <EmailVerification onNavigate={navigate} />}
        {currentView === 'password-reset' && <PasswordReset onNavigate={navigate} />}
      </div>
    );
  }

  // Authenticated - show dashboard
  
  if (isAuthenticated && isPatient) {
    // Ensure we have a valid view
    const displayView = currentView === 'user-dashboard' || 
                       ['mood-tracker', 'therapist-directory', 'recommendations', 'user-profile'].includes(currentView) 
                       ? currentView 
                       : 'user-dashboard';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white">
        <TopNav onNavigate={navigate} />
        <main className="pb-20">
          {displayView === 'user-dashboard' && <UserDashboard onNavigate={navigate} />}
          {displayView === 'mood-tracker' && <MoodTracker onNavigate={navigate} />}
        </main>
        <BottomNav 
          currentView={displayView} 
          onNavigate={navigate}
          role="user"
        />
      </div>
    );
  }

  // Therapist dashboard screens
  if (isAuthenticated && userRole === 'therapist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white">
        <TopNav onNavigate={navigate} />
        <main className="pb-20">
          {currentView === 'therapist-dashboard' && (
            // Lazy import removed for simplicity
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            (() => {
              const Comp = require('./components/therapist/TherapistDashboard').default;
              return <Comp onNavigate={navigate} />;
            })()
          )}
          {currentView === 'therapist-appointments' && (
            (() => {
              const Comp = require('./components/therapist/TherapistAppointments').default;
              return <Comp />;
            })()
          )}
          {currentView === 'therapist-availability' && (
            (() => {
              const Comp = require('./components/therapist/TherapistAvailability').default;
              return <Comp />;
            })()
          )}
        </main>
        <BottomNav currentView={currentView} onNavigate={navigate} role="therapist" />
      </div>
    );
  }

  // Fallback (admin or unknown role)
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white flex items-center justify-center p-4">
      <div className="text-center bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-teal-600 mb-4">Welcome, {user?.first_name} {user?.last_name}! <br /> <span className="text-gray-500 text-sm">({user?.email})</span></h1>
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
