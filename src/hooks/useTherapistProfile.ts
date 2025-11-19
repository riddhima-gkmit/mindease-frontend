import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTherapistProfile } from '../api/therapists';
import type { TherapistProfile } from '../api/therapists';

// Custom event name for profile updates
const PROFILE_UPDATE_EVENT = 'therapist-profile-updated';

export function useTherapistProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  const checkProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTherapistProfile();
      setProfile(data);
      setHasProfile(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Profile doesn't exist
        setProfile(null);
        setHasProfile(false);
      } else {
        // Other error - assume no profile for safety
        setProfile(null);
        setHasProfile(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish loading before checking profile
    if (authLoading) {
      return;
    }

    // Only check profile if user is a therapist
    if (user?.role === 'therapist') {
      checkProfile();
    } else {
      // Not a therapist, so no profile needed
      setLoading(false);
      setHasProfile(false);
    }

    // Listen for profile update events
    const handleProfileUpdate = () => {
      if (user?.role === 'therapist') {
        checkProfile();
      }
    };

    window.addEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate);

    return () => {
      window.removeEventListener(PROFILE_UPDATE_EVENT, handleProfileUpdate);
    };
  }, [user?.role, authLoading, checkProfile]);

  return { profile, hasProfile, loading, refetch: checkProfile };
}

// Helper function to trigger profile refetch across all components
export function triggerProfileRefetch() {
  window.dispatchEvent(new Event(PROFILE_UPDATE_EVENT));
}

