import { Schema } from "mongoose";

// We use custom string _id values (e.g. "mem_001", "item_001") to match the
// contract samples. This helper makes the JSON output expose `id` (not `_id`),
// so documents come out exactly in the contract §1 shape.
export function exposeStringId(schema: Schema): void {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  });
  schema.set("toObject", { virtuals: true, versionKey: false });
}
