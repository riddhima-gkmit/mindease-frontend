import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Calendar as CalIcon, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { listTherapists, getTherapistAvailability, type TherapistProfile, type TherapistAvailability, type PaginatedResponse } from '../../api/therapists';
import { createAppointment } from '../../api/appointments';
import AppointmentBooking from './AppointmentBooking';
import Pagination from '../ui/pagination';

interface TherapistDirectoryProps {
  onNavigate: (view: any) => void;
}

const SPECIALIZATION_FILTERS = [
  'All',
  'Anxiety & Stress',
  'Depression',
  'Relationships',
  'Trauma',
  'Addiction',
  'Family Therapy',
];

export default function TherapistDirectory({ onNavigate: _onNavigate }: TherapistDirectoryProps) {
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selected, setSelected] = useState<TherapistProfile | null>(null);
  const [availability, setAvailability] = useState<TherapistAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  const loadTherapists = async (page: number = 1, specialization?: string) => {
    try {
      setLoading(true);
      const data = await listTherapists(specialization, page, pageSize);
      
      // Check if response is paginated
      if (data && typeof data === 'object' && 'results' in data) {
        const paginatedData = data as PaginatedResponse<TherapistProfile>;
        setTherapists(paginatedData.results);
        setTotalPages(Math.ceil(paginatedData.count / pageSize));
        setTotalItems(paginatedData.count);
      } else {
        // Fallback for non-paginated response (backward compatibility)
        const therapistsArray = data as TherapistProfile[];
        setTherapists(therapistsArray);
        setTotalPages(1);
        setTotalItems(therapistsArray.length);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load therapists');
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTherapists(currentPage);
  }, [currentPage]);

  useEffect(() => {
    // Reset to page 1 when filter changes
    setCurrentPage(1);
    loadTherapists(1, activeFilter === 'All' ? undefined : activeFilter);
  }, [activeFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return therapists;
    return therapists.filter((t) =>
      (t.username?.toLowerCase() || '').includes(q) ||
      (t.specialization?.toLowerCase() || '').includes(q) ||
      (t.about?.toLowerCase() || '').includes(q) ||
      (t.clinic_address?.toLowerCase() || '').includes(q)
    );
  }, [therapists, query]);

  const applyFilter = async (label: string) => {
    setActiveFilter(label);
    setCurrentPage(1);
  };

  const openAvailability = async (t: TherapistProfile) => {
    setSelected(t);
    setAvailability([]);
    setAvailabilityLoading(true);
    setBookingError('');
    setBookingSuccess('');
    try {
      const slots = await getTherapistAvailability(t.id);
      setAvailability(slots);
    } catch {
      setAvailability([]);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // booking UI is delegated to AppointmentBooking component

  const handleBookVia = async (date: string, time: string) => {
    if (!selected) return;
    setBooking(true);
    setBookingError('');
    setBookingSuccess('');
    try {
      await createAppointment({
        therapist: selected.id,
        date,
        time_slot: time.length === 5 ? `${time}:00` : time,
      });
      setBookingSuccess('Appointment requested');
      // Modal will stay open until user manually closes it
    } catch (e: any) {
      // Handle different error response formats from DRF
      let msg = 'Failed to book appointment';
      if (e?.response?.status === 400) {
        const errorData = e?.response?.data;
        // Check for non_field_errors (DRF format for ValidationError from validate())
        if (errorData?.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          msg = errorData.non_field_errors[0];
        }
        // Check for direct error message
        else if (errorData?.error) {
          msg = errorData.error;
        }
        // Check if errorData is an array (another DRF format)
        else if (Array.isArray(errorData) && errorData.length > 0) {
          msg = errorData[0];
        }
        // Check if errorData is a string
        else if (typeof errorData === 'string') {
          msg = errorData;
        }
        // Default message for 400 errors
        else {
          msg = 'This slot is already booked.';
        }
      } else {
        msg = e?.response?.data?.error || e?.message || 'Failed to book appointment';
      }
      
      // Replace technical error messages with user-friendly ones
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('therapist, date, time_slot')) {
        msg = 'This slot is already booked. Please select another time.';
      }
      
      setBookingError(msg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading therapists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1>Find Your Therapist</h1>
        <p className="text-gray-600">Browse our network of qualified mental health professionals</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl p-4 shadow-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by name or specialization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
      </div>

      {/* Filter by specialization */}
      <div className="bg-white rounded-3xl p-4 shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <p className="font-medium">Filter by Specialization</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {SPECIALIZATION_FILTERS.map((label) => (
            <button
              key={label}
              onClick={() => applyFilter(label)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                activeFilter === label
                  ? 'bg-gradient-to-r from-teal-400 to-purple-400 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
           <div className="col-span-full flex items-center justify-center">
             <div className="text-center py-12 bg-white rounded-3xl shadow-md w-full max-w-md">
               <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
               <h3 className="mb-2">No therapists found</h3>
               <p className="text-gray-600">Try adjusting your search or filters</p>
             </div>
           </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl p-6 shadow-md flex flex-col gap-4">
              {/* Header with avatar placeholder */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-purple-100 text-teal-700 flex items-center justify-center font-semibold shadow-sm">
                    {(t.username?.[0] || 'T').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="mb-0.5">{t.username}</h3>
                    <p className="text-gray-600">{t.specialization}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4" />
                <span>{t.experience_years} experience</span>
              </div>
              {t.clinic_address && (
                <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t.clinic_address}</span>
              </div>
              )}
              {t.about && (
                <div className="text-gray-700 text-sm line-clamp-2">{t.about}</div>
              )}
              {/* Modes badges */}
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const mode = (t.consultation_mode || '').toLowerCase();
                  const showVideo = mode === 'online' || mode === 'both';
                  const showInPerson = mode === 'offline' || mode === 'both';
                  return (
                    <>
                      {showVideo && (
                        <span className="px-3 py-1 bg-gradient-to-r from-teal-50 to-purple-50 text-gray-700 rounded-full flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> Video Call
                        </span>
                      )}
                      {showInPerson && (
                        <span className="px-3 py-1 bg-gradient-to-r from-teal-50 to-purple-50 text-gray-700 rounded-full flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> In-Person
                        </span>
                      )}
                      {!showVideo && !showInPerson && (
                        <span className="px-3 py-1 bg-gradient-to-r from-teal-50 to-purple-50 text-gray-700 rounded-full flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Mode not specified
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Next available placeholder strip */}
              {/* <div className="rounded-2xl px-4 py-3 bg-teal-50 text-teal-700 text-sm">
                Next available: —
              </div> */}

              <div className="flex items-center gap-3 pt-1 mt-auto">
                <Button
                  className="rounded-2xl w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white"
                  onClick={() => openAvailability(t)}
                >
                  <CalIcon className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!query && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={pageSize}
        />
      )}

      {/* Availability / Booking Dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          {availabilityLoading ? (
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-lg p-6 flex items-center justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
            </div>
          ) : (
            <div className="relative w-full max-w-xl mx-4">
              {selected && (
                <AppointmentBooking
                  open={true}
                  onClose={() => {
                    setSelected(null);
                    setBookingSuccess('');
                    setBookingError('');
                  }}
                  therapist={{
                    id: selected.id,
                    username: selected.username,
                    specialization: selected.specialization as any,
                    experience_years: selected.experience_years as any,
                    clinic_address: selected.clinic_address,
                    consultation_mode: selected.consultation_mode as any,
                  }}
                  slots={availability as any}
                  onConfirm={async ({ date, time }) => {
                    await handleBookVia(date, time);
                  }}
                  confirming={booking}
                  error={bookingError}
                  success={bookingSuccess}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


