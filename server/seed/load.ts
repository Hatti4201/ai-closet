import { Member, ClothingItem } from "../src/models";
import { members, items } from "./items";

// Map the seed's contract-style `id` onto mongoose's `_id`.
const toDoc = <T extends { id: string }>({ id, ...rest }: T) => ({ _id: id, ...rest });

/** Wipe + insert the sample wardrobe. Reused by the seed CLI and the dev server. */
export async function seedDatabase(): Promise<{ members: number; items: number }> {
  await Promise.all([Member.deleteMany({}), ClothingItem.deleteMany({})]);
  await Member.create(members.map(toDoc)); // .create() runs validation + hooks
  await ClothingItem.create(items.map(toDoc));
  return { members: members.length, items: items.length };
}
