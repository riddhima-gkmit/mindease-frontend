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

export interface MoodChartData {
  chart_data: Array<{
    date: string; // YYYY-MM-DD format
    mood_score: number; // 0-5 (0 means no entry)
  }>;
  average_mood: number;
  total_entries: number;
  days: number;
}

export interface CreateMoodEntryData {
  mood_score: number;
  note?: string;
}

// Paginated response interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Get all mood entries for the current user
export const getMoodEntries = async (page?: number, pageSize?: number): Promise<PaginatedResponse<MoodEntry> | MoodEntry[]> => {
  const params: any = {};
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get('/mood/', { params });
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

// Get mood chart data with prefilled zeros for missing days
export const getMoodChartData = async (days: number = 30): Promise<MoodChartData> => {
  const response = await api.get('/mood/chart-data/', { params: { days } });
  return response.data;
};

