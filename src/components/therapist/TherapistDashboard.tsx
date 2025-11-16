import { useEffect, useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAppointments } from '../../api/appointments';
import type { Appointment } from '../../api/appointments';
import { Button } from '../ui/button';

interface TherapistDashboardProps {
  onNavigate: (view: any, data?: any) => void;
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
        // Upcoming for therapist (confirmed or pending, future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = (Array.isArray(data) ? data : [])
          .filter(a => {
            try {
              const d = new Date(a.date);
              d.setHours(0, 0, 0, 0);
              return (a.status === 'confirmed' || a.status === 'pending') && d >= today;
            } catch {
              return false;
            }
          })
          .slice(0, 3);
        setAppointments(upcoming);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      <div className="bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl p-6 text-white shadow-lg">
        <p className="opacity-90 mb-1">Welcome back,</p>
        <h1 className="text-2xl font-semibold mb-2">
          Dr. {user?.first_name || user?.username || user?.email?.split('@')[0]}
        </h1>
        <p className="opacity-90">Here are your upcoming sessions</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold">Upcoming Sessions</h3>
          </div>
          <Button
            onClick={() => onNavigate('therapist-appointments')}
            variant="outline"
            className="rounded-2xl"
          >
            View All
          </Button>
        </div>
        {appointments.length ? (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-800">
                    <User className="w-4 h-4 text-teal-600" />
                    <span>{a.therapist_email ? a.therapist_email : 'Patient'}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white rounded-full capitalize">{a.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-gray-600 text-sm">
                  <span>{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {a.time_slot?.slice(0,5) || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No upcoming sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}


