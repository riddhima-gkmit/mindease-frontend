import { useState, useEffect, useCallback } from 'react';
import { getTherapistProfile } from '../api/therapists';
import type { TherapistProfile } from '../types/therapists';
import { useAuth } from '../contexts/AuthContext';

// Global state to cache profile data and share across components
let globalProfileState: {
  profile: TherapistProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
} = {
  profile: null,
  loading: false,
  error: null,
  hasProfile: false,
};

// Track if we've initiated a fetch to avoid duplicate calls
// Reset this when user changes to allow fresh fetches
let fetchInitiated = false;
let lastUserId: string | null = null;

// Subscribers that will be notified when profile data changes
const subscribers = new Set<() => void>();

// Function to notify all subscribers
const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

// Function to fetch profile and update global state
const fetchProfile = async () => {
  if (fetchInitiated) return; // Prevent duplicate fetches
  fetchInitiated = true;

  try {
    globalProfileState = { ...globalProfileState, loading: true, error: null };
    notifySubscribers();

    const data = await getTherapistProfile();
    globalProfileState = {
      profile: data,
      loading: false,
      error: null,
      hasProfile: true,
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      // Profile doesn't exist yet - not an error
      globalProfileState = {
        profile: null,
        loading: false,
        error: null,
        hasProfile: false,
      };
    } else {
      // Actual error
      globalProfileState = {
        profile: null,
        loading: false,
        error: err.response?.data?.error || 'Failed to load profile',
        hasProfile: false,
      };
    }
  }
  notifySubscribers();
};

// Export function to trigger profile refetch (used after profile creation/update)
export const triggerProfileRefetch = () => {
  fetchInitiated = false; // Reset flag to allow refetch
  fetchProfile();
};

// Custom hook to use therapist profile
export const useTherapistProfile = () => {
  const { user } = useAuth();
  const [state, setState] = useState(globalProfileState);

  useEffect(() => {
    // Subscribe to profile changes
    const callback = () => setState(globalProfileState);
    subscribers.add(callback);

    // Reset fetchInitiated if user changed (new login)
    if (user?.id && user.id !== lastUserId) {
      fetchInitiated = false;
      lastUserId = user.id;
    }

    // Check localStorage first to see if has_profile is set
    const storedHasProfile = localStorage.getItem('has_profile');
    const hasProfileFromStorage = storedHasProfile === 'true';
    
    // Only proceed if user is a therapist (or if we can't determine role yet, check localStorage)
    const isTherapist = user?.role === 'therapist';
    
    // If user is not a therapist, don't fetch therapist profile
    if (user && !isTherapist) {
      globalProfileState = {
        profile: null,
        loading: false,
        error: null,
        hasProfile: false,
      };
      fetchInitiated = true;
      setState(globalProfileState);
    }
    // If therapist without profile, skip API call
    else if (isTherapist && (user?.has_profile === false || storedHasProfile === 'false')) {
      // Skip API call, set hasProfile to false immediately
      globalProfileState = {
        profile: null,
        loading: false,
        error: null,
        hasProfile: false,
      };
      fetchInitiated = true; // Mark as fetched to prevent redundant calls
      setState(globalProfileState);
    }
    // If therapist with profile (has_profile is true), fetch the profile
    else if (isTherapist && (hasProfileFromStorage || user?.has_profile === true)) {
      // If has_profile is true, immediately set hasProfile to true
      // This ensures navbar shows immediately, even before API call completes
      const needsFetch = !globalProfileState.profile && !fetchInitiated;
      
      globalProfileState = {
        ...globalProfileState,
        hasProfile: true,
        loading: needsFetch, // Set loading only if we need to fetch
      };
      setState(globalProfileState);
      
      // Always fetch profile data if has_profile is true and we don't have profile data yet
      if (needsFetch) {
        fetchProfile();
      }
    }
    // If user is not loaded yet but localStorage says has_profile is true, prepare to fetch
    // This case should be rare, but handle it to ensure we fetch when user becomes available
    else if (!user && hasProfileFromStorage && !fetchInitiated) {
      // User not loaded yet, but we know has_profile is true
      // Set hasProfile to true immediately, will fetch when user is available
      globalProfileState = {
        ...globalProfileState,
        hasProfile: true,
        loading: true,
      };
      setState(globalProfileState);
    }

    // Cleanup: unsubscribe when component unmounts
    return () => {
      subscribers.delete(callback);
    };
  }, [user?.has_profile, user?.role, user]);

  const refetch = useCallback(() => {
    fetchInitiated = false; // Reset flag to allow refetch
    fetchProfile();
  }, []);

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    hasProfile: state.hasProfile,
    refetch,
  };
};

