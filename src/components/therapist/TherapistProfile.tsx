import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../../contexts/AuthContext';
import { getTherapistProfile, updateTherapistProfile, createTherapistProfile } from '../../api/therapists';
import { triggerProfileRefetch } from '../../hooks/useTherapistProfile';
import type { TherapistProfile, UpdateTherapistProfileData } from '../../api/therapists';

interface TherapistProfileProps {
  onNavigate: (view: any) => void;
}

export default function TherapistProfile({ onNavigate: _onNavigate }: TherapistProfileProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<UpdateTherapistProfileData>({
    specialization: '',
    experience_years: 0,
    consultation_mode: 'online',
    about: '',
    clinic_address: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTherapistProfile();
      setProfile(data);
      setFormData({
        specialization: data.specialization || '',
        experience_years: data.experience_years || 0,
        consultation_mode: (data.consultation_mode as 'online' | 'offline' | 'both') || 'online',
        about: data.about || '',
        clinic_address: data.clinic_address || ''
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Profile doesn't exist yet, that's okay - user can create it
        setError('');
      } else {
        setError(err.response?.data?.error || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (profile) {
        // Update existing profile
        await updateTherapistProfile(formData);
        setSuccess('Profile updated successfully!');
      } else {
        // Create new profile - ensure required fields are present
        if (!formData.specialization || !formData.experience_years || !formData.consultation_mode) {
          setError('Please fill in all required fields');
          setSaving(false);
          return;
        }
        await createTherapistProfile({
          specialization: formData.specialization,
          experience_years: formData.experience_years,
          consultation_mode: formData.consultation_mode,
          about: formData.about,
          clinic_address: formData.clinic_address
        });
        setSuccess('Profile created successfully!');
      }
      
      // Reload profile to get updated data
      await loadProfile();
      
      // Trigger profile refetch in all components that use useTherapistProfile
      // This updates ProtectedRoute and TherapistLayout to allow navigation
      triggerProfileRefetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateTherapistProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Therapist Profile</h1>
            <p className="opacity-90 text-sm">
              {profile ? 'Update your professional information' : 'Create your therapist profile'}
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Message for New Therapists */}
      {!profile && (
        <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-3xl p-6 border-2 border-teal-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">Welcome to MindEase!</h3>
              <p className="text-gray-700 mb-3">
                To get started, please complete your therapist profile. This will help patients find you and book appointments.
              </p>
              <p className="text-gray-600 text-sm">
                After creating your profile, you'll be able to set your availability and start receiving appointment requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Status */}
      {profile && (
        <div className="bg-white rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Profile Status</p>
              <p className="text-lg font-semibold">
                {profile.is_approved ? (
                  <span className="text-green-600">✓ Approved</span>
                ) : (
                  <span className="text-yellow-600">Pending Approval</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm mb-1">Email</p>
              <p className="text-gray-800">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-md space-y-6">
        {/* Specialization */}
        <div className="space-y-2">
          <Label htmlFor="specialization" className="text-gray-700">
            Specialization <span className="text-red-500">*</span>
          </Label>
          <Input
            id="specialization"
            type="text"
            value={formData.specialization}
            onChange={(e) => handleChange('specialization', e.target.value)}
            placeholder="e.g., Cognitive Behavioral Therapy, Anxiety Disorders"
            required
            className="rounded-2xl"
          />
          <p className="text-gray-500 text-xs">Your area of expertise or specialization</p>
        </div>

        {/* Experience Years */}
        <div className="space-y-2">
          <Label htmlFor="experience_years" className="text-gray-700">
            Years of Experience <span className="text-red-500">*</span>
          </Label>
          <Input
            id="experience_years"
            type="number"
            min="0"
            max="55"
            value={formData.experience_years}
            onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
            placeholder="0"
            required
            className="rounded-2xl"
          />
          <p className="text-gray-500 text-xs">Number of years you've been practicing</p>
        </div>

        {/* Consultation Mode */}
        <div className="space-y-2">
          <Label htmlFor="consultation_mode" className="text-gray-700">
            Consultation Mode <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {(['online', 'offline', 'both'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleChange('consultation_mode', mode)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  formData.consultation_mode === mode
                    ? 'border-teal-400 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium capitalize">{mode}</p>
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs">How do you provide consultations?</p>
        </div>

        {/* About */}
        <div className="space-y-2">
          <Label htmlFor="about" className="text-gray-700">
            About
          </Label>
          <Textarea
            id="about"
            value={formData.about}
            onChange={(e) => handleChange('about', e.target.value)}
            placeholder="Tell patients about your background, approach, and what they can expect..."
            rows={6}
            className="rounded-2xl"
          />
          <p className="text-gray-500 text-xs">A brief description about yourself and your practice</p>
        </div>

        {/* Clinic Address (shown only if offline or both) */}
        {(formData.consultation_mode === 'offline' || formData.consultation_mode === 'both') && (
          <div className="space-y-2">
            <Label htmlFor="clinic_address" className="text-gray-700">
              Clinic Address
            </Label>
            <Textarea
              id="clinic_address"
              value={formData.clinic_address}
              onChange={(e) => handleChange('clinic_address', e.target.value)}
              placeholder="Enter your clinic address for in-person appointments"
              rows={3}
              className="rounded-2xl"
            />
            <p className="text-gray-500 text-xs">Required for offline consultations</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
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
                <Save className="w-5 h-5 mr-2" />
                {profile ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-3xl p-6">
        <h4 className="font-semibold mb-3">ℹ️ Profile Information</h4>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>• Your profile will be reviewed by administrators before being made public</li>
          <li>• Keep your information up to date to help patients find you</li>
          <li>• You can update your profile at any time</li>
          {!profile?.is_approved && (
            <li>• Once approved, your profile will appear in the therapist directory</li>
          )}
        </ul>
      </div>

      {/* Logout Button */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <Button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          variant="outline"
          className="w-full rounded-2xl h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

