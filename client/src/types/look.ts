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
