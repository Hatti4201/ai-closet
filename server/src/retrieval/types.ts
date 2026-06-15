import { Category, ColorFamily, Pattern, OccasionTag } from "../models/enums";

// Params for the main search (contract §2.2 search_wardrobe). All optional.
export interface SearchWardrobeParams {
  memberId?: string;
  category?: Category;
  colorFamily?: ColorFamily;
  pattern?: Pattern;
  tempMin?: number;
  tempMax?: number;
  coverageMin?: number;
  coverageMax?: number;
  occasion?: OccasionTag;
  limit?: number; // default 50
  q?: string; // free-text keyword search across name, brand, category, subcategory, material, colors, pattern, occasionTags
}

export type Season = "spring" | "summer" | "fall" | "winter";

// Contract §2.1
export interface PreferenceProfile {
  memberId: string;
  topColors: ColorFamily[];
  preferredStyles: string[];
  preferredBrands: string[];
  avoidColors?: ColorFamily[];
  notes?: string;
}

// Contract §2.1
export interface ContextInfo {
  date: string; // ISO date
  season: Season;
  weather: { tempC: number; condition: string };
}

// Contract §2.2 save_look
export interface SaveLookParams {
  memberId: string;
  itemIds: string[];
  prompt: string;
  reasoning: string;
}
