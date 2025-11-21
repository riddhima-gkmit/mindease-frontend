import { useMemo, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Video, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { getTherapistBookedSlots } from '../../api/appointments';

export interface BookingSlot {
  id: string;
  day_of_week: string; // 0-6
  start_time: string;  // "HH:MM:SS"
  end_time: string;
}

interface Therapist {
  id: string;
  username: string;
  specialization?: string;
  experience_years?: number;
  clinic_address?: string;
  consultation_mode?: string; // online | offline | both
}

interface AppointmentBookingProps {
  open: boolean;
  onClose: () => void;
  therapist: Therapist;
  slots: BookingSlot[];
  onConfirm: (payload: { date: string; time: string }) => Promise<void> | void;
  confirming?: boolean;
  error?: string;
  success?: string;
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toAmPm(hhmm: string) {
  const [hh, mm] = hhmm.split(':').map((s) => parseInt(s, 10));
  const h12 = ((hh + 11) % 12) + 1;
  const ampm = hh >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export default function AppointmentBooking({
  open,
  onClose,
  therapist,
  slots,
  onConfirm,
  confirming,
  error,
  success,
}: AppointmentBookingProps) {
  const [step, setStep] = useState<'details' | 'schedule' | 'confirm' | 'success'>('details');
  const [selectedMode, setSelectedMode] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(''); // display label like "10:00 AM"
  const [selectedTimeRaw, setSelectedTimeRaw] = useState<string>(''); // "HH:MM"
  const [bookedSlots, setBookedSlots] = useState<string[]>([]); // Array of booked time slots in "HH:MM:SS" format
  const [loadingBookedSlots, setLoadingBookedSlots] = useState<boolean>(false);

  const modes = useMemo(() => {
    const mode = (therapist.consultation_mode || '').toLowerCase();
    const arr: string[] = [];
    if (mode === 'online' || mode === 'both') arr.push('Video Call');
    if (mode === 'offline' || mode === 'both') arr.push('In-Person');
    if (arr.length === 0) arr.push('In-Person'); // fallback
    return arr;
  }, [therapist]);

  
  const day_to_int = (day: string) => {
    if (day === 'Sunday') return 0;
    if (day === 'Monday') return 1;
    if (day === 'Tuesday') return 2;
    if (day === 'Wednesday') return 3;
    if (day === 'Thursday') return 4;
    if (day === 'Friday') return 5;
    if (day === 'Saturday') return 6;
    return NaN;
  }
  // Build next 14 days that have slots
  const derived = useMemo(() => {
    const safeSlots = Array.isArray(slots) ? slots : [];
    const byDow: Record<number, string[]> = {};
    for (const s of safeSlots) {
      const dow = day_to_int(s?.day_of_week);
      if (typeof dow !== 'number') continue;
      const start = (s.start_time || '').slice(0, 5); // HH:MM
      const end = (s.end_time || '').slice(0, 5);     // HH:MM
      if (!byDow[dow]) byDow[dow] = [];
      // Expand to 1-hour increments from start to end (end exclusive)
      const [sh, sm] = start.split(':').map((x) => parseInt(x, 10));
      const [eh, em] = end.split(':').map((x) => parseInt(x, 10));
      if (Number.isFinite(sh) && Number.isFinite(sm) && Number.isFinite(eh) && Number.isFinite(em)) {
        let current = new Date(2000, 0, 1, sh, sm, 0, 0);
        const endDt = new Date(2000, 0, 1, eh, em, 0, 0);
        while (current < endDt) {
          const hh = String(current.getHours()).padStart(2, '0');
          const mm = String(current.getMinutes()).padStart(2, '0');
          const t = `${hh}:${mm}`;
          if (!byDow[dow].includes(t)) byDow[dow].push(t);
          current.setMinutes(current.getMinutes() + 60);
        }
      }
    }
    // sort each times list
    Object.keys(byDow).forEach((k) => byDow[+k].sort());

    const dates: { iso: string; label: string; dow: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      if (byDow[dow] && byDow[dow].length > 0) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const iso = `${yyyy}-${mm}-${dd}`;
        const label = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${dayNames[dow]}`;
        dates.push({ iso, label, dow });
      }
    }
    return { byDow, dates };
  }, [slots]);

  const availableTimesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = new Date(selectedDate).getDay();
    const times = derived.byDow[dow] || [];
    
    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentHour = now.getHours();
    
    return times
      .map((t) => {
        // Check if this time slot is booked by comparing "HH:MM" with "HH:MM:SS"
        const timeWithSeconds = `${t}:00`;
        const isBooked = bookedSlots.includes(timeWithSeconds);
        
        // Get hour from time slot (HH:MM format)
        const [slotHour] = t.split(':').map(Number);
        
        // Check if time is in the past (only for today)
        const isPast = selectedDate === today && slotHour <= currentHour;
        
        return { raw: t, label: toAmPm(t), isBooked, isPast };
      })
      .filter((t) => !t.isPast); // Filter out past time slots
  }, [selectedDate, derived, bookedSlots]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('details');
      setSelectedMode('');
      setSelectedDate('');
      setSelectedTime('');
      setSelectedTimeRaw('');
      setBookedSlots([]);
    }
  }, [open]);

  // Fetch booked slots whenever the selected date changes
  useEffect(() => {
    if (selectedDate && therapist.id) {
      setLoadingBookedSlots(true);
      getTherapistBookedSlots(therapist.id, selectedDate)
        .then((slots) => {
          setBookedSlots(slots);
        })
        .catch((err) => {
          console.error('Failed to fetch booked slots:', err);
          setBookedSlots([]);
        })
        .finally(() => {
          setLoadingBookedSlots(false);
        });
    } else {
      setBookedSlots([]);
    }
  }, [selectedDate, therapist.id]);

  // Sync step with success/error props from parent
  useEffect(() => {
    if (success && step === 'confirm') {
      setStep('success');
    }
    // If there's an error, stay on confirm step to show the error
    if (error && step === 'success') {
      setStep('confirm');
    }
  }, [success, error, step]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTimeRaw) return;
    await onConfirm({ date: selectedDate, time: `${selectedTimeRaw}:00` });
    // Don't set success here - let useEffect handle it based on props
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-3xl shadow-lg p-6">
        {/* Back/Close */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (step === 'details') onClose();
              else if (step === 'schedule') setStep('details');
              else if (step === 'confirm') setStep('schedule');
              else onClose();
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <Button variant="outline" className="rounded-2xl" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-3xl p-4 shadow-md mb-6">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex items-center gap-2 text-teal-600`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-teal-500 text-white`}>1</div>
              <span className="hidden sm:inline">Details</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full bg-teal-500 transition-all ${step === 'schedule' || step === 'confirm' || step === 'success' ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step === 'schedule' || step === 'confirm' || step === 'success' ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'schedule' || step === 'confirm' || step === 'success' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="hidden sm:inline">Schedule</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-200">
              <div className={`h-full bg-teal-500 transition-all ${step === 'confirm' || step === 'success' ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`flex items-center gap-2 ${step === 'confirm' || step === 'success' ? 'text-teal-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' || step === 'success' ? 'bg-teal-500 text-white' : 'bg-gray-200'}`}>3</div>
              <span className="hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>

        {/* Step 1: Details & Mode */}
        {step === 'details' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-md">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-purple-100 text-teal-700 flex items-center justify-center font-semibold">
                  {(therapist.username?.[0] || 'T').toUpperCase()}
                </div>
                <div>
                  <h2 className="mb-1">{therapist.username}</h2>
                  {therapist.specialization && <p className="text-gray-600 mb-2">{therapist.specialization}</p>}
                  {therapist.experience_years != null && <p className="text-gray-500">{therapist.experience_years} years experience</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md">
              <h3 className="mb-4">Select Consultation Mode</h3>
              <div className="grid gap-3">
                {modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSelectedMode(mode);
                      setStep('schedule');
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedMode === mode ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {mode === 'Video Call' ? (
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                          <Video className="w-5 h-5 text-teal-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-gray-800">{mode}</p>
                        <p className="text-gray-500">{mode === 'Video Call' ? 'Meet from anywhere' : 'In-person session'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-md">
              <h3 className="mb-4">Select Date</h3>
              {derived.dates.length === 0 ? (
                <p className="text-gray-600">No upcoming dates available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {derived.dates.map((d) => (
                    <button
                      key={d.iso}
                      onClick={() => {
                        setSelectedDate(d.iso);
                        setSelectedTime('');
                        setSelectedTimeRaw('');
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        selectedDate === d.iso ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50'
                      }`}
                    >
                      <p className="text-gray-800">{new Date(d.iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-gray-500">{dayNames[new Date(d.iso).getDay()]}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="bg-white rounded-3xl p-6 shadow-md">
                <h3 className="mb-4">Select Time</h3>
                {loadingBookedSlots ? (
                  <p className="text-gray-600">Loading available slots...</p>
                ) : availableTimesForSelectedDate.length === 0 ? (
                  <p className="text-gray-600">No times available for the selected date.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableTimesForSelectedDate.map((t) => (
                      <button
                        key={t.raw}
                        onClick={() => {
                          if (!t.isBooked) {
                            setSelectedTime(t.label);
                            setSelectedTimeRaw(t.raw);
                          }
                        }}
                        disabled={t.isBooked}
                        className={`p-4 rounded-2xl border-2 transition-all relative ${
                          t.isBooked
                            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            : selectedTimeRaw === t.raw
                            ? 'border-teal-400 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        <p className={t.isBooked ? 'text-gray-400' : 'text-gray-800'}>{t.label}</p>
                        {t.isBooked && (
                          <span className="text-xs text-gray-400 mt-1 block">Booked</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedTimeRaw}
                  className="w-full mt-6 bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
                >
                  Continue to Review
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="bg-white rounded-3xl p-6 shadow-md max-w-md mx-auto">
            <h3 className="mb-6">Confirm Your Appointment</h3>

            <div className="p-4 bg-gray-50 rounded-2xl space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="text-gray-800">{selectedTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedMode === 'Video Call' ? <Video className="w-5 h-5 text-teal-600" /> : <MapPin className="w-5 h-5 text-teal-600" />}
                <div>
                  <p className="text-gray-500">Mode</p>
                  <p className="text-gray-800">{selectedMode}</p>
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              {confirming ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="max-w-md mx-auto text-center p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="mb-4">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-2">Your appointment has been successfully scheduled.</p>
            <p className="text-gray-500 text-sm mb-6">
              📧 We've sent a confirmation email with the appointment details to your registered email address.
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


