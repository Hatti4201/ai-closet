import { Category, ClothingItem } from './clothing';

export interface LookItem {
  clothingItemId: string;
  category: Category;
  clothingItem?: ClothingItem;
}

// Returned by AI generate — not yet saved in DB
export interface UnsavedLook {
  title: string;
  prompt: string;
  items: LookItem[];
  reasoning: string;
  createdBy: 'AI' | 'User';
}

// Saved to DB (favorited AI look or user-created look)
export interface Look extends UnsavedLook {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// New backend (contracts_v1 §3) — returned by POST /api/recommend
export interface RecommendationLook {
  title: string;
  itemIds: string[];
  reasoning: string;
}

export interface RecommendationResult {
  prompt: string;
  context: {
    date: string;
    season: string;
    weather: { tempC: number; condition: string };
  };
  looks: RecommendationLook[];
}

// Saved look returned by GET /api/looks and GET /api/looks/:id
export interface SavedLook {
  id: string;
  memberId: string;
  title?: string;
  prompt: string;
  reasoning: string;
  createdAt: string;
  itemIds: string[];
  items: LookItem[];  // populated by backend
}
