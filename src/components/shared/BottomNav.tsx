import { Home, Heart, Calendar, Lightbulb, User, Users, Clock } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: any) => void;
  role: 'user' | 'therapist';
}

export default function BottomNav({ currentView, onNavigate, role }: BottomNavProps) {
  if (role === 'therapist') {
    const therapistTabs = [
      { id: 'therapist-dashboard', label: 'Home', icon: Home },
      { id: 'therapist-appointments', label: 'Appointments', icon: Calendar },
      { id: 'therapist-availability', label: 'Schedule', icon: Clock },
      { id: 'therapist-profile', label: 'Profile', icon: User },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="max-w-screen-xl mx-auto px-2">
          <div className="grid grid-cols-4 h-16">
            {therapistTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentView === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // User tabs
  const userTabs = [
    { id: 'user-dashboard', label: 'Home', icon: Home },
    { id: 'mood-tracker', label: 'Mood', icon: Heart },
    { id: 'therapist-directory', label: 'Therapists', icon: Users },
    { id: 'recommendations', label: 'Tips', icon: Lightbulb },
    { id: 'user-profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="grid grid-cols-5 h-16">
          {userTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

