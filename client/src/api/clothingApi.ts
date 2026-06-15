import api from './authApi';
import { ClothingItem, ClothingFilters } from '../types/clothing';

export type ImportedClothingDraft = Pick<
  ClothingItem,
  'name' | 'brand' | 'category' | 'subcategory' | 'colors' | 'pattern' | 'material' |
  'temperatureIndex' | 'coverageLevel' | 'images'
> & {
  sourceUrl: string;
  occasionTags?: string[];
  memberId?: string;
};

export const clothingApi = {
  create: (formData: FormData): Promise<ClothingItem> =>
    api.post<ClothingItem>('/clothing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  importUrl: (url: string): Promise<ImportedClothingDraft> =>
    api.post<ImportedClothingDraft>('/ingest/url', { url }).then((r) => r.data),

  createImported: (draft: ImportedClothingDraft): Promise<ClothingItem> =>
    api.post<ClothingItem>('/clothing/import', draft).then((r) => r.data),

  getAll: (filters?: ClothingFilters): Promise<ClothingItem[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.append(k, String(v));
      });
    }
    return api.get<ClothingItem[]>(`/wardrobe?${params.toString()}`).then((r) => r.data);
  },

  getOne: (id: string): Promise<ClothingItem> =>
    api.get<ClothingItem>(`/wardrobe/${id}`).then((r) => r.data),

  update: (id: string, formData: FormData): Promise<ClothingItem> =>
    api.put<ClothingItem>(`/clothing/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/clothing/${id}`).then(() => undefined),
};
