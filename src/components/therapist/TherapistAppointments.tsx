import { useState, useEffect } from 'react';
import { Calendar, Video, MapPin, FileText, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { getAppointments, addAppointmentNotes, type PaginatedResponse } from '../../api/appointments';
import type { Appointment } from '../../api/appointments';
import Pagination from '../ui/pagination';

interface TherapistAppointmentsProps {
  onNavigate: (view: any) => void;
}

export default function TherapistAppointments({ onNavigate: _onNavigate }: TherapistAppointmentsProps) {
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadAppointments(currentPage);
  }, [currentPage]);

  const loadAppointments = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await getAppointments(page, pageSize).catch(() => []);
      
      // Check if response is paginated
      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<Appointment>;
        setAppointments(paginatedData.results);
        setTotalPages(Math.ceil(paginatedData.count / pageSize));
        setTotalItems(paginatedData.count);
      } else {
        // Fallback for non-paginated response (backward compatibility)
        const appointmentsArray = data as Appointment[];
        setAppointments(appointmentsArray);
        setTotalPages(1);
        setTotalItems(appointmentsArray.length);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
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
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    // Sort by time if same date
    const timeA = a.time_slot || '';
    const timeB = b.time_slot || '';
    return timeA.localeCompare(timeB);
  });

  const pastAppointments = appointments.filter(a => {
    try {
      const d = new Date(a.date);
      d.setHours(0, 0, 0, 0);
      return d < today || a.status === 'completed' || a.status === 'cancelled';
    } catch {
      return false;
    }
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateB - dateA; // Reverse for past
    const timeA = a.time_slot || '';
    const timeB = b.time_slot || '';
    return timeB.localeCompare(timeA);
  });

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

  const getPatientEmail = (appointment: Appointment) => {
    return appointment.patient_email || 'Appointment';
  };

  const getAppointmentType = (_appointment: Appointment) => {
    // Default to Video Call, can be enhanced later with consultation_mode
    return 'Video Call';
  };

  const handleAddNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSessionNotes(appointment.therapist_note || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;

    try {
      setSavingNotes(true);
      setError('');
      await addAppointmentNotes(selectedAppointment.id, sessionNotes);
      
      // Update local state
      setAppointments(prev => prev.map(a => 
        a.id === selectedAppointment.id 
          ? { ...a, therapist_note: sessionNotes, status: 'completed' as const }
          : a
      ));
      
      setShowNotesModal(false);
      setSessionNotes('');
      setSelectedAppointment(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
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
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Appointments</h1>
        <p className="text-gray-600">Manage your patient sessions</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {/* Toggle View */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-md">
        <button
          onClick={() => setView('upcoming')}
          className={`flex-1 py-3 rounded-xl transition-all ${
            view === 'upcoming'
              ? 'bg-gradient-to-r from-teal-400 to-purple-400 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setView('past')}
          className={`flex-1 py-3 rounded-xl transition-all ${
            view === 'past'
              ? 'bg-gradient-to-r from-teal-400 to-purple-400 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Past Sessions
        </button>
      </div>

      {/* Appointments List */}
      {view === 'upcoming' && (
        <div className="space-y-4">
          {upcomingAppointments.length > 0 ? (
            <>
              {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-3xl p-6 shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-purple-400 rounded-2xl flex items-center justify-center text-white font-semibold">
                      {getInitials(appointment)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {getPatientDisplayName(appointment)}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {getPatientEmail(appointment)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {appointment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(appointment.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(appointment.time_slot)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    {getAppointmentType(appointment) === 'Video Call' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span className="text-sm">{getAppointmentType(appointment)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                  >
                    Start Session
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => handleAddNotes(appointment)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Notes
                  </Button>
                </div>
              </div>
              ))}
              {upcomingAppointments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={pageSize}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No upcoming appointments</p>
            </div>
          )}
        </div>
      )}

      {view === 'past' && (
        <div className="space-y-4">
          {pastAppointments.length > 0 ? (
            <>
              {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-3xl p-6 shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center text-white font-semibold">
                      {getInitials(appointment)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {getPatientDisplayName(appointment)}
                      </h4>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(appointment.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span>{formatTime(appointment.time_slot)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                    {appointment.status}
                  </span>
                </div>

                {appointment.therapist_note && (
                  <div className="p-4 bg-gray-50 rounded-2xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700 font-medium">Session Notes</span>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{appointment.therapist_note}</p>
                </div>
              )}

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => handleAddNotes(appointment)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  {appointment.therapist_note ? 'Edit Notes' : 'Add Notes'}
                </Button>
              </div>
              ))}
              {pastAppointments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  itemsPerPage={pageSize}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No past appointments</p>
            </div>
          )}
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Session Notes</h3>
            <p className="text-gray-600 mb-4">
              Patient: <strong>{getPatientDisplayName(selectedAppointment)}</strong>
            </p>
            <p className="text-gray-600 mb-4 text-sm">
              Date: {new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric',
                year: 'numeric'
              })} at {formatTime(selectedAppointment.time_slot)}
            </p>

            <Textarea
              placeholder="Enter your session notes here..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="rounded-2xl min-h-48 mb-4"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex-1 bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl"
              >
                {savingNotes ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowNotesModal(false);
                  setSessionNotes('');
                  setSelectedAppointment(null);
                  setError('');
                }}
                variant="outline"
                className="rounded-2xl"
                disabled={savingNotes}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
