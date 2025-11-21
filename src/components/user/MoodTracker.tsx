/// <reference path="../../types/recharts.d.ts" />
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, Calendar, TrendingUp, Edit2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { getMoodEntries, createMoodEntry, updateMoodEntry, getMoodChartData, type MoodEntry, type PaginatedResponse } from '../../api/mood';
import Pagination from '../ui/pagination';

interface MoodTrackerProps {
  onNavigate: (view: any) => void;
}

const moodEmojis = ['😔', '😕', '😐', '🙂', '😄'];
const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];

export default function MoodTracker({ onNavigate: _onNavigate }: MoodTrackerProps) {
  const location = useLocation();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Check URL parameter to determine initial tab
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab');
  const [showHistory, setShowHistory] = useState(initialTab === 'history');
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [averageMood, setAverageMood] = useState<number | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; mood_score: number }>>([]);
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const [chartLoading, setChartLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
  };

  const getApiErrorMessage = (e: any): string => {
    const data = e?.response?.data;
    if (!data) return e?.message || 'Something went wrong';
    if (typeof data === 'string') return data;
    if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return String(data.non_field_errors[0]);
    }
    if (data.detail) return String(data.detail);
    if (data.error) return String(data.error);
    // Fallback: join first field error if present
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
      return String(data[firstKey][0]);
    }
    return e?.message || 'Something went wrong';
  };

  useEffect(() => {
    loadMoodEntries(currentPage);
  }, [currentPage]);

  // Load chart data on component mount and when period changes
  useEffect(() => {
    loadChartData();
  }, [period]);

  // Update tab when URL parameter changes (but don't reload chart)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    setShowHistory(tab === 'history');
  }, [location.search]);

  const loadMoodEntries = async (page: number = 1) => {
    try {
      setLoading(true);
      const entriesData = await getMoodEntries(page, pageSize);
      
      // Check if response is paginated
      let entriesArray: MoodEntry[] = [];
      if (entriesData && typeof entriesData === 'object' && 'results' in entriesData) {
        const paginatedData = entriesData as PaginatedResponse<MoodEntry>;
        entriesArray = paginatedData.results;
        setTotalPages(Math.ceil(paginatedData.count / pageSize));
        setTotalItems(paginatedData.count);
      } else {
        // Fallback for non-paginated response (backward compatibility)
        entriesArray = entriesData as MoodEntry[];
        setTotalPages(1);
        setTotalItems(entriesArray.length);
      }
      
      setEntries(entriesArray);
    } catch (e: any) {
      setError(e?.message || 'Failed to load mood entries');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setChartLoading(true);
      const days = period === '7' ? 7 : 30;
      const data = await getMoodChartData(days);
      
      // Format chart data for display
      const formattedChartData = data.chart_data.map(point => {
        // Parse date string (YYYY-MM-DD) as UTC
        const [year, month, day] = point.date.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
        
        return {
          date: label,
          mood_score: point.mood_score
        };
      });
      
      setChartData(formattedChartData);
      setAverageMood(data.average_mood);
    } catch (e: any) {
      console.error('Failed to load chart data:', e);
      // Don't show error to user, just set empty data
      setChartData([]);
      setAverageMood(null);
    } finally {
      setChartLoading(false);
    }
  };

  const refresh = async () => {
    await loadMoodEntries(currentPage);
    await loadChartData(); // Also refresh chart data
  };


  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (!selectedMood) return;
      await createMoodEntry({ mood_score: selectedMood, note });
      setNote('');
      setSelectedMood(null);
      await refresh();
      setSuccess('Mood saved');
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Favorite feature not supported by backend yet

  const startEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setSelectedMood(entry.mood_score);
    setNote(entry.note || '');
    setShowHistory(false);
  };

  const handleUpdate = async () => {
    if (!editingEntry || !selectedMood) return;
    const noMoodChange = selectedMood === editingEntry.mood_score;
    const currentNote = (note || '').trim();
    const originalNote = (editingEntry.note || '').trim();
    const noNoteChange = currentNote === originalNote;
    if (noMoodChange && noNoteChange) {
      setError('No changes to update');
      return;
    }
    try {
      setSaving(true);
      await updateMoodEntry(editingEntry.id, { mood_score: selectedMood, note });
      setEditingEntry(null);
      setSelectedMood(null);
      setNote('');
      await refresh();
      setSuccess('Mood updated');
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading your mood log...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-400 to-purple-400 rounded-2xl">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1>Mood Tracker</h1>
          <p className="text-gray-600">Track your emotional well-being</p>
        </div>
      </div>

      {/* Toggle View */}
      <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-md">
        <button
          onClick={() => {
            clearMessages();
            setShowHistory(false);
          }}
          className={`flex-1 py-3 rounded-xl transition-all ${
            !showHistory
              ? 'bg-gradient-to-r from-teal-400 to-purple-400 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Log Mood
        </button>
        <button
          onClick={() => {
            clearMessages();
            setShowHistory(true);
          }}
          className={`flex-1 py-3 rounded-xl transition-all ${
            showHistory
              ? 'bg-gradient-to-r from-teal-400 to-purple-400 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          History & Trends
        </button>
      </div>

      {!showHistory ? (
        <div className="bg-white rounded-3xl p-6 shadow-md">
          <h3 className="mb-4">
            {editingEntry ? 'Edit Your Mood' : 'How are you feeling today?'}
          </h3>
          <div className="grid grid-cols-5 gap-3 mb-6">
            {moodEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  clearMessages();
                  setSelectedMood(index + 1);
                }}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedMood === index + 1
                    ? 'border-teal-400 bg-teal-50 scale-110'
                    : 'border-gray-200 hover:border-teal-200 hover:bg-teal-50'
                }`}
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="text-gray-700">{moodLabels[index]}</p>
              </button>
            ))}
          </div>

          {selectedMood && (
            <div className="p-4 bg-teal-50 rounded-2xl mb-4">
              <p className="text-teal-700">
                You selected: <strong>{moodLabels[selectedMood - 1]}</strong> {moodEmojis[selectedMood - 1]}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-gray-700">Add a note (optional)</label>
            <Textarea
              placeholder="What's on your mind? Any specific reason for this mood?"
              value={note}
              onChange={(e) => {
                if (error) setError('');
                setNote(e.target.value);
              }}
              className="min-h-24"
            />
          </div>

          {!editingEntry ? (
            <Button
              onClick={handleAdd}
              disabled={!selectedMood || saving}
              className="w-full mt-4 bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
            >
              {saving ? 'Saving...' : 'Save Mood'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleUpdate}
                disabled={
                  !selectedMood ||
                  saving ||
                  (!!editingEntry &&
                    selectedMood === editingEntry.mood_score &&
                    (note || '').trim() === (editingEntry.note || '').trim())
                }
                className="w-full mt-4 bg-gradient-to-r from-teal-400 to-purple-400 hover:from-teal-500 hover:to-purple-500 text-white rounded-2xl h-12"
              >
                {saving ? 'Saving...' : 'Update Mood'}
              </Button>
              <Button
                onClick={() => {
                  clearMessages();
                  setEditingEntry(null);
                  setSelectedMood(null);
                  setNote('');
                }}
                variant="outline"
                className="w-full mt-2 rounded-2xl"
              >
                Cancel
              </Button>
            </>
          )}
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mt-3">{success}</p>}
        </div>
      ) : (
        <>
          {/* Trends */}
          <div className="bg-white rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3>Mood Trends</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearMessages();
                    setPeriod('7');
                  }}
                  disabled={chartLoading}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    period === '7' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => {
                    clearMessages();
                    setPeriod('30');
                  }}
                  disabled={chartLoading}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    period === '30' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
              </div>
            ) : chartData && chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis 
                      domain={[0, 5]} 
                      ticks={[0, 1, 2, 3, 4, 5]} 
                      stroke="#9ca3af"
                      label={{ 
                        value: 'Mood Score', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        style: { textAnchor: 'middle', fill: '#4b5563', fontSize: '14px', fontWeight: 500 } 
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                      labelStyle={{ color: '#4b5563' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mood_score"
                      stroke="#2dd4bf"
                      strokeWidth={3}
                      dot={{ fill: '#2dd4bf', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500">No chart data available for the last 7 days.</p>
            )}
            <div className="p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-2xl">
              <p className="text-gray-700">
                Average mood:{' '}
                <strong className="text-teal-600">
                  {averageMood ? `${moodEmojis[Math.round(averageMood) - 1]} ${averageMood.toFixed(1)} / 5.0` : '—'}
                </strong>
              </p>
            </div>
          </div>

          {/* Mood History */}
          <div className="bg-white rounded-3xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3>Recent Entries</h3>
            </div>

            {entries.length === 0 ? (
              <p className="text-gray-500">No entries yet.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{moodEmojis[entry.mood_score - 1]}</span>
                          <div>
                            <p className="text-gray-800">{moodLabels[entry.mood_score - 1]}</p>
                            <p className="text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {' • '}
                              {new Date(entry.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-2 hover:bg-white rounded-xl transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                      {entry.note && <p className="text-gray-600 ml-11">{entry.note}</p>}
                    </div>
                  ))}
                </div>
                {entries.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={pageSize}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}


