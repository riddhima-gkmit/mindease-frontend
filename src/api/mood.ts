import api from './auth';
import type { MoodEntry, CreateMoodEntryData, PaginatedResponse, MoodChartData } from '../types/mood';


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

// Get mood chart data with prefilled zeros for missing days
export const getMoodChartData = async (days: number = 30): Promise<MoodChartData> => {
  const response = await api.get('/mood/chart-data/', { params: { days } });
  return response.data;
};

