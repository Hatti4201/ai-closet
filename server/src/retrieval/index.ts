// Shared retrieval service — the ONLY place with wardrobe query logic.
// Reused by BOTH the HTTP API (src/routes) and the MCP server (src/mcp).
// Never duplicate these queries elsewhere.

import { Member, ClothingItem, Look } from "../models";
import { ColorFamily } from "../models/enums";
import {
  SearchWardrobeParams, PreferenceProfile, ContextInfo, Season, SaveLookParams,
} from "./types";

export * from "./types";

const DEFAULT_LIMIT = 50;
const DEFAULT_MEMBER_ID = "member_self";

export async function ensureDefaultMember() {
  const existing = await Member.findOne({});
  if (existing) return existing.toJSON();

  const created = await Member.create({
    _id: DEFAULT_MEMBER_ID,
    householdId: "hh_001",
    displayName: "Me",
    role: "self",
  });
  return created.toJSON();
}

/** search_wardrobe — main candidate filter. All params optional; pre-filters in DB. */
export async function searchWardrobe(params: SearchWardrobeParams = {}) {
  const filter: Record<string, any> = {};
  if (params.memberId) filter.memberId = params.memberId;
  if (params.category) filter.category = params.category;
  if (params.colorFamily) filter["colors.family"] = params.colorFamily;
  if (params.pattern) filter.pattern = params.pattern;
  if (params.occasion) filter.occasionTags = params.occasion;

  const temp: Record<string, number> = {};
  if (params.tempMin != null) temp.$gte = params.tempMin;
  if (params.tempMax != null) temp.$lte = params.tempMax;
  if (Object.keys(temp).length) filter.temperatureIndex = temp;

  const cov: Record<string, number> = {};
  if (params.coverageMin != null) cov.$gte = params.coverageMin;
  if (params.coverageMax != null) cov.$lte = params.coverageMax;
  if (Object.keys(cov).length) filter.coverageLevel = cov;

  if (params.q && params.q.trim()) {
    const re = new RegExp(params.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { name: re },
      { brand: re },
      { category: re },
      { subcategory: re },
      { material: re },
      { pattern: re },
      { "colors.family": re },
      { "colors.name": re },
      { occasionTags: re },
    ];
  }

  const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_LIMIT;
  const docs = await ClothingItem.find(filter).limit(limit);
  return docs.map((d) => d.toJSON());
}

/** get_item — single item detail. Returns null if not found. */
export async function getItem(params: { id: string }) {
  const doc = await ClothingItem.findById(params.id);
  return doc ? doc.toJSON() : null;
}

/** get_family_members — members of a household (cross-member styling). */
export async function getFamilyMembers(params: { householdId: string }) {
  const docs = await Member.find({ householdId: params.householdId });
  return docs.map((d) => d.toJSON());
}

/** Helper for GET /api/members (no param in the HTTP contract): list all / by household. */
export async function listMembers(householdId?: string) {
  const docs = await Member.find(householdId ? { householdId } : {});
  if (docs.length > 0) return docs.map((d) => d.toJSON());
  const member = await ensureDefaultMember();
  return householdId && member.householdId !== householdId ? [] : [member];
}

/** get_preference_profile — MVP: derive from the member's own item history. */
export async function getPreferenceProfile(params: { memberId: string }): Promise<PreferenceProfile> {
  const items = await ClothingItem.find({ memberId: params.memberId });

  const colorCount = new Map<ColorFamily, number>();
  const brandCount = new Map<string, number>();
  const occCount = new Map<string, number>();
  for (const it of items) {
    for (const c of it.colors) colorCount.set(c.family, (colorCount.get(c.family) ?? 0) + 1);
    if (it.brand) brandCount.set(it.brand, (brandCount.get(it.brand) ?? 0) + 1);
    for (const o of it.occasionTags) occCount.set(o, (occCount.get(o) ?? 0) + 1);
  }
  const topN = <K>(m: Map<K, number>, n: number): K[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map((e) => e[0]);

  return {
    memberId: params.memberId,
    topColors: topN(colorCount, 3),
    preferredStyles: topN(occCount, 3) as string[], // occasion tags as a style proxy (MVP)
    preferredBrands: topN(brandCount, 3),
  };
}

/** get_context — real weather via Open-Meteo when location="lat,lon" is provided; season mock otherwise. */
export async function getContext(params: { date?: string; location?: string } = {}): Promise<ContextInfo> {
  const d = params.date ? new Date(params.date) : new Date();
  const season = seasonForMonth(d.getUTCMonth());
  const weather = params.location
    ? await fetchWeather(params.location).catch(() => mockWeather(season))
    : mockWeather(season);
  return { date: d.toISOString().slice(0, 10), season, weather };
}

async function fetchWeather(location: string): Promise<{ tempC: number; condition: string }> {
  const [lat, lon] = location.split(",").map(Number);
  if (isNaN(lat) || isNaN(lon)) throw new Error("bad coords");
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&temperature_unit=celsius`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const data: any = await res.json();
  return {
    tempC: Math.round(data.current.temperature_2m),
    condition: wmoCondition(data.current.weather_code),
  };
}

function wmoCondition(code: number): string {
  if (code === 0) return "sunny";
  if (code <= 2) return "partly cloudy";
  if (code <= 3) return "cloudy";
  if (code <= 48) return "foggy";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain showers";
  return "stormy";
}

/** save_look — persist an accepted outfit. Returns the new look id. */
export async function saveLook(params: SaveLookParams): Promise<{ id: string }> {
  const id = `look_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  await Look.create({ _id: id, ...params });
  return { id };
}

// --- helpers ---
function seasonForMonth(month: number): Season {
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "fall";
}

function mockWeather(season: Season): { tempC: number; condition: string } {
  switch (season) {
    case "winter": return { tempC: 3, condition: "cloudy" };
    case "spring": return { tempC: 16, condition: "sunny" };
    case "summer": return { tempC: 28, condition: "sunny" };
    case "fall":   return { tempC: 14, condition: "windy" };
  }
}
