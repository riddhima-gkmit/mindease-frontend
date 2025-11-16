import { useState } from 'react';
import { Clock } from 'lucide-react';

export default function TherapistAvailability() {
  // Placeholder UI – backend create/list already exists; integrate forms later
  const [info] = useState('Manage your weekly availability here. This screen will allow adding time slots.');

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 pb-24">
      <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-teal-600" /> Availability</h2>
      <div className="mt-4 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-gray-700">{info}</p>
        <p className="text-gray-500 text-sm mt-2">Coming next: add/edit slots by day, quick copy, and publish.</p>
      </div>
    </div>
  );
}


