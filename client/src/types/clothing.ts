export type Category = 'Top' | 'Bottom' | 'Shoes' | 'Outerwear' | 'Dress' | 'Accessory';
export type Pattern = 'Solid' | 'Striped' | 'Plaid' | 'Graphic' | 'Patterned';

export interface ClothingImage {
  url: string;
  isMain: boolean;
}

export interface Color {
  family: string;
  name?: string;
}

export interface ClothingItem {
  id: string;                          // new backend: exposeStringId outputs `id`
  _id?: string;                        // may be absent in new backend responses
  memberId?: string;
  name: string;
  brand?: string;
  category: Category;
  subcategory?: string;
  colors: Color[];
  pattern: Pattern;
  material?: string;
  temperatureIndex: number;
  coverageLevel: number;
  images: (string | ClothingImage)[];  // new backend: string[]; old: ClothingImage[]
  createdAt: string;
  updatedAt?: string;
}

export interface ClothingFilters {
  q?: string;
  category?: Category;
  colorFamily?: string;
  pattern?: Pattern;
  material?: string;
  minTemperatureIndex?: number;
  maxTemperatureIndex?: number;
  minCoverageLevel?: number;
  maxCoverageLevel?: number;
}
