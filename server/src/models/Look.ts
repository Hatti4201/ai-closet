import mongoose, { Document, Schema } from 'mongoose';
import { Category } from './ClothingItem';

export interface ILookItem {
  clothingItemId: mongoose.Types.ObjectId;
  category: Category;
}

export interface ILook extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  prompt: string;
  items: ILookItem[];
  reasoning: string;
  createdBy: 'AI' | 'User';
  createdAt: Date;
  updatedAt: Date;
}

const LookSchema = new Schema<ILook>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    items: [
      {
        clothingItemId: { type: Schema.Types.ObjectId, ref: 'ClothingItem', required: true },
        category: { type: String, enum: ['Top', 'Bottom', 'Shoes', 'Accessory'], required: true },
      },
    ],
    reasoning: { type: String, required: true },
    createdBy: { type: String, enum: ['AI', 'User'], default: 'AI' },
  },
  { timestamps: true }
);

export default mongoose.model<ILook>('Look', LookSchema);
