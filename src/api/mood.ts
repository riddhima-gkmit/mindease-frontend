import api from './auth';

export interface MoodEntry {
  id: string;
  mood_score: number; // 1-5 scale
  note?: string;
  created_at: string;
}

export interface MoodAnalytics {
  average_mood: number;
  trend: string;
  chart_data: Array<{
    date: string;
    mood_score: number;
  }>;
}

export interface CreateMoodEntryData {
  mood_score: number;
  note?: string;
}

// Get all mood entries for the current user
export const getMoodEntries = async (): Promise<MoodEntry[]> => {
  const response = await api.get('/mood/');
  return response.data;
};

// Create a new mood entry
export const createMoodEntry = async (data: CreateMoodEntryData): Promise<{ message: string }> => {
  const response = await api.post('/mood/', data);
  return response.data;
};

// Update a mood entry
export const updateMoodEntry = async (moodId: string, data: Partial<CreateMoodEntryData>): Promise<{ message: string }> => {
  const response = await api.put(`/mood/${moodId}/`, data);
  return response.data;
};

// Get mood analytics (7-day summary)
export const getMoodAnalytics = async (): Promise<MoodAnalytics> => {
  const response = await api.get('/mood/analytics/');
  return response.data;
};

