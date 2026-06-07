export interface MoodEntry {
  id: string;
  mood_score: number; // 1-5 scale
  note?: string;
  created_at: string;
}

export interface MoodChartData {
  chart_data: Array<{
    date: string; // YYYY-MM-DD format
    mood_score: number; // 0-5 (0 means no entry)
  }>;
  average_mood: number;
  trend: string; // "Improving" | "Declining" | "Stable" | "No data"
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