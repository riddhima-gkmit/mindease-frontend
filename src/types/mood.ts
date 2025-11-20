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
