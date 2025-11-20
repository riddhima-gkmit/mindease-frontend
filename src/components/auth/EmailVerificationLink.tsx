import { Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface EmailVerificationLinkProps {
  verifying: boolean;
  error: string | null;
  success: boolean;
  onNavigate: (view: any) => void;
}

export default function EmailVerificationLink({ verifying, error, success, onNavigate }: EmailVerificationLinkProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white rounded-3xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-teal-600 mb-2">MindEase</h1>
        </div>

        {verifying ? (
          <>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </>
        ) : error ? (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="mb-4 text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => onNavigate('login')}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              Go to Sign In
            </Button>
          </>
        ) : success ? (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="mb-4">Email Verified Successfully!</h2>
            <p className="text-gray-600 mb-6">Your email has been verified. Redirecting to login...</p>
            <Button
              onClick={() => onNavigate('login')}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              Go to Sign In
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

