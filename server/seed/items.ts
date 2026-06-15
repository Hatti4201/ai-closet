import {
  Category, ColorFamily, Pattern, OccasionTag, ItemSource, MemberRole,
} from "../src/models/enums";

// Seed input shapes (use the contract's `id`; the loader maps it to `_id`).
export interface SeedMember {
  id: string;
  householdId: string;
  displayName: string;
  role?: MemberRole;
}

export interface SeedItem {
  id: string;
  memberId: string;
  name: string;
  brand?: string;
  category: Category;
  subcategory?: string;
  colors: { family: ColorFamily; name?: string }[];
  pattern: Pattern;
  material?: string;
  temperatureIndex: number;
  coverageLevel: number;
  occasionTags: OccasionTag[];
  source: ItemSource;
  images: string[];
  purchasedAt?: string;
}

export const HOUSEHOLD_ID = "hh_001";

// One household, two members (generic names — no real person names).
export const members: SeedMember[] = [
  { id: "mem_001", householdId: HOUSEHOLD_ID, displayName: "用户", role: "self" },
  { id: "mem_002", householdId: HOUSEHOLD_ID, displayName: "家人", role: "partner" },
];

// 20 items: 11 for mem_001, 9 for mem_002. Covers every category, varied
// colors / patterns / temperature / coverage / occasion / source.
export const items: SeedItem[] = [
  // ----- mem_001 -----
  {
    id: "item_001", memberId: "mem_001", name: "White Cotton T-Shirt", brand: "Uniqlo",
    category: "Top", subcategory: "T-Shirt", colors: [{ family: "White" }], pattern: "Solid",
    material: "Cotton", temperatureIndex: 2, coverageLevel: 4, occasionTags: ["casual", "home"],
    source: "shop_api", images: ["/uploads/item_001_main.jpg"], purchasedAt: "2025-05-02",
  },
  {
    id: "item_002", memberId: "mem_001", name: "Navy Oxford Shirt", brand: "Uniqlo",
    category: "Top", subcategory: "Oxford Shirt", colors: [{ family: "Blue", name: "Navy" }],
    pattern: "Solid", material: "Cotton", temperatureIndex: 4, coverageLevel: 6,
    occasionTags: ["work", "casual"], source: "shop_api",
    images: ["/uploads/item_002_main.jpg"], purchasedAt: "2025-03-10",
  },
  {
    id: "item_003", memberId: "mem_001", name: "Gray Knit Sweater", brand: "Muji",
    category: "Top", subcategory: "Sweater", colors: [{ family: "Gray" }], pattern: "Solid",
    material: "Wool", temperatureIndex: 7, coverageLevel: 7, occasionTags: ["casual", "work"],
    source: "shop_api", images: ["/uploads/item_003_main.jpg"], purchasedAt: "2024-11-20",
  },
  {
    id: "item_004", memberId: "mem_001", name: "Dark Wash Jeans", brand: "Levi's",
    category: "Bottom", subcategory: "Jeans", colors: [{ family: "Blue", name: "Indigo" }],
    pattern: "Solid", material: "Denim", temperatureIndex: 5, coverageLevel: 8,
    occasionTags: ["casual", "date"], source: "shop_api",
    images: ["/uploads/item_004_main.jpg"], purchasedAt: "2025-01-15",
  },
  {
    id: "item_005", memberId: "mem_001", name: "Black Chinos", brand: "Dockers",
    category: "Bottom", subcategory: "Chinos", colors: [{ family: "Black" }], pattern: "Solid",
    material: "Cotton", temperatureIndex: 5, coverageLevel: 8, occasionTags: ["work", "casual"],
    source: "manual", images: ["/uploads/item_005_main.jpg"], purchasedAt: "2024-09-30",
  },
  {
    id: "item_006", memberId: "mem_001", name: "Athletic Shorts", brand: "Nike",
    category: "Bottom", subcategory: "Shorts", colors: [{ family: "Black" }], pattern: "Solid",
    material: "Polyester", temperatureIndex: 1, coverageLevel: 3, occasionTags: ["sport", "home"],
    source: "shop_api", images: ["/uploads/item_006_main.jpg"], purchasedAt: "2025-04-18",
  },
  {
    id: "item_007", memberId: "mem_001", name: "White Sneakers", brand: "Adidas",
    category: "Shoes", subcategory: "Sneakers", colors: [{ family: "White" }], pattern: "Solid",
    material: "Leather", temperatureIndex: 4, coverageLevel: 5, occasionTags: ["casual", "sport"],
    source: "shop_api", images: ["/uploads/item_007_main.jpg"], purchasedAt: "2025-02-08",
  },
  {
    id: "item_008", memberId: "mem_001", name: "Brown Leather Loafers", brand: "Clarks",
    category: "Shoes", subcategory: "Loafers", colors: [{ family: "Brown" }], pattern: "Solid",
    material: "Leather", temperatureIndex: 5, coverageLevel: 5, occasionTags: ["work", "formal"],
    source: "shop_api", images: ["/uploads/item_008_main.jpg"], purchasedAt: "2024-10-12",
  },
  {
    id: "item_009", memberId: "mem_001", name: "Navy Puffer Jacket", brand: "Uniqlo",
    category: "Outerwear", subcategory: "Puffer", colors: [{ family: "Blue", name: "Navy" }],
    pattern: "Solid", material: "Nylon", temperatureIndex: 9, coverageLevel: 9,
    occasionTags: ["outdoor", "casual"], source: "shop_api",
    images: ["/uploads/item_009_main.jpg"], purchasedAt: "2024-12-01",
  },
  {
    id: "item_010", memberId: "mem_001", name: "Beige Trench Coat", brand: "Burberry",
    category: "Outerwear", subcategory: "Trench", colors: [{ family: "Beige" }], pattern: "Solid",
    material: "Cotton", temperatureIndex: 6, coverageLevel: 8, occasionTags: ["work", "formal"],
    source: "manual", images: ["/uploads/item_010_main.jpg"], purchasedAt: "2024-10-25",
  },
  {
    id: "item_011", memberId: "mem_001", name: "Black Leather Belt",
    category: "Accessory", subcategory: "Belt", colors: [{ family: "Black" }], pattern: "Solid",
    material: "Leather", temperatureIndex: 0, coverageLevel: 1,
    occasionTags: ["work", "formal", "casual"], source: "manual",
    images: ["/uploads/item_011_main.jpg"], purchasedAt: "2024-08-14",
  },

  // ----- mem_002 -----
  {
    id: "item_012", memberId: "mem_002", name: "Floral Summer Dress", brand: "Zara",
    category: "Dress", subcategory: "Sundress",
    colors: [{ family: "Multi" }, { family: "Pink" }], pattern: "Patterned", material: "Viscose",
    temperatureIndex: 2, coverageLevel: 5, occasionTags: ["date", "party", "casual"],
    source: "shop_api", images: ["/uploads/item_012_main.jpg"], purchasedAt: "2025-05-20",
  },
  {
    id: "item_013", memberId: "mem_002", name: "Striped Long-Sleeve Tee", brand: "COS",
    category: "Top", subcategory: "Tee",
    colors: [{ family: "White" }, { family: "Blue", name: "Navy" }], pattern: "Striped",
    material: "Cotton", temperatureIndex: 4, coverageLevel: 6, occasionTags: ["casual", "work"],
    source: "shop_api", images: ["/uploads/item_013_main.jpg"], purchasedAt: "2025-03-22",
  },
  {
    id: "item_014", memberId: "mem_002", name: "Pink Silk Blouse", brand: "Aritzia",
    category: "Top", subcategory: "Blouse", colors: [{ family: "Pink" }], pattern: "Solid",
    material: "Silk", temperatureIndex: 3, coverageLevel: 6, occasionTags: ["work", "date"],
    source: "shop_api", images: ["/uploads/item_014_main.jpg"], purchasedAt: "2025-02-28",
  },
  {
    id: "item_015", memberId: "mem_002", name: "High-Waist Black Trousers", brand: "Aritzia",
    category: "Bottom", subcategory: "Trousers", colors: [{ family: "Black" }], pattern: "Solid",
    material: "Polyester", temperatureIndex: 5, coverageLevel: 8, occasionTags: ["work", "formal"],
    source: "shop_api", images: ["/uploads/item_015_main.jpg"], purchasedAt: "2025-01-30",
  },
  {
    id: "item_016", memberId: "mem_002", name: "Denim Skirt", brand: "Levi's",
    category: "Bottom", subcategory: "Skirt", colors: [{ family: "Blue" }], pattern: "Solid",
    material: "Denim", temperatureIndex: 3, coverageLevel: 5, occasionTags: ["casual", "date"],
    source: "shop_api", images: ["/uploads/item_016_main.jpg"], purchasedAt: "2025-04-05",
  },
  {
    id: "item_017", memberId: "mem_002", name: "Black Ankle Boots", brand: "Steve Madden",
    category: "Shoes", subcategory: "Boots", colors: [{ family: "Black" }], pattern: "Solid",
    material: "Leather", temperatureIndex: 6, coverageLevel: 6,
    occasionTags: ["casual", "date", "work"], source: "shop_api",
    images: ["/uploads/item_017_main.jpg"], purchasedAt: "2024-11-08",
  },
  {
    id: "item_018", memberId: "mem_002", name: "Beige Heels", brand: "Nine West",
    category: "Shoes", subcategory: "Heels", colors: [{ family: "Beige" }], pattern: "Solid",
    material: "Leather", temperatureIndex: 4, coverageLevel: 4,
    occasionTags: ["formal", "party", "date"], source: "manual",
    images: ["/uploads/item_018_main.jpg"], purchasedAt: "2024-12-18",
  },
  {
    id: "item_019", memberId: "mem_002", name: "Camel Wool Coat", brand: "Max Mara",
    category: "Outerwear", subcategory: "Coat", colors: [{ family: "Brown", name: "Camel" }],
    pattern: "Solid", material: "Wool", temperatureIndex: 8, coverageLevel: 9,
    occasionTags: ["work", "formal", "outdoor"], source: "shop_api",
    images: ["/uploads/item_019_main.jpg"], purchasedAt: "2024-10-02",
  },
  {
    id: "item_020", memberId: "mem_002", name: "Green Silk Scarf", brand: "Hermes",
    category: "Accessory", subcategory: "Scarf", colors: [{ family: "Green" }], pattern: "Patterned",
    material: "Silk", temperatureIndex: 1, coverageLevel: 2,
    occasionTags: ["formal", "date", "party"], source: "shop_api",
    images: ["/uploads/item_020_main.jpg"], purchasedAt: "2025-02-14",
  },
];
