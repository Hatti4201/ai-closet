import mongoose, { Document, Schema } from 'mongoose';

export interface IClothingImage {
  url: string;
  isMain: boolean;
}

export interface IColor {
  family: string;
  name?: string;
}

export type Category = 'Top' | 'Bottom' | 'Shoes' | 'Accessory';
export type Pattern = 'Solid' | 'Striped' | 'Plaid' | 'Graphic' | 'Patterned';

export interface IClothingItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: Category;
  subcategory?: string;
  colors: IColor[];
  pattern: Pattern;
  material: string;
  temperatureIndex: number;
  coverageLevel: number;
  images: IClothingImage[];
  createdAt: Date;
  updatedAt: Date;
}

const ClothingItemSchema = new Schema<IClothingItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['Top', 'Bottom', 'Shoes', 'Accessory'], required: true },
    subcategory: { type: String },
    colors: [
      {
        family: { type: String, required: true },
        name: { type: String },
      },
    ],
    pattern: { type: String, enum: ['Solid', 'Striped', 'Plaid', 'Graphic', 'Patterned'], required: true },
    material: { type: String, required: true },
    temperatureIndex: { type: Number, required: true, min: 0, max: 10 },
    coverageLevel: { type: Number, required: true, min: 0, max: 10 },
    images: [
      {
        url: { type: String, required: true },
        isMain: { type: Boolean, required: true, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Always return absolute image URLs regardless of what is stored in DB
ClothingItemSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const base = (process.env.API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
    if (Array.isArray(ret.images)) {
      ret.images = ret.images.map((img: IClothingImage) => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${base}${img.url}`,
      }));
    }
    return ret;
  },
});

export default mongoose.model<IClothingItem>('ClothingItem', ClothingItemSchema);
