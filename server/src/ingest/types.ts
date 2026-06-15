// Mock "purchase feed" shapes (contracts_v1.md §1.5). This is A's INPUT — not an
// outward contract. A normalizes these shop events into ClothingItem (§1.3).

export interface PurchaseProduct {
  title: string;
  brand?: string;
  category: string; // shop's raw category, e.g. "shirt" / "jeans" / "coat"
  color?: string; // shop's raw color, e.g. "navy"
  material?: string; // KEY: comes from product data, never guessed from an image
  imageUrl?: string;
}

export interface PurchaseEvent {
  memberId: string;
  purchasedAt?: string; // ISO date
  product: PurchaseProduct;
}
