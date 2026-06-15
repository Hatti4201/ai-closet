// Ingestion entry: normalize a batch of mock purchase events and store them as
// ClothingItems. Dev/demo tool for the "数据接入" pipeline (POST /api/ingest).

import { ClothingItem } from "../models";
import { PurchaseEvent } from "./types";
import { normalizePurchase } from "./normalize";

export * from "./types";
export { normalizePurchase, NormalizedItem } from "./normalize";

// New ids for ingested items (seed uses item_001..; these won't collide).
function newItemId(seq: number): string {
  return `item_${Date.now().toString(36)}${seq.toString(36)}`;
}

export async function ingestPurchases(
  events: PurchaseEvent[]
): Promise<{ inserted: number; ids: string[] }> {
  const docs = events.map((ev, i) => ({ _id: newItemId(i), ...normalizePurchase(ev) }));
  // .create() runs schema validation (enums / 0-10 ranges) + the timestamp hook.
  const created = await ClothingItem.create(docs);
  return { inserted: created.length, ids: created.map((d) => d.id) };
}
