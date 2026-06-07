import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ConfirmationPopupProps {
  show: boolean;
  message: string;
  onClose: () => void;
  duration?: number; // Duration in milliseconds
}

export default function ConfirmationPopup({ 
  show, 
  message, 
  onClose, 
  duration = 8000 
}: ConfirmationPopupProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 max-w-sm mx-4 pointer-events-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Success!</h3>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

