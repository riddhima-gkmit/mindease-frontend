import { useState, useEffect } from 'react';
import { Clock, Plus, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { getTherapistProfile, createAvailability, getTherapistAvailability } from '../../api/therapists';

interface TherapistAvailabilityProps {
  onNavigate: (view: any) => void;
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Generate time slots from 9 AM to 6 PM
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
];

// Convert time slot to 24-hour format (HH:MM:SS)
const timeTo24Hour = (time: string): string => {
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

// Convert 24-hour format to display format
const timeFrom24Hour = (time24: string): string => {
  try {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return time24;
  }
};

export default function TherapistAvailability({ onNavigate: _onNavigate }: TherapistAvailabilityProps) {
  const [availability, setAvailability] = useState<{[key: string]: string[]}>({
    'Monday': [],
    'Tuesday': [],
    'Wednesday': [],
    'Thursday': [],
    'Friday': [],
    'Saturday': [],
    'Sunday': []
  });
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [therapistProfileId, setTherapistProfileId] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get therapist profile to get the ID
      const profile = await getTherapistProfile();
      setTherapistProfileId(profile.id);
      
      // Get availability
      const availabilities = await getTherapistAvailability(profile.id);
      
      // Group by day
      const grouped: {[key: string]: string[]} = {
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': [],
        'Sunday': []
      };
      
      availabilities.forEach(avail => {
        const day = avail.day_of_week;
        if (grouped[day]) {
          // Convert time range to individual slots
          // For simplicity, we'll show the start time as the slot
          const displayTime = timeFrom24Hour(avail.start_time);
          if (!grouped[day].includes(displayTime)) {
            grouped[day].push(displayTime);
          }
        }
      });
      
      // Sort each day's slots
      Object.keys(grouped).forEach(day => {
        grouped[day].sort((a, b) => {
          const timeA = timeTo24Hour(a);
          const timeB = timeTo24Hour(b);
          return timeA.localeCompare(timeB);
        });
      });
      
      setAvailability(grouped);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
      setError(err.response?.data?.error || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (day: string, time: string) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(time)) {
        return { ...prev, [day]: daySlots.filter(t => t !== time) };
      } else {
        return { ...prev, [day]: [...daySlots, time].sort((a, b) => {
          const timeA = timeTo24Hour(a);
          const timeB = timeTo24Hour(b);
          return timeA.localeCompare(timeB);
        }) };
      }
    });
  };

  const handleSave = async () => {
    if (!therapistProfileId) {
      setError('Therapist profile not found. Please create your profile first.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // For each day, create availability slots
      // We'll create slots for each selected time (1 hour slots)
      const promises: Promise<any>[] = [];
      
      Object.keys(availability).forEach(day => {
        const slots = availability[day];
        slots.forEach(slot => {
          const startTime = timeTo24Hour(slot);
          // Calculate end time (1 hour later)
          const [hours, minutes] = startTime.split(':').map(Number);
          let endHour = hours + 1;
          if (endHour >= 24) endHour = 0;
          const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
          
          promises.push(
            createAvailability({
              day_of_week: day,
              start_time: startTime,
              end_time: endTime
            }).catch(err => {
              // Ignore duplicate errors for now
              console.warn(`Failed to create slot for ${day} ${slot}:`, err);
            })
          );
        });
      });

      await Promise.all(promises);
      setSuccess('Availability updated successfully!');
      setEditingDay(null);
      
      // Reload availability to show updated data
      setTimeout(() => {
        loadAvailability();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save availability:', err);
      setError(err.response?.data?.error || 'Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  const totalSlots = Object.values(availability).reduce((sum, slots) => sum + slots.length, 0);
  const activeDays = Object.values(availability).filter(slots => slots.length > 0).length;
  const avgPerDay = activeDays > 0 ? Math.round(totalSlots / activeDays) : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-2">Manage Availability</h1>
        <p className="text-gray-600">Set your weekly schedule and available time slots</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl">
          {success}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span className="text-gray-700 text-sm">Total Slots</span>
          </div>
          <p className="text-2xl text-teal-600">{totalSlots}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-gray-700 text-sm">Active Days</span>
          </div>
          <p className="text-2xl text-green-600">{activeDays}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-md col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-5 h-5 text-purple-600" />
            <span className="text-gray-700 text-sm">Avg. per Day</span>
          </div>
          <p className="text-2xl text-purple-600">{avgPerDay}</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="bg-white rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{day}</h3>
                <p className="text-gray-600 text-sm">
                  {availability[day]?.length || 0} slot(s) available
                </p>
              </div>
              <Button
                onClick={() => setEditingDay(editingDay === day ? null : day)}
                size="sm"
                variant={editingDay === day ? 'default' : 'outline'}
                className="rounded-2xl"
              >
                {editingDay === day ? 'Done' : 'Edit'}
              </Button>
            </div>

            {editingDay === day ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTimeSlot(day, time)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      availability[day]?.includes(time)
                        ? 'border-teal-400 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availability[day]?.length > 0 ? (
                  availability[day].map((time) => (
                    <span
                      key={time}
                      className="px-3 py-2 bg-gradient-to-r from-teal-50 to-purple-50 text-gray-700 rounded-xl text-sm"
                    >
                      {time}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No slots available</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
        >
          {saving ? (
            <>
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Availability
            </>
          )}
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-3xl p-6">
        <h4 className="font-semibold mb-3">💡 Tips for Managing Availability</h4>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>• Consider adding buffer time between appointments for notes and breaks</li>
          <li>• Keep your schedule consistent for better patient planning</li>
          <li>• Update your availability regularly to reflect schedule changes</li>
          <li>• Block out personal time to maintain work-life balance</li>
        </ul>
      </div>
    </div>
  );
}
