import { ClothingItem } from "../models";
import { ContextInfo } from "../retrieval/types";

export interface RawLook {
  title: string;
  itemIds: string[];
  reasoning: string;
}

export interface RecommendationResult {
  prompt: string;
  context: ContextInfo;
  looks: RawLook[];
}

/** Parse and validate LLM JSON output. Throws if invalid. */
export function validate(raw: string, seenItemIds: Set<string>): RawLook[] {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Response is not valid JSON");
  }

  if (!Array.isArray(parsed?.looks) || parsed.looks.length < 1 || parsed.looks.length > 3) {
    throw new Error("Response must have 1–3 looks");
  }

  for (const look of parsed.looks) {
    if (!look.title || !Array.isArray(look.itemIds) || look.itemIds.length < 1 || !look.reasoning) {
      throw new Error("Look missing required fields");
    }
    for (const id of look.itemIds) {
      if (!seenItemIds.has(String(id))) {
        throw new Error(`itemId "${id}" was not returned by any tool call`);
      }
    }
  }

  return parsed.looks as RawLook[];
}

/** Code-driven fallback: pick one Top, one Bottom, one Shoes from seenItemIds.
 *  If seenItemIds is empty, query DB directly for the member. */
export async function codeFallback(
  memberId: string,
  seenItemIds: Set<string>,
): Promise<RawLook[]> {
  let candidates: { id: string; category: string }[];

  if (seenItemIds.size > 0) {
    const ids = [...seenItemIds];
    const docs = await ClothingItem.find({ _id: { $in: ids } }, { _id: 1, category: 1 });
    candidates = docs.map((d) => ({ id: d._id.toString(), category: d.category }));
    if (candidates.length === 0) {
      const docs = await ClothingItem.find({ memberId }, { _id: 1, category: 1 });
      candidates = docs.map((d) => ({ id: d._id.toString(), category: d.category }));
    }
  } else {
    const docs = await ClothingItem.find({ memberId }, { _id: 1, category: 1 });
    candidates = docs.map((d) => ({ id: d._id.toString(), category: d.category }));
  }

  const pick = (cat: string) => candidates.find((c) => c.category === cat)?.id;
  const top = pick("Top");
  const bottom = pick("Bottom");
  const shoes = pick("Shoes");
  const dress = pick("Dress");

  // Dress alone is a valid outfit; otherwise need Top+Bottom
  const itemIds = dress
    ? [dress, ...(shoes ? [shoes] : [])]
    : [top, bottom, ...(shoes ? [shoes] : [])].filter(Boolean) as string[];

  if (itemIds.length === 0) {
    // Truly empty wardrobe — return whatever we have
    itemIds.push(...candidates.slice(0, 3).map((c) => c.id));
  }

  return [
    {
      title: "Today's Pick",
      itemIds,
      reasoning: "Assembled from your wardrobe.",
    },
  ];
}
