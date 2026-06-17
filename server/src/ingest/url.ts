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
  description?: string;
  temperatureIndex: number;
  coverageLevel: number;
  occasionTags: OccasionTag[];
  images: string[];
}

interface PageMeta {
  title?: string;
  brand?: string;
  images: string[];      // all candidate images, ordered by relevance
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

function textHas(text: string, pattern: RegExp): boolean {
  return pattern.test(text.toLowerCase());
}

function clampRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function calibrateWarmth(params: {
  category: Category;
  subcategory?: string;
  material?: string;
  title?: string;
  description?: string;
  temperatureIndex: number;
  coverageLevel: number;
}): { temperatureIndex: number; coverageLevel: number } {
  const text = `${params.title ?? ""} ${params.description ?? ""} ${params.subcategory ?? ""} ${params.material ?? ""}`.toLowerCase();
  const material = params.material?.toLowerCase() ?? "";

  let tempMin = 0;
  let tempMax = 10;
  let covMin = 0;
  let covMax = 10;

  switch (params.category) {
    case "Shoes":
      tempMin = 1; tempMax = 6; covMin = 2; covMax = 7;
      if (textHas(text, /sandal|slide|flip\s?flop|open toe|espadrille/)) {
        tempMin = 0; tempMax = 3; covMin = 1; covMax = 4;
      } else if (textHas(text, /boot|ankle boot|chelsea|snow|winter/)) {
        tempMin = 5; tempMax = 8; covMin = 5; covMax = 8;
      }
      break;
    case "Bottom":
      tempMin = 2; tempMax = 7; covMin = 4; covMax = 9;
      if (textHas(text, /short|bermuda|skort/)) {
        tempMin = 0; tempMax = 3; covMin = 2; covMax = 4;
      } else if (textHas(text, /jean|denim|trouser|pant|legging/)) {
        tempMin = 4; tempMax = 7; covMin = 7; covMax = 9;
      } else if (textHas(text, /skirt|mini/)) {
        tempMin = 1; tempMax = 5; covMin = 3; covMax = 6;
      }
      break;
    case "Top":
      tempMin = 1; tempMax = 7; covMin = 3; covMax = 8;
      if (textHas(text, /tank|camisole|crop|sleeveless|vest top/)) {
        tempMin = 0; tempMax = 3; covMin = 1; covMax = 4;
      } else if (textHas(text, /t-?shirt|tee|polo|linen/)) {
        tempMin = 1; tempMax = 4; covMin = 3; covMax = 5;
      } else if (textHas(text, /sweater|jumper|hoodie|sweatshirt|fleece|knit/)) {
        tempMin = 6; tempMax = 9; covMin = 6; covMax = 8;
      } else if (textHas(text, /shirt|blouse|long sleeve/)) {
        tempMin = 3; tempMax = 6; covMin = 5; covMax = 7;
      }
      break;
    case "Outerwear":
      tempMin = 5; tempMax = 10; covMin = 7; covMax = 10;
      if (textHas(text, /trench|rain|windbreaker|lightweight|linen/)) {
        tempMin = 5; tempMax = 7; covMin = 7; covMax = 9;
      } else if (textHas(text, /puffer|down|parka|wool|winter/)) {
        tempMin = 8; tempMax = 10; covMin = 8; covMax = 10;
      }
      break;
    case "Dress":
      tempMin = 2; tempMax = 7; covMin = 4; covMax = 8;
      if (textHas(text, /sundress|mini|sleeveless|linen|summer/)) {
        tempMin = 1; tempMax = 4; covMin = 3; covMax = 5;
      } else if (textHas(text, /knit|sweater|wool|long sleeve/)) {
        tempMin = 5; tempMax = 8; covMin = 6; covMax = 8;
      }
      break;
    case "Accessory":
      tempMin = 0; tempMax = 4; covMin = 0; covMax = 3;
      if (textHas(text, /scarf|beanie|glove|wool|cashmere/)) {
        tempMin = 4; tempMax = 7; covMin = 1; covMax = 4;
      }
      break;
  }

  if (/(wool|cashmere|fleece|down|quilt|thermal)/.test(material)) {
    tempMin = Math.max(tempMin, 6);
    tempMax = Math.max(tempMax, 8);
  }
  if (/(linen|mesh|chiffon|viscose|rayon)/.test(material)) {
    tempMax = Math.min(tempMax, 4);
  }
  if (/(leather|suede|denim)/.test(material) && params.category !== "Shoes") {
    tempMin = Math.max(tempMin, 4);
  }

  return {
    temperatureIndex: clampRange(params.temperatureIndex, tempMin, tempMax),
    coverageLevel: clampRange(params.coverageLevel, covMin, covMax),
  };
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

/** Return true for icons, thumbnails, and other non-product images. */
function isNoiseImage(url: string): boolean {
  return /thumb(?:nail)?|_\d{2,3}x\d{0,3}|\/\d{2,3}x\d{2,3}\/|icon|logo|badge|avatar|sprite|placeholder|swatch|dot\.|pixel|rating|star|arrow/i.test(url);
}

/** Deduplicate by pathname (ignores query params / CDN sizing tokens). */
function dedupeImages(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter(url => {
    const key = (() => { try { return new URL(url).pathname; } catch { return url; } })();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Score a URL to surface flat-lay / model shots: higher = more desirable. */
function imageScore(url: string): number {
  const u = url.toLowerCase();
  if (/front|_f\d|[_-]1[._]|main|primary|hero/.test(u)) return 30;
  if (/back|rear|_b\d/.test(u)) return 20;
  if (/model|worn|lifestyle|on.?body|look|worn/.test(u)) return 15;
  if (/detail|close.?up|zoom/.test(u)) return 5;
  return 10;
}

/** Extract all product image URLs from JSON-LD scripts. */
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

      // Collect all images from the JSON-LD array
      const rawImages: string[] = [];
      const imgField = product.image;
      if (typeof imgField === "string") rawImages.push(imgField);
      else if (Array.isArray(imgField)) {
        for (const img of imgField) {
          if (typeof img === "string") rawImages.push(img);
          else if (img?.url) rawImages.push(img.url);
          else if (img?.contentUrl) rawImages.push(img.contentUrl);
        }
      } else if (imgField?.url) rawImages.push(imgField.url);
      else if (imgField?.contentUrl) rawImages.push(imgField.contentUrl);

      const brand = typeof product.brand === "string" ? product.brand : product.brand?.name;
      return {
        title: product.name,
        brand,
        images: rawImages.filter(Boolean),
        description: product.description,
      };
    } catch {
      // Ignore malformed JSON-LD blocks and fall back to meta tags.
    }
  }
  return { images: [] };
}

/** Scan HTML for product gallery images (lazy-loaded or inline). */
function extractGalleryImages(html: string, baseUrl: string): string[] {
  const results: string[] = [];
  // data-zoom-src / data-src are common for product galleries
  const patterns = [
    /data-zoom-src=["']([^"']+)["']/gi,
    /data-src=["']([^"']+)["']/gi,
    /data-srcset=["']([^"']+)["']/gi,
    /<img[^>]+src=["']([^"']+)["']/gi,
  ];
  for (const re of patterns) {
    for (const m of html.matchAll(re)) {
      // srcset: take the last (largest) url
      const raw = m[1].trim().split(",").pop()?.trim().split(/\s+/)[0] ?? m[1].trim();
      if (!IMAGE_EXT_RE.test(raw) || isNoiseImage(raw)) continue;
      try { results.push(absoluteUrl(raw, baseUrl)); } catch {}
    }
  }
  return results;
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

  const description = jsonLd.description ?? firstMatch(html, [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
  ]);

  // Collect images: JSON-LD array first (best quality + ordering), then og/twitter fallback, then gallery scan
  const ogImage = firstMatch(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]);

  const galleryImages = extractGalleryImages(html, url);

  const allCandidates = [
    ...jsonLd.images.map(img => { try { return absoluteUrl(img, url); } catch { return ""; } }).filter(Boolean),
    ...(ogImage ? [absoluteUrl(ogImage, url)] : []),
    ...galleryImages,
  ].filter(u => !isNoiseImage(u));

  // Dedupe, then sort: JSON-LD images first (keep order), then score-rank the rest
  const jsonLdSet = new Set(jsonLd.images.map(img => { try { return new URL(absoluteUrl(img, url)).pathname; } catch { return ""; } }));
  const deduped = dedupeImages(allCandidates);
  const sorted = [
    ...deduped.filter(u => { try { return jsonLdSet.has(new URL(u).pathname); } catch { return false; } }),
    ...deduped.filter(u => { try { return !jsonLdSet.has(new URL(u).pathname); } catch { return true; } })
      .sort((a, b) => imageScore(b) - imageScore(a)),
  ];

  return {
    title: title?.replace(/\s+/g, " ").trim(),
    brand: jsonLd.brand ?? brandFromUrl(url),
    images: sorted.slice(0, 8), // keep up to 8 candidates for AI / heuristic selection
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

/** Upload up to `max` images concurrently; fall back to raw URL on failure. */
async function uploadImages(imageUrls: string[], max = 3): Promise<string[]> {
  const candidates = imageUrls.slice(0, max);
  const results = await Promise.allSettled(candidates.map(url => uploadImage(url)));
  return results.map((r, i) => r.status === "fulfilled" ? r.value : candidates[i]);
}

function heuristicDraft(sourceUrl: string, meta: PageMeta, images: string[]): UrlIngestDraft {
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
  const warm = calibrateWarmth({
    category,
    subcategory: undefined,
    material,
    title: meta.title,
    description: meta.description,
    temperatureIndex: category === "Outerwear" ? 8 : category === "Shoes" ? 5 : 4,
    coverageLevel: category === "Accessory" ? 1 : category === "Shoes" ? 5 : 6,
  });

  return {
    sourceUrl,
    name: meta.title ?? "Imported clothing item",
    brand: meta.brand,
    category,
    subcategory: undefined,
    colors: colorsFromText(text).length ? colorsFromText(text) : [{ family: "Multi" }],
    pattern,
    material,
    description: meta.description,
    temperatureIndex: warm.temperatureIndex,
    coverageLevel: warm.coverageLevel,
    occasionTags: ["casual"],
    images,
  };
}

function parseModelDraft(sourceUrl: string, meta: PageMeta, images: string[], content: string): UrlIngestDraft {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? content.match(/(\{[\s\S]*\})/);
  const raw = jsonMatch ? jsonMatch[1] : content;
  const parsed = JSON.parse(raw);
  const fallback = heuristicDraft(sourceUrl, meta, images);
  const colors = Array.isArray(parsed.colors)
    ? dedupeColors(parsed.colors.map((c: any) => ({
      family: normalizeColor(c?.family ?? c?.name ?? c)?.family ?? "Multi",
      name: typeof c?.name === "string" ? c.name : typeof c?.family === "string" ? c.family : undefined,
    })).filter((c: any) => c.family))
    : fallback.colors;
  const occasionTags = Array.isArray(parsed.occasionTags)
    ? parsed.occasionTags.map((tag: unknown) => enumValue(tag, OCCASION_TAGS, "casual"))
    : fallback.occasionTags;
  const category = enumValue(parsed.category, CATEGORIES, fallback.category);
  const subcategory = typeof parsed.subcategory === "string" ? parsed.subcategory : fallback.subcategory;
  const material = typeof parsed.material === "string" ? parsed.material : fallback.material;
  const warm = calibrateWarmth({
    category,
    subcategory,
    material,
    title: typeof parsed.name === "string" ? parsed.name : fallback.name,
    description: meta.description,
    temperatureIndex: clampIndex(parsed.temperatureIndex, fallback.temperatureIndex),
    coverageLevel: clampIndex(parsed.coverageLevel, fallback.coverageLevel),
  });

  return {
    ...fallback,
    name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : fallback.name,
    brand: typeof parsed.brand === "string" && parsed.brand.trim() ? parsed.brand.trim() : fallback.brand,
    category,
    subcategory,
    colors: colors.length ? colors : fallback.colors,
    pattern: enumValue(parsed.pattern, PATTERNS, fallback.pattern),
    material,
    description: typeof parsed.description === "string" && parsed.description.trim()
      ? parsed.description.trim()
      : fallback.description,
    temperatureIndex: warm.temperatureIndex,
    coverageLevel: warm.coverageLevel,
    occasionTags: occasionTags.length ? occasionTags : fallback.occasionTags,
    images,
  };
}

async function callVisionModel(sourceUrl: string, meta: PageMeta, images: string[]): Promise<UrlIngestDraft | null> {
  const base = process.env.LLM_BASE_URL ?? process.env.AI_BASE_URL;
  const key = process.env.LLM_API_KEY ?? process.env.AI_API_KEY;
  if (!base || !key) return null;

  const imageList = images.length
    ? `\nCandidate images (ordered by relevance):\n${images.map((u, i) => `${i + 1}. ${u}`).join("\n")}`
    : "";

  const prompt =
    "Analyze this clothing product and return ONLY JSON with fields: " +
    "name, brand, category, subcategory, colors, pattern, material, description, temperatureIndex, coverageLevel, occasionTags. " +
    `Allowed category values: ${CATEGORIES.join(", ")}. ` +
    `Allowed color family values: ${COLOR_FAMILIES.join(", ")}. ` +
    "For colors, identify the visible dominant clothing colors from the product image. " +
    "Use colors[].family for the broad family only, and put shade names such as navy, cream, khaki, ivory, camel, or burgundy in colors[].name. " +
    "Do not default to Black unless the item is visibly black. " +
    `Allowed pattern values: ${PATTERNS.join(", ")}. ` +
    `Allowed occasionTags: ${OCCASION_TAGS.join(", ")}. ` +
    "temperatureIndex is NOT weather suitability. It means warmth/insulation/heaviness: " +
    "0-2 very light hot-weather items such as sandals, tank tops, shorts; " +
    "3-5 medium items such as shirts, light trousers, sneakers; " +
    "6-8 warm items such as sweaters, hoodies, boots, wool; " +
    "9-10 heavy winter outerwear only. " +
    "coverageLevel means body coverage: sandals/shorts low, full trousers/long sleeves medium-high, coats high. " +
    "description should be a concise product description including material composition, fit, and key details (max 300 chars).";

  const content: any[] = [
    { type: "text", text: `${prompt}\nProduct URL: ${sourceUrl}\nTitle: ${meta.title ?? ""}\nBrand: ${meta.brand ?? ""}\nPage description: ${meta.description ?? ""}${imageList}` },
  ];
  // Attach up to 3 images as vision inputs
  for (const imgUrl of images.slice(0, 3)) {
    content.push({ type: "image_url", image_url: { url: imgUrl } });
  }

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
  return parseModelDraft(sourceUrl, meta, images, text);
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
    const uploadedUrl = await uploadImage(url.toString());
    const images = [uploadedUrl];
    const meta: PageMeta = {
      title: "Imported clothing item",
      brand: brandFromUrl(url.toString()),
      images,
    };
    const modelDraft = await callVisionModel(url.toString(), meta, images).catch(() => null);
    return modelDraft ?? heuristicDraft(url.toString(), meta, images);
  }

  const meta = await fetchPage(url.toString());
  console.log(`[ingest] found ${meta.images.length} candidate images for ${url.toString()}`);
  const uploadedImages = await uploadImages(meta.images, 5);
  const images = uploadedImages.length ? uploadedImages : meta.images.slice(0, 5);
  const modelDraft = await callVisionModel(url.toString(), meta, images).catch(() => null);
  return modelDraft ?? heuristicDraft(url.toString(), meta, images);
}
