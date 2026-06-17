import { Schema, model, HydratedDocument } from "mongoose";
import {
  CATEGORIES, COLOR_FAMILIES, PATTERNS, OCCASION_TAGS, ITEM_SOURCES,
  Category, Pattern, OccasionTag, ItemSource, Color,
} from "./enums";
import { exposeStringId } from "./_id";

// Contract §1.3
export interface ClothingItemDoc {
  _id: string; // exposed as `id` in JSON
  memberId: string;
  name: string;
  brand?: string;
  category: Category;
  subcategory?: string;
  colors: Color[];
  pattern: Pattern;
  material?: string;
  description?: string; // full product description from page
  temperatureIndex: number; // 0-10
  coverageLevel: number; // 0-10
  occasionTags: OccasionTag[];
  source: ItemSource;
  images: string[]; // max 3, images[0] = main
  purchasedAt?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

const ColorSchema = new Schema<Color>(
  {
    family: { type: String, enum: [...COLOR_FAMILIES], required: true },
    name: { type: String },
  },
  { _id: false }
);

const ClothingItemSchema = new Schema<ClothingItemDoc>(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String },
    category: { type: String, enum: [...CATEGORIES], required: true },
    subcategory: { type: String },
    colors: {
      type: [ColorSchema],
      required: true,
      validate: {
        validator: (v: Color[]) => Array.isArray(v) && v.length >= 1,
        message: "at least one color is required",
      },
    },
    pattern: { type: String, enum: [...PATTERNS], required: true },
    material: { type: String },
    description: { type: String },
    temperatureIndex: { type: Number, required: true, min: 0, max: 10 },
    coverageLevel: { type: Number, required: true, min: 0, max: 10 },
    occasionTags: { type: [{ type: String, enum: [...OCCASION_TAGS] }], default: [] },
    source: { type: String, enum: [...ITEM_SOURCES], required: true },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 3,
        message: "at most 3 images (images[0] = main)",
      },
    },
    purchasedAt: { type: String },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { versionKey: false }
);

// Retrieval indexes (contract / brief): the DB is a search layer, not just storage.
ClothingItemSchema.index({ memberId: 1 });
ClothingItemSchema.index({ category: 1 });
ClothingItemSchema.index({ temperatureIndex: 1 });
ClothingItemSchema.index({ "colors.family": 1 });
ClothingItemSchema.index({ occasionTags: 1 });

// Contract uses ISO date *strings*; manage them here instead of mongoose Dates.
ClothingItemSchema.pre("save", function (this: HydratedDocument<ClothingItemDoc>, next) {
  const now = new Date().toISOString();
  if (this.isNew) {
    if (!this.createdAt) this.createdAt = now;
    if (!this.updatedAt) this.updatedAt = now;
  } else {
    this.updatedAt = now;
  }
  next();
});

exposeStringId(ClothingItemSchema);

export const ClothingItem = model<ClothingItemDoc>("ClothingItem", ClothingItemSchema);
