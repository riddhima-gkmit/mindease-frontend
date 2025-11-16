// import { useState } from 'react';
import { Heart, Mail } from 'lucide-react';
// import { Heart, Mail, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface EmailVerificationProps {
  onNavigate: (view: any) => void;
}

export default function EmailVerification({ onNavigate }: EmailVerificationProps) {
  // const [resending, setResending] = useState(false);
  // const [resent, setResent] = useState(false);

  // const handleResend = async () => {
  //   setResending(true);
  //   // TODO: Implement resend verification email API call
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   setResent(true);
  //   setResending(false);
  //   setTimeout(() => setResent(false), 3000);
  // };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-teal-600 mb-2">MindEase</h1>
        </div>

        {/* Verification Message */}
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-6">
            <Mail className="w-10 h-10 text-teal-600" />
          </div>

          <h2 className="mb-4">Check your email</h2>
          <p className="text-gray-600 mb-8">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>

          {/* {resent && (
            <div className="mb-6 p-4 bg-teal-50 rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <p className="text-teal-700">Verification email resent!</p>
            </div>
          )} */}

          <div className="space-y-3">
            {/* <Button
              onClick={handleResend}
              disabled={resending}
              variant="outline"
              className="w-full rounded-2xl h-12"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </Button> */}

            <Button
              onClick={() => onNavigate('login')}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              Back to Sign In
            </Button>
          </div>

          <p className="text-gray-500 mt-6">
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}

