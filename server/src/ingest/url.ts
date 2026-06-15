import cloudinary, { hasCloudinaryConfig } from "../config/cloudinary";
import {
  CATEGORIES, COLOR_FAMILIES, PATTERNS, OCCASION_TAGS,
  Category, ColorFamily, Pattern, OccasionTag,
} from "../models/enums";

export interface UrlIngestDraft {
  sourceUrl: string;
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
  images: string[];
}

interface PageMeta {
  title?: string;
  brand?: string;
  imageUrl?: string;
  description?: string;
}

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const IMAGE_EXT_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)(\?.*)?$/i;
const COLOR_ALIASES: Record<string, ColorFamily> = {
  anthracite: "Gray",
  aqua: "Blue",
  azure: "Blue",
  beige: "Beige",
  black: "Black",
  blue: "Blue",
  blush: "Pink",
  brown: "Brown",
  burgundy: "Red",
  camel: "Brown",
  charcoal: "Gray",
  chocolate: "Brown",
  cobalt: "Blue",
  copper: "Brown",
  cream: "Beige",
  crimson: "Red",
  denim: "Blue",
  ecru: "Beige",
  emerald: "Green",
  fuchsia: "Pink",
  gold: "Yellow",
  golden: "Yellow",
  gray: "Gray",
  green: "Green",
  grey: "Gray",
  indigo: "Blue",
  ivory: "White",
  khaki: "Beige",
  lavender: "Purple",
  lilac: "Purple",
  magenta: "Pink",
  maroon: "Red",
  mauve: "Purple",
  mint: "Green",
  multicolor: "Multi",
  multi: "Multi",
  natural: "Beige",
  navy: "Blue",
  nude: "Beige",
  oatmeal: "Beige",
  olive: "Green",
  orange: "Orange",
  pink: "Pink",
  purple: "Purple",
  red: "Red",
  rose: "Pink",
  rust: "Orange",
  sand: "Beige",
  silver: "Gray",
  tan: "Beige",
  taupe: "Gray",
  teal: "Green",
  turquoise: "Blue",
  violet: "Purple",
  white: "White",
  wine: "Red",
  yellow: "Yellow",
};

const clampIndex = (n: unknown, fallback: number) => {
  const value = Number(n);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(10, Math.round(value)));
};

const enumValue = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] => {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
};

function words(value: string): string[] {
  return value.toLowerCase().match(/[a-z]+/g) ?? [];
}

function normalizeColor(value: unknown): { family: ColorFamily; name?: string } | null {
  if (typeof value !== "string") return null;
  const exact = COLOR_ALIASES[value.trim().toLowerCase()];
  if (exact) return { family: exact, name: value };
  for (const word of words(value)) {
    const family = COLOR_ALIASES[word];
    if (family) return { family, name: value };
  }
  return null;
}

function colorsFromText(text: string): { family: ColorFamily; name?: string }[] {
  const seen = new Set<ColorFamily>();
  const colors: { family: ColorFamily; name?: string }[] = [];
  for (const word of words(text)) {
    const family = COLOR_ALIASES[word];
    if (family && !seen.has(family)) {
      seen.add(family);
      colors.push({ family, name: word });
    }
  }
  return colors.slice(0, 3);
}

function dedupeColors(colors: { family: ColorFamily; name?: string }[]): { family: ColorFamily; name?: string }[] {
  const seen = new Set<ColorFamily>();
  return colors.filter((color) => {
    if (seen.has(color.family)) return false;
    seen.add(color.family);
    return true;
  }).slice(0, 3);
}

function absoluteUrl(url: string, baseUrl: string): string {
  return new URL(url, baseUrl).toString();
}

function firstMatch(html: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return decodeHtml(value);
  }
  return undefined;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function brandFromUrl(url: string): string | undefined {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const token = host.split(".")[0];
  if (!token) return undefined;
  if (token.toLowerCase() === "hm") return "H&M";
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function isLikelyImageUrl(url: string): boolean {
  return IMAGE_EXT_RE.test(new URL(url).pathname);
}

function parseJsonLd(html: string): PageMeta {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(script[1].trim()));
      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      const product = items.find((item: any) => {
        const type = item?.["@type"];
        return type === "Product" || (Array.isArray(type) && type.includes("Product"));
      });
      if (!product) continue;
      const image = Array.isArray(product.image) ? product.image[0] : product.image;
      const brand = typeof product.brand === "string" ? product.brand : product.brand?.name;
      return {
        title: product.name,
        brand,
        imageUrl: typeof image === "string" ? image : undefined,
        description: product.description,
      };
    } catch {
      // Ignore malformed JSON-LD blocks and fall back to meta tags.
    }
  }
  return {};
}

async function fetchPage(url: string): Promise<PageMeta> {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "upgrade-insecure-requests": "1",
    },
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "This store blocked server-side page fetching. Try pasting the product image URL instead, or upload the image manually.",
      );
    }
    throw new Error(`Could not fetch product page (${res.status})`);
  }
  const html = await res.text();
  const jsonLd = parseJsonLd(html);
  const title = jsonLd.title ?? firstMatch(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]);
  const image = jsonLd.imageUrl ?? firstMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]);
  const description = jsonLd.description ?? firstMatch(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
  ]);

  return {
    title: title?.replace(/\s+/g, " ").trim(),
    brand: jsonLd.brand ?? brandFromUrl(url),
    imageUrl: image ? absoluteUrl(image, url) : undefined,
    description: description?.replace(/\s+/g, " ").trim(),
  };
}

async function uploadImage(imageUrl: string): Promise<string> {
  if (!hasCloudinaryConfig()) return imageUrl;
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "ai-closet/clothing",
    transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
  });
  return result.secure_url;
}

function heuristicDraft(sourceUrl: string, meta: PageMeta, imageUrl?: string): UrlIngestDraft {
  const text = `${meta.title ?? ""} ${meta.description ?? ""}`.toLowerCase();
  const category: Category =
    /dress/.test(text) ? "Dress" :
    /shoe|sneaker|boot|loafer|heel|sandal/.test(text) ? "Shoes" :
    /jean|trouser|pant|short|skirt/.test(text) ? "Bottom" :
    /coat|jacket|blazer|outerwear/.test(text) ? "Outerwear" :
    /belt|bag|scarf|hat|cap/.test(text) ? "Accessory" :
    "Top";
  const pattern: Pattern =
    /stripe/.test(text) ? "Striped" :
    /plaid|check/.test(text) ? "Plaid" :
    /graphic|print/.test(text) ? "Graphic" :
    /floral|pattern/.test(text) ? "Patterned" :
    "Solid";
  const material =
    /cotton/.test(text) ? "Cotton" :
    /wool/.test(text) ? "Wool" :
    /linen/.test(text) ? "Linen" :
    /denim/.test(text) ? "Denim" :
    /leather/.test(text) ? "Leather" :
    undefined;

  return {
    sourceUrl,
    name: meta.title ?? "Imported clothing item",
    brand: meta.brand,
    category,
    subcategory: undefined,
    colors: colorsFromText(text).length ? colorsFromText(text) : [{ family: "Multi" }],
    pattern,
    material,
    temperatureIndex: category === "Outerwear" ? 8 : category === "Shoes" ? 5 : 4,
    coverageLevel: category === "Accessory" ? 1 : category === "Shoes" ? 5 : 6,
    occasionTags: ["casual"],
    images: imageUrl ? [imageUrl] : [],
  };
}

function parseModelDraft(sourceUrl: string, meta: PageMeta, imageUrl: string | undefined, content: string): UrlIngestDraft {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? content.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1] : content;
  const parsed = JSON.parse(raw);
  const fallback = heuristicDraft(sourceUrl, meta, imageUrl);
  const colors = Array.isArray(parsed.colors)
    ? dedupeColors(parsed.colors.map((c: any) => ({
      family: normalizeColor(c?.family ?? c?.name ?? c)?.family ?? "Multi",
      name: typeof c?.name === "string" ? c.name : typeof c?.family === "string" ? c.family : undefined,
    })).filter((c: any) => c.family))
    : fallback.colors;
  const occasionTags = Array.isArray(parsed.occasionTags)
    ? parsed.occasionTags.map((tag: unknown) => enumValue(tag, OCCASION_TAGS, "casual"))
    : fallback.occasionTags;

  return {
    ...fallback,
    name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : fallback.name,
    brand: typeof parsed.brand === "string" && parsed.brand.trim() ? parsed.brand.trim() : fallback.brand,
    category: enumValue(parsed.category, CATEGORIES, fallback.category),
    subcategory: typeof parsed.subcategory === "string" ? parsed.subcategory : fallback.subcategory,
    colors: colors.length ? colors : fallback.colors,
    pattern: enumValue(parsed.pattern, PATTERNS, fallback.pattern),
    material: typeof parsed.material === "string" ? parsed.material : fallback.material,
    temperatureIndex: clampIndex(parsed.temperatureIndex, fallback.temperatureIndex),
    coverageLevel: clampIndex(parsed.coverageLevel, fallback.coverageLevel),
    occasionTags: occasionTags.length ? occasionTags : fallback.occasionTags,
    images: imageUrl ? [imageUrl] : [],
  };
}

async function callVisionModel(sourceUrl: string, meta: PageMeta, imageUrl?: string): Promise<UrlIngestDraft | null> {
  const base = process.env.LLM_BASE_URL ?? process.env.AI_BASE_URL;
  const key = process.env.LLM_API_KEY ?? process.env.AI_API_KEY;
  if (!base || !key) return null;

  const prompt =
    "Analyze this clothing product and return ONLY JSON with fields: " +
    "name, brand, category, subcategory, colors, pattern, material, temperatureIndex, coverageLevel, occasionTags. " +
    `Allowed category values: ${CATEGORIES.join(", ")}. ` +
    `Allowed color family values: ${COLOR_FAMILIES.join(", ")}. ` +
    "For colors, identify the visible dominant clothing colors from the product image. " +
    "Use colors[].family for the broad family only, and put shade names such as navy, cream, khaki, ivory, camel, or burgundy in colors[].name. " +
    "Do not default to Black unless the item is visibly black. " +
    `Allowed pattern values: ${PATTERNS.join(", ")}. ` +
    `Allowed occasionTags: ${OCCASION_TAGS.join(", ")}. ` +
    "temperatureIndex and coverageLevel are integers 0-10.";

  const content: any[] = [
    { type: "text", text: `${prompt}\nProduct URL: ${sourceUrl}\nTitle: ${meta.title ?? ""}\nBrand: ${meta.brand ?? ""}\nDescription: ${meta.description ?? ""}` },
  ];
  if (imageUrl) content.push({ type: "image_url", image_url: { url: imageUrl } });

  const res = await fetch(base.replace(/\/$/, "") + "/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? process.env.AI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content }],
      temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  return parseModelDraft(sourceUrl, meta, imageUrl, text);
}

export async function ingestProductUrl(sourceUrl: string): Promise<UrlIngestDraft> {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new Error("A valid product URL is required");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http(s) URLs are supported");

  if (isLikelyImageUrl(url.toString())) {
    const imageUrl = await uploadImage(url.toString());
    const meta: PageMeta = {
      title: "Imported clothing item",
      brand: brandFromUrl(url.toString()),
      imageUrl,
    };
    const modelDraft = await callVisionModel(url.toString(), meta, imageUrl).catch(() => null);
    return modelDraft ?? heuristicDraft(url.toString(), meta, imageUrl);
  }

  const meta = await fetchPage(url.toString());
  const imageUrl = meta.imageUrl ? await uploadImage(meta.imageUrl) : undefined;
  const modelDraft = await callVisionModel(url.toString(), meta, imageUrl).catch(() => null);
  return modelDraft ?? heuristicDraft(url.toString(), meta, imageUrl);
}
