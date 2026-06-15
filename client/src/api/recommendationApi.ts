import api from './authApi';
import { RecommendationResult, SavedLook } from '../types/look';

export const recommendationApi = {
  generate: (
    memberId: string,
    prompt: string,
    coords?: { lat: number; lon: number },
  ): Promise<RecommendationResult> =>
    api.post<RecommendationResult>('/recommend', { memberId, prompt, ...coords }).then((r) => r.data),

  saveLook: (params: {
    memberId: string;
    itemIds: string[];
    prompt: string;
    reasoning: string;
    title?: string;
  }): Promise<{ id: string }> =>
    api.post<{ id: string }>('/looks', params).then((r) => r.data),

  getAll: (memberId?: string): Promise<SavedLook[]> => {
    const qs = memberId ? `?memberId=${memberId}` : '';
    return api.get<SavedLook[]>(`/looks${qs}`).then((r) => r.data);
  },

  getOne: (id: string): Promise<SavedLook> =>
    api.get<SavedLook>(`/looks/${id}`).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/looks/${id}`).then(() => undefined),
};
