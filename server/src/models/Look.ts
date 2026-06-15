import { Schema, model, HydratedDocument } from "mongoose";
import { exposeStringId } from "./_id";

// A saved/accepted outfit (contract §2 save_look + §3 look shape).
export interface LookDoc {
  _id: string; // exposed as `id` in JSON
  memberId: string;
  itemIds: string[];
  title?: string;
  prompt: string;
  reasoning: string;
  createdAt: string; // ISO date string
}

const LookSchema = new Schema<LookDoc>(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true },
    itemIds: { type: [String], default: [] },
    title: { type: String },
    prompt: { type: String, required: true },
    reasoning: { type: String, required: true },
    createdAt: { type: String },
  },
  { versionKey: false }
);

LookSchema.index({ memberId: 1 });

LookSchema.pre("save", function (this: HydratedDocument<LookDoc>, next) {
  if (this.isNew && !this.createdAt) this.createdAt = new Date().toISOString();
  next();
});

exposeStringId(LookSchema);

export const Look = model<LookDoc>("Look", LookSchema);
