import { useState } from 'react';
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation will be handled by App.tsx based on user role
      // The DashboardRedirect component will handle routing
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid email or password');
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-2xl"
                  required
                />
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

