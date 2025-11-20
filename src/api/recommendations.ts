import api from './auth';

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  category: 'uplifting' | 'maintenance' | 'gratitude' | 'calming' | string;
  created_at: string;
}

export interface RecommendationsResponse {
  average_mood?: number;
  recommended_category?: string;
  recommendations?: RecommendationItem[];
  message?: string;
}

export const getRecommendations = async (): Promise<RecommendationsResponse> => {
  const response = await api.get('/recommendations/');
  return response.data;
};


