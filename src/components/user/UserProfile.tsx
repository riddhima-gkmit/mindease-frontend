import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Calendar, LogOut as LogOutIcon, Settings, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, type User } from '../../api/auth';
import { Button } from '../ui/button';
import AccountSettingsDialog from './AccountSettingsDialog';
import InfoDialog from './InfoDialog';

interface UserProfileProps {
  onNavigate: (view: any) => void;
}

export default function UserProfile({ onNavigate }: UserProfileProps) {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await authAPI.getProfile();
        setProfile(data);
        setFirstName((data as any).first_name || '');
        setLastName((data as any).last_name || '');
        setUsername(data.username || '');
      } catch (e: any) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  // Saving handled within AccountSettingsDialog

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

  const displayFirst = (profile as any)?.first_name || '';
  const displayLast = (profile as any)?.last_name || '';

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Profile Header (mirrors PWA design) */}
      <div className="bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-4 border-4 border-white rounded-3xl bg-white/20 text-white text-2xl flex items-center justify-center">
            {(displayFirst?.charAt(0) || profile?.username?.charAt(0) || 'U')}{displayLast?.charAt(0) || ''}
          </div>
          <h2 className="mb-1">{displayFirst} {displayLast}</h2>
          <p className="opacity-90">{profile?.email}</p>
          <div className="mt-4 px-4 py-2 bg-white/20 rounded-full">
            {(profile as any)?.role === 'therapist' ? 'Therapist Account' : 'Patient Account'}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <h3 className="mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-500">Full Name</p>
              <p className="text-gray-800">{displayFirst} {displayLast}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-500">Email</p>
              <p className="text-gray-800">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-500">Member Since</p>
              <p className="text-gray-800">{profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
 : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <h3 className="mb-4">Settings</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800">Account Settings</p>
              <p className="text-gray-500">Update your profile and preferences</p>
            </div>
          </button>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800">Notifications</p>
              <p className="text-gray-500">Manage notification preferences</p>
            </div>
          </button>

          <button
            onClick={() => setPrivacyOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800">Privacy & Security</p>
              <p className="text-gray-500">Control your data and security</p>
            </div>
          </button>
        </div>
      </div>

      {/* Account Settings Dialog */}
      <AccountSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialFirstName={firstName}
        initialLastName={lastName}
        initialUsername={username}
        onSaved={async () => {
          try {
            const refreshed = await authAPI.getProfile();
            setProfile(refreshed);
            setFirstName((refreshed as any).first_name || '');
            setLastName((refreshed as any).last_name || '');
            setUsername(refreshed.username || '');
          } catch {}
        }}
      />
      <InfoDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications (Coming Soon)"
        description="We’re working on customizable notifications for appointments, mood reminders, and updates. This feature will be available soon."
      />
      <InfoDialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Privacy & Security (Coming Soon)"
        description="Manage data export, account deletion, and security settings will be available here in an upcoming update."
      />

      {/* Logout Button */}
      <div className="bg-white rounded-3xl p-6 shadow-md">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full rounded-2xl h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <LogOutIcon className="w-5 h-5 mr-2" />
          Log Out
        </Button>
      </div>

      {/* Help & Support */}
      {/* <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-3xl p-6">
        <h4 className="mb-2">Need Help?</h4>
        <p className="text-gray-600 mb-4">
          Our support team is here for you 24/7
        </p>
        <Button variant="outline" className="rounded-2xl">
          Contact Support
        </Button>
      </div> */}
    </div>
  );
}


