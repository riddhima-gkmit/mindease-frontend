import api from './axios';
import type { MoodEntry, CreateMoodEntryData, MoodAnalytics } from '../types/mood';

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

