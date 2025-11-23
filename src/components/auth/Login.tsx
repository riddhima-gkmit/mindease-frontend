import { useState } from 'react';
import { Heart, Mail, Lock, AlertCircle, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

interface LoginProps {
  onNavigate: (view: any) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'therapist'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Trim email
    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
      setError('Email cannot be empty or contain only spaces');
      return;
    }

    // Validate password is not only spaces
    if (!password.trim()) {
      setError('Password cannot be only spaces');
      return;
    }

    setLoading(true);

    try{
      await login(trimmedEmail, password, selectedRole);
      // Navigation will be handled by App.tsx based on user role
      // The DashboardRedirect component will handle routing
    } catch (err: any) {
      // Extract error message from various possible response formats
      let errorMessage = 'Invalid email or password';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Check for direct error message
        if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : errorData.error[0] || errorMessage;
        }
        // Check for non_field_errors (Django REST Framework format)
        else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorMessage = errorData.non_field_errors[0];
        }
        // Check for field-specific errors (email, password, etc.)
        else if (typeof errorData === 'object') {
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey && Array.isArray(errorData[firstErrorKey])) {
            errorMessage = errorData[firstErrorKey][0];
          } else if (typeof errorData[firstErrorKey] === 'string') {
            errorMessage = errorData[firstErrorKey];
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-purple-400 rounded-3xl mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-teal-600 mb-2">MindEase</h1>
          <p className="text-gray-600">Welcome back to your wellness journey</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="mb-6">Sign In</h2>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trimStart())}
                  className="pl-10 rounded-2xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-2xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Login as:</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('patient')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedRole === 'patient'
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                  <p className="text-gray-700 text-sm">Patient</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('therapist')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedRole === 'therapist'
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Heart className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-gray-700 text-sm">Therapist</p>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('password-reset')}
              className="text-teal-600 hover:text-teal-700 transition-colors"
            >
              Forgot password?
            </button>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-teal-600 hover:text-teal-700 transition-colors"
              >
                Create account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

