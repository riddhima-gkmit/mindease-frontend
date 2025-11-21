import { useEffect, useState } from 'react';
import { Calendar, Users, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { getAppointments } from '../../api/appointments';
import type { Appointment } from '../../api/appointments';

interface TherapistDashboardProps {
  onNavigate: (view: any) => void;
}

export default function TherapistDashboard({ onNavigate }: TherapistDashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAppointments().catch(() => []);
        const allAppointments = Array.isArray(data) ? data : [];
        setAppointments(allAppointments);

        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysAppointments = allAppointments.filter(a => {
            try {
              const d = new Date(a.date);
              d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime() && 
                   (a.status === 'confirmed' || a.status === 'pending');
            } catch {
              return false;
            }
        });
        setTodaysAppointments(todaysAppointments);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);

  // Calculate stats
  const todayCount = todaysAppointments.length;
  
  // Get upcoming appointments (future appointments with confirmed or pending status)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments = appointments.filter(a => {
    try {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d >= today && (a.status === 'confirmed' || a.status === 'pending');
    } catch {
      return false;
    }
  });
  
  // Count unique patients from upcoming appointments only
  const activePatients = new Set(
    upcomingAppointments
      .map(a => a.patient_id || a.patient_email || a.id)
      .filter(id => id) // Filter out any undefined/null values
  ).size;
  
  // This week's appointments
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  
  const thisWeekCount = appointments.filter(a => {
    try {
      const d = new Date(a.date);
      return d >= weekStart && d < weekEnd && 
             (a.status === 'confirmed' || a.status === 'pending');
    } catch {
      return false;
    }
  }).length;

  // Format time for display
  const formatTime = (timeSlot?: string) => {
    if (!timeSlot) return 'N/A';
    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeSlot;
    }
  };

  // Get patient display name (first name + last name, with fallbacks)
  const getPatientDisplayName = (appointment: Appointment) => {
    if (appointment.patient_first_name || appointment.patient_last_name) {
      const parts = [appointment.patient_first_name, appointment.patient_last_name].filter(Boolean);
      return parts.join(' ') || appointment.patient_email || 'Patient';
    }
    return appointment.patient_email || 'Patient';
  };

  // Get patient initials
  const getInitials = (appointment: Appointment) => {
    if (appointment.patient_first_name && appointment.patient_last_name) {
      return `${appointment.patient_first_name[0]}${appointment.patient_last_name[0]}`.toUpperCase();
    }
    if (appointment.patient_first_name) {
      return appointment.patient_first_name[0].toUpperCase();
    }
    if (appointment.patient_email) {
      return appointment.patient_email[0].toUpperCase();
    }
    return 'P';
  };

  // Get appointment type from consultation mode or default
  const getAppointmentType = (_appointment: Appointment) => {
    // For now, default to Video Call, can be enhanced later
    return 'Video Call';
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
        <h1 className="text-2xl font-semibold mb-2">
          Dr. {user?.first_name || user?.last_name || user?.username || user?.email?.split('@')[0]}
        </h1>
        <p className="opacity-90">You have {todayCount} appointment{todayCount !== 1 ? 's' : ''} today</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <p className="text-2xl text-teal-600 mb-1">{todayCount}</p>
          <p className="text-gray-600 text-sm">Today</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl text-purple-600 mb-1">{activePatients}</p>
          <p className="text-gray-600 text-sm">Active Patients</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl text-blue-600 mb-1">{thisWeekCount}</p>
          <p className="text-gray-600 text-sm">This Week</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold">Today's Schedule</h3>
          </div>
          <Button
            onClick={() => onNavigate('therapist-appointments')}
            size="sm"
            variant="outline"
            className="rounded-2xl"
          >
            View All
          </Button>
        </div>

        {todaysAppointments.length > 0 ? (
          <div className="space-y-3">
            {todaysAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-gray-100 hover:border-teal-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {getInitials(appointment)}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">
                        {getPatientDisplayName(appointment)}
                      </p>
                      <p className="text-gray-600 text-sm">{formatTime(appointment.time_slot)}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white rounded-full text-purple-600 text-sm">
                    {getAppointmentType(appointment)}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                    onClick={() => onNavigate('therapist-appointments')}
                  >
                    Start Session
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-xl"
                    onClick={() => onNavigate('therapist-appointments')}
                  >
                    View Notes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No appointments scheduled for today</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => onNavigate('therapist-availability')}
            className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-2xl hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-800 font-medium">Manage Availability</p>
                <p className="text-gray-600 text-sm">Set your schedule</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('therapist-appointments')}
            className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-800 font-medium">View All Appointments</p>
                <p className="text-gray-600 text-sm">Manage sessions</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {appointments
            .filter(a => a.status === 'completed')
            .slice(0, 3)
            .map((appointment) => (
              <div key={appointment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm">
                    Session completed with {getPatientDisplayName(appointment)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(appointment.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            ))}
          {appointments.filter(a => a.status === 'completed').length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
