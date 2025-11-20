import { Heart} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopNavProps {
  onNavigate: (view: any) => void;
}

export default function TopNav({ onNavigate }: TopNavProps) {
  const { user } = useAuth();

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-teal-400 to-purple-400 rounded-2xl">
            <Heart className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-teal-600">MindEase</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('user-profile')}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-2xl transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

