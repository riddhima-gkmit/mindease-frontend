import { useState } from 'react';
import { Heart, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

interface RegisterProps {
  onNavigate: (view: any) => void;
}

export default function Register({ onNavigate }: RegisterProps) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'patient' as 'patient' | 'therapist'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  const validateName = (name: string): boolean => {
    return /^[a-zA-Z\s]*$/.test(name);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateName(value)) {
      setFormData({ ...formData, firstName: value });
      setFirstNameError('');
    } else {
      setFirstNameError('First name can only contain letters and spaces');
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateName(value)) {
      setFormData({ ...formData, lastName: value });
      setLastNameError('');
    } else {
      setLastNameError('Last name can only contain letters and spaces');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFirstNameError('');
    setLastNameError('');

    // Validate names
    if (!validateName(formData.firstName)) {
      setFirstNameError('First name can only contain letters and spaces. No numbers or special symbols allowed.');
      return;
    }

    if (!validateName(formData.lastName)) {
      setLastNameError('Last name can only contain letters and spaces. No numbers or special symbols allowed.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 7) {
      setError('Password must be at least 7 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
      });
      onNavigate('email-verification');
    } catch (err: any) {
      const errorMessage = err.response?.data?.email?.[0] || 
                          err.response?.data?.password?.[0] ||
                          err.response?.data?.error ||
                          err.message ||
                          'Registration failed. Please try again.';
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
          <p className="text-gray-600">Start your wellness journey today</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="mb-6">Create Account</h2>

          {error && (
            <Alert variant="destructive" className="mb-6 rounded-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleFirstNameChange}
                  className={`rounded-2xl ${firstNameError ? 'border-red-500' : ''}`}
                  required
                />
                {firstNameError && (
                  <p className="text-red-600 text-sm">{firstNameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleLastNameChange}
                  className={`rounded-2xl ${lastNameError ? 'border-red-500' : ''}`}
                  required
                />
                {lastNameError && (
                  <p className="text-red-600 text-sm">{lastNameError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 rounded-2xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 rounded-2xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'patient' })}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.role === 'patient'
                      ? 'border-teal-400 bg-teal-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                  <p className="text-gray-700">Patient</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'therapist' })}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.role === 'therapist'
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Heart className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-gray-700">Therapist</p>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-teal-600 hover:text-teal-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

