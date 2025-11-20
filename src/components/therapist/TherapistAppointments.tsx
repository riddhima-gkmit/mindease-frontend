import { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { getAppointments, cancelAppointment } from '../../api/appointments';
import type { Appointment } from '../../api/appointments';
import { Button } from '../ui/button';

export default function TherapistAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAppointments().catch(() => []);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      await load();
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4 pb-24">
      <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-teal-600" /> Appointments</h2>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {appointments.length ? (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-gray-800">
                  <p className="font-medium">Session</p>
                  <p className="text-sm text-gray-600">{new Date(a.date).toLocaleDateString()} • <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {a.time_slot?.slice(0,5) || 'N/A'}</span></p>
                </div>
                <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full capitalize">{a.status}</span>
              </div>
              {a.status === 'confirmed' && (
                <div className="mt-3">
                  <Button onClick={() => handleCancel(a.id)} variant="outline" className="rounded-2xl">Cancel</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No appointments to show</p>
        </div>
      )}
    </div>
  );
}


