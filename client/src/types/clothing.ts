export type Category = 'Top' | 'Bottom' | 'Shoes' | 'Accessory';
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
  _id: string;
  userId: string;
  name: string;
  category: Category;
  subcategory?: string;
  colors: Color[];
  pattern: Pattern;
  material: string;
  temperatureIndex: number;
  coverageLevel: number;
  images: ClothingImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ClothingFilters {
  category?: Category;
  colorFamily?: string;
  pattern?: Pattern;
  material?: string;
  minTemperatureIndex?: number;
  maxTemperatureIndex?: number;
  minCoverageLevel?: number;
  maxCoverageLevel?: number;
}
