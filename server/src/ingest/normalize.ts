// The core of A's "数据接入": map a raw shop purchase event → a ClothingItem.
// Material comes straight from the product data (the honest insight — we never
// guess it from an image). Category/color/pattern/occasion are keyword-mapped to
// our frozen enums; temperature & coverage are rule-of-thumb estimates by type.
//
// LIMITATION (write this in the report): these heuristics only run on NEW
// purchases that arrive through this feed — existing closet items can't be
// back-filled, and the real shop integration is mocked.

import {
  Category, Pattern, OccasionTag, Color, ColorFamily, ItemSource,
} from "../models/enums";
import { PurchaseEvent } from "./types";

export interface NormalizedItem {
  memberId: string;
  name: string;
  brand?: string;
  category: Category;
  subcategory?: string;
  colors: Color[];
  pattern: Pattern;
  material?: string;
  temperatureIndex: number;
  coverageLevel: number;
  occasionTags: OccasionTag[];
  source: ItemSource;
  images: string[];
  purchasedAt?: string;
}

// First keyword that matches wins. Order matters (Outerwear before Top, etc.).
const CATEGORY_MAP: [RegExp, Category][] = [
  [/coat|jacket|puffer|trench|blazer|parka|cardigan|outerwear/i, "Outerwear"],
  [/dress|gown|sundress/i, "Dress"],
  [/shoe|sneaker|boot|heel|loafer|sandal|trainer|pump|flat/i, "Shoes"],
  [/jean|pant|trouser|chino|short|skirt|legging|jogger/i, "Bottom"],
  [/shirt|tee|t-shirt|top|blouse|sweater|hoodie|polo|knit|tank|jumper/i, "Top"],
  [/belt|scarf|hat|cap|bag|watch|jewel|tie|glove|sock|accessor/i, "Accessory"],
];

const COLOR_MAP: [RegExp, ColorFamily][] = [
  [/black|onyx|charcoal/i, "Black"],
  [/white|ivory|cream|off.?white/i, "White"],
  [/gr[ae]y|silver/i, "Gray"],
  [/navy|blue|indigo|denim|cobalt|teal/i, "Blue"],
  [/green|olive|emerald|sage|mint/i, "Green"],
  [/red|crimson|maroon|burgundy|wine/i, "Red"],
  [/pink|rose|blush|fuchsia/i, "Pink"],
  [/purple|violet|lavender|plum/i, "Purple"],
  [/yellow|gold|mustard/i, "Yellow"],
  [/orange|coral|rust|terracotta/i, "Orange"],
  [/brown|tan|camel|chocolate|coffee|taupe/i, "Brown"],
  [/beige|khaki|sand|nude|stone/i, "Beige"],
  [/multi|floral|rainbow|colou?rful/i, "Multi"],
];

const PATTERN_MAP: [RegExp, Pattern][] = [
  [/stripe/i, "Striped"],
  [/plaid|check|gingham|tartan/i, "Plaid"],
  [/graphic|logo|slogan/i, "Graphic"],
  [/floral|paisley|polka|patterned|printed|\bprint\b/i, "Patterned"],
];

// Base [temperatureIndex, coverageLevel] per category, before keyword adjustments.
const THERMAL_BASE: Record<Category, [number, number]> = {
  Top: [3, 5],
  Bottom: [5, 8],
  Shoes: [4, 5],
  Outerwear: [8, 9],
  Dress: [2, 5],
  Accessory: [1, 2],
};

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

function firstMatch<T>(table: [RegExp, T][], text: string, fallback: T): T {
  for (const [re, val] of table) if (re.test(text)) return val;
  return fallback;
}

function estimateThermal(category: Category, text: string): [number, number] {
  let [t, c] = THERMAL_BASE[category];
  const has = (re: RegExp) => re.test(text);
  if (has(/t-?shirt|tee|tank|sleeveless|short.?sleeve/i)) t -= 1;
  if (has(/long.?sleeve|oxford/i)) t += 1;
  if (has(/sweater|knit|hoodie|fleece|wool|cashmere|down|puffer|quilted/i)) { t += 3; c += 1; }
  if (has(/\bshorts?\b/i)) { t -= 3; c -= 4; }
  if (has(/skirt|mini/i)) c -= 3;
  if (has(/linen|silk|mesh|sheer|chiffon/i)) t -= 1;
  return [clamp(t), clamp(c)];
}

function deriveOccasions(text: string): OccasionTag[] {
  const tags = new Set<OccasionTag>(["casual"]); // always wearable casually
  if (/oxford|blazer|trouser|chino|loafer|blouse|button.?down|dress shirt|suit|pump/i.test(text)) tags.add("work");
  if (/gown|tuxedo|formal|stiletto|\bheel/i.test(text)) tags.add("formal");
  if (/athletic|running|gym|sport|active|training|yoga|track/i.test(text)) tags.add("sport");
  if (/pajama|lounge|sleep|robe/i.test(text)) tags.add("home");
  if (/parka|trench|coat|puffer|rain|hiking|outdoor/i.test(text)) tags.add("outdoor");
  return [...tags];
}

const titleCase = (s: string): string | undefined =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : undefined;

/** Map one raw purchase event to ClothingItem fields (no id / timestamps). */
export function normalizePurchase(ev: PurchaseEvent): NormalizedItem {
  const p = ev.product;
  const hay = `${p.category} ${p.title}`; // keyword search space

  const category = firstMatch(CATEGORY_MAP, hay, "Accessory");
  const colorFamily = firstMatch(COLOR_MAP, `${p.color ?? ""} ${p.title}`, "Multi");
  const pattern = firstMatch(PATTERN_MAP, p.title, "Solid");
  const [temperatureIndex, coverageLevel] = estimateThermal(category, hay);

  const colors: Color[] = [{ family: colorFamily, ...(p.color ? { name: p.color } : {}) }];

  return {
    memberId: ev.memberId,
    name: p.title,
    brand: p.brand,
    category,
    subcategory: titleCase(p.category),
    colors,
    pattern,
    material: p.material, // straight from product data
    temperatureIndex,
    coverageLevel,
    occasionTags: deriveOccasions(hay),
    source: "shop_api",
    images: p.imageUrl ? [p.imageUrl] : [],
    purchasedAt: ev.purchasedAt,
  };
}
