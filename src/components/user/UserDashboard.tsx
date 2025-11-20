import { useState, useEffect } from 'react';
import { Smile, Calendar, Lightbulb, TrendingUp, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { getAppointments } from '../../api/appointments';
import { getMoodEntries, getMoodAnalytics } from '../../api/mood';
import type { Appointment } from '../../api/appointments';
import type { MoodEntry } from '../../api/mood';

interface UserDashboardProps {
  onNavigate: (view: any, data?: any) => void;
}

const moodEmojis = ['😔', '😕', '😐', '🙂', '😄'];

export default function UserDashboard({ onNavigate }: UserDashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [moodAnalytics, setMoodAnalytics] = useState<{ average_mood: number; trend: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data with individual error handling
      const [appointmentsData, moodData, analyticsData] = await Promise.allSettled([
        getAppointments().catch((err) => {
          console.error('Error fetching appointments:', err);
          return [];
        }),
        getMoodEntries().catch((err) => {
          console.error('Error fetching mood entries:', err);
          return [];
        }),
        getMoodAnalytics().catch((err) => {
          console.error('Error fetching mood analytics:', err);
          return null;
        }),
      ]);

      // Process appointments
      const appointments = appointmentsData.status === 'fulfilled' ? appointmentsData.value : [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcoming = Array.isArray(appointments) ? appointments
        .filter(apt => {
          try {
            if (!apt || !apt.date) return false;
            const aptDate = new Date(apt.date);
            aptDate.setHours(0, 0, 0, 0);
            return (apt.status === 'confirmed' || apt.status === 'pending') && aptDate >= today;
          } catch (e) {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(`${a.date}T${a.time_slot || '00:00:00'}`);
            const dateB = new Date(`${b.date}T${b.time_slot || '00:00:00'}`);
            return dateA.getTime() - dateB.getTime();
          } catch (e) {
            return 0;
          }
        })
        .slice(0, 2) : [];

      setAppointments(upcoming);

      // Process mood entries
      const moods = moodData.status === 'fulfilled' ? moodData.value : [];
      setMoodEntries(Array.isArray(moods) ? moods : []);

      // Process analytics
      if (analyticsData.status === 'fulfilled' && analyticsData.value) {
        const analytics = analyticsData.value;
        if (analytics.average_mood && analytics.trend) {
          setMoodAnalytics({
            average_mood: analytics.average_mood,
            trend: analytics.trend,
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set empty states on error
      setAppointments([]);
      setMoodEntries([]);
      setMoodAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // Get today's mood
  const today = new Date().toISOString().split('T')[0];
  const todaysMood = moodEntries.find(mood => mood && mood.created_at && mood.created_at.startsWith(today));

  // Format time slot (assuming it's in HH:MM:SS format)
  const formatTime = (timeSlot: string) => {
    try {
      if (!timeSlot) return 'N/A';
      const [hours, minutes] = timeSlot.split(':');
      const hour = parseInt(hours, 10);
      if (isNaN(hour)) return timeSlot;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch (e) {
      return timeSlot;
    }
  };

  // Safe emoji getter
  const getMoodEmoji = (score: number) => {
    const index = Math.max(0, Math.min(4, Math.round(score) - 1));
    return moodEmojis[index] || moodEmojis[2]; // Default to middle emoji
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Greeting Header */}
      <div className="bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl p-6 text-white shadow-lg">
        <p className="opacity-90 mb-1">Welcome back,</p>
        <h1 className="text-2xl font-semibold mb-4">
          {user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user?.first_name 
            ? user.first_name
            : user?.username || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="opacity-90">How are you feeling today?</p>
      </div>

      {/* Today's Mood Status */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold">Today's Mood</h3>
          </div>
          <Button
            onClick={() => onNavigate('mood-tracker')}
            size="sm"
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Mood
          </Button>
        </div>

        {todaysMood && todaysMood.mood_score ? (
          <div className="flex items-center gap-4">
            <div className="text-4xl">{getMoodEmoji(todaysMood.mood_score)}</div>
            <div>
              <p className="text-gray-700">You're feeling pretty good!</p>
              <p className="text-gray-500 text-sm">
                {todaysMood.created_at ? (
                  `Logged at ${new Date(todaysMood.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                ) : (
                  'Logged today'
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">You haven't logged your mood today</p>
            <Button
              onClick={() => onNavigate('mood-tracker')}
              variant="outline"
              className="rounded-2xl"
            >
              Log Your Mood
            </Button>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold">Upcoming Appointments</h3>
          </div>
          <button
            onClick={() => onNavigate('therapist-directory')}
            className="text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium"
          >
            Book New
          </button>
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-gray-100 hover:border-teal-200 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-gray-800 font-medium">
                      {appointment.therapist_name || 'Therapist'}
                    </p>
                    {appointment.therapist_email && (
                      <p className="text-gray-600 text-sm">{appointment.therapist_email}</p>
                    )}
                  </div>
                  {appointment.status && (
                    <span className="px-3 py-1 bg-white rounded-full text-purple-600 text-xs font-medium capitalize">
                      {appointment.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  {appointment.date && (
                    <>
                      <span>
                        {new Date(appointment.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      {appointment.time_slot && (
                        <>
                          <span>•</span>
                          <span>{formatTime(appointment.time_slot)}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">No upcoming appointments</p>
            <Button
              onClick={() => onNavigate('therapist-directory')}
              className="bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl"
            >
              Find a Therapist
            </Button>
          </div>
        )}
      </div>

      {/* Mood Trend */}
      {moodAnalytics && (
        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold">Your Progress</h3>
          </div>
          <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl">
            <div>
              <p className="text-gray-700 mb-1">7-day average mood</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {getMoodEmoji(moodAnalytics.average_mood)}
                </span>
                <span className="text-teal-600 font-medium">
                  {moodAnalytics.trend === 'Improving' ? 'Good trend' : 'Needs attention'}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onNavigate('mood-tracker')}
              variant="outline"
              className="rounded-2xl"
            >
              View Details
            </Button>
          </div>
        </div>
      )}

      {/* Recommended Content Preview */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold">Recommended for You</h3>
          </div>
          <button
            onClick={() => onNavigate('recommendations')}
            className="text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium"
          >
            See All
          </button>
        </div>

        <div className="grid gap-3">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl">
            <h4 className="mb-1 font-medium">5-Minute Breathing Exercise</h4>
            <p className="text-gray-600 mb-2 text-sm">Reduce stress and anxiety with guided breathing</p>
            <span className="inline-block px-3 py-1 bg-white rounded-full text-purple-600 text-xs font-medium">Mindfulness</span>
          </div>
          <div className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl">
            <h4 className="mb-1 font-medium">Managing Daily Stress</h4>
            <p className="text-gray-600 mb-2 text-sm">Practical tips for a calmer day</p>
            <span className="inline-block px-3 py-1 bg-white rounded-full text-teal-600 text-xs font-medium">Article</span>
          </div>
        </div>
      </div>
    </div>
  );
}

