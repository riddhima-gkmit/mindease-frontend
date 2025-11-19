import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTherapistProfile } from '../../hooks/useTherapistProfile';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'therapist' | 'admin';
  allowWithoutProfile?: boolean; // Allow access even if therapist doesn't have profile (for profile page itself)
}

export default function ProtectedRoute({ children, requiredRole, allowWithoutProfile = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { hasProfile, loading: profileLoading } = useTherapistProfile();

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user's actual role
    if (user?.role === 'therapist') {
      return <Navigate to="/therapist/dashboard" replace />;
    } else if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // For therapists, check if they have a profile (unless this route allows access without profile)
  // Only check if user is loaded (not null) to avoid premature redirects on page refresh
  if (user && user.role === 'therapist' && requiredRole === 'therapist' && !allowWithoutProfile) {
    // Show loading while checking profile
    if (profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Only redirect if profile check is complete and therapist doesn't have a profile
    // This prevents redirects during the initial profile check on page refresh
    if (!profileLoading && !hasProfile && location.pathname !== '/therapist/profile') {
      return <Navigate to="/therapist/profile" replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
}

