import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { authAPI } from '../../api/auth';

interface AccountSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialFirstName: string;
  initialLastName: string;
  initialUsername: string;
  onSaved?: () => Promise<void> | void;
}

export default function AccountSettingsDialog({
  open,
  onClose,
  initialFirstName,
  initialLastName,
  initialUsername,
  onSaved,
}: AccountSettingsDialogProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [username] = useState(initialUsername);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  if (!open) return null;

  const validateName = (name: string): boolean => {
    return /^[a-zA-Z\s]*$/.test(name);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateName(value)) {
      setFirstName(value);
      setFirstNameError('');
    } else {
      setFirstNameError('First name can only contain letters and spaces');
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (validateName(value)) {
      setLastName(value);
      setLastNameError('');
    } else {
      setLastNameError('Last name can only contain letters and spaces');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFirstNameError('');
    setLastNameError('');

    // Validate names
    if (!validateName(firstName)) {
      setFirstNameError('First name can only contain letters and spaces. No numbers or special symbols allowed.');
      return;
    }

    if (!validateName(lastName)) {
      setLastNameError('Last name can only contain letters and spaces. No numbers or special symbols allowed.');
      return;
    }

    setSaving(true);
    try {
      await authAPI.updateProfile({
        username,
        // @ts-ignore backend expects snake_case
        first_name: firstName,
        // @ts-ignore backend expects snake_case
        last_name: lastName,
      } as any);
      setSuccess('Profile updated');
      if (onSaved) await onSaved();
      setTimeout(() => onClose(), 600);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-3xl shadow-lg p-6">
        <h3 className="mb-4">Account Settings</h3>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input 
                id="firstName" 
                value={firstName} 
                onChange={handleFirstNameChange} 
                className={`rounded-2xl ${firstNameError ? 'border-red-500' : ''}`}
              />
              {firstNameError && (
                <p className="text-red-600 text-sm">{firstNameError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input 
                id="lastName" 
                value={lastName} 
                onChange={handleLastNameChange} 
                className={`rounded-2xl ${lastNameError ? 'border-red-500' : ''}`}
              />
              {lastNameError && (
                <p className="text-red-600 text-sm">{lastNameError}</p>
              )}
            </div>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-2xl" />
          </div> */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-2xl">
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


