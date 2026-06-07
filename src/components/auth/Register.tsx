import { useState } from 'react';
import { Heart, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Don't allow leading spaces for email
    const value = e.target.value.trimStart();
    setFormData({ ...formData, email: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFirstNameError('');
    setLastNameError('');

    // Trim values
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();

    // Check for empty or whitespace-only values
    if (!trimmedEmail) {
      setError('Email cannot be empty or contain only spaces');
      return;
    }

    if (!trimmedFirstName) {
      setFirstNameError('First name cannot be empty or contain only spaces');
      return;
    }

    // Validate names
    if (!validateName(trimmedFirstName)) {
      setFirstNameError('First name can only contain letters and spaces. No numbers or special symbols allowed.');
      return;
    }

    // Check if password is only spaces
    if (!formData.password.trim()) {
      setError('Password cannot be only spaces');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: trimmedEmail,
        password: formData.password,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        role: formData.role,
      });
      onNavigate('email-verification');
    } catch (err: any) {
      const errorMessage = err.response?.data?.email?.[0] || 
                          err.response?.data?.password?.[0] ||
                          err.response?.data?.first_name?.[0] ||
                          err.response?.data?.last_name?.[0] ||
                          err.response?.data?.non_field_errors?.[0] ||
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
                  onChange={handleEmailChange}
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
                  value={formData.password}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow the value to be set, but we'll validate on submit
                    setFormData({ ...formData, password: value });
                  }}
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow the value to be set, but we'll validate on submit
                    setFormData({ ...formData, confirmPassword: value });
                  }}
                  className="pl-10 pr-10 rounded-2xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  <p className="text-gray-700">Person</p>
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

