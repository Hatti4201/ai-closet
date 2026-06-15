// Shared enums — the single source of truth for the contract §1.1 value sets.
// Keep these in sync with contracts_v1.md (any change = version bump + team sync).

export const CATEGORIES = [
  "Top", "Bottom", "Shoes", "Outerwear", "Dress", "Accessory",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const COLOR_FAMILIES = [
  "Black", "White", "Gray", "Blue", "Green", "Red", "Pink",
  "Purple", "Yellow", "Orange", "Brown", "Beige", "Multi",
] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const PATTERNS = [
  "Solid", "Striped", "Plaid", "Graphic", "Patterned",
] as const;
export type Pattern = (typeof PATTERNS)[number];

export const OCCASION_TAGS = [
  "casual", "work", "formal", "date", "sport", "home", "party", "outdoor",
] as const;
export type OccasionTag = (typeof OCCASION_TAGS)[number];

export const ITEM_SOURCES = ["shop_api", "ai_scan", "manual"] as const;
export type ItemSource = (typeof ITEM_SOURCES)[number];

export const MEMBER_ROLES = ["self", "partner", "child", "other"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export interface Color {
  family: ColorFamily;
  name?: string;
}
