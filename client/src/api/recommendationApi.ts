import api from './authApi';
import { Look, LookItem, UnsavedLook } from '../types/look';

export const recommendationApi = {
  generate: (prompt: string): Promise<{ looks: UnsavedLook[] }> =>
    api.post<{ looks: UnsavedLook[] }>('/recommendations/generate', { prompt }).then((r) => r.data),

  save: (look: UnsavedLook): Promise<Look> =>
    api.post<Look>('/recommendations', {
      title: look.title,
      prompt: look.prompt,
      reasoning: look.reasoning,
      createdBy: look.createdBy,
      items: look.items.map((i) => ({ clothingItemId: i.clothingItemId, category: i.category })),
    }).then((r) => r.data),

  create: (data: { title: string; items: LookItem[] }): Promise<Look> =>
    api.post<Look>('/recommendations', {
      title: data.title,
      prompt: '',
      reasoning: '',
      createdBy: 'User',
      items: data.items.map((i) => ({ clothingItemId: i.clothingItemId, category: i.category })),
    }).then((r) => r.data),

  getAll: (): Promise<{ looks: Look[] }> =>
    api.get<{ looks: Look[] }>('/recommendations').then((r) => r.data),

  getOne: (id: string): Promise<Look> =>
    api.get<Look>(`/recommendations/${id}`).then((r) => r.data),

  update: (id: string, items: LookItem[]): Promise<Look> =>
    api.put<Look>(`/recommendations/${id}`, { items }).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/recommendations/${id}`).then(() => undefined),
};
