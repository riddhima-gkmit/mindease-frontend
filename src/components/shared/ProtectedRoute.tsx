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
  // Check localStorage first for has_profile, then user state, then hook
  if (user && user.role === 'therapist' && requiredRole === 'therapist' && !allowWithoutProfile) {
    // Check localStorage first (most reliable)
    const storedHasProfile = localStorage.getItem('has_profile');
    const hasProfileFromStorage = storedHasProfile === 'true';
    
    // Check if therapist has profile - prioritize localStorage, then user state
    const shouldRedirectToProfile = storedHasProfile !== null 
      ? !hasProfileFromStorage  // If localStorage has value, use it
      : user.has_profile === false;  // Otherwise use user state
    
    if (shouldRedirectToProfile && location.pathname !== '/therapist/profile') {
      // Redirect to profile page if they don't have a profile
      return <Navigate to="/therapist/profile" replace />;
    }
    
    // If has_profile is true, allow access to dashboard (don't redirect)
    if (hasProfileFromStorage || user.has_profile === true) {
      // User has profile, allow access
      return <>{children}</>;
    }
    
    // Show loading while checking profile (for page reloads where has_profile might not be set yet)
    if (user.has_profile === undefined && storedHasProfile === null && profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Fallback: check hook result if localStorage and user state don't have value
    if (!profileLoading && !hasProfile && storedHasProfile === null && user.has_profile === undefined && location.pathname !== '/therapist/profile') {
      return <Navigate to="/therapist/profile" replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  return <>{children}</>;
}

