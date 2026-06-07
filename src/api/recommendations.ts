import api from './auth';
import type { RecommendationsResponse } from '../types/recommendations';

export const getRecommendations = async (): Promise<RecommendationsResponse> => {
  const response = await api.get('/recommendations/');
  return response.data;
};


