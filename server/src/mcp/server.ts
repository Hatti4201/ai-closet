// AI Closet — MCP server (Backend A headline deliverable).
// Wraps the shared retrieval service (src/retrieval) as MCP tools whose names,
// params, and returns match contracts_v1.md §2 EXACTLY. This is what Backend B's
// LLM loop connects to (replacing their fake MCP server).
//
// Transport: stdio. stdout is the JSON-RPC channel, so NOTHING may print there —
// all incidental logging is routed to stderr below before anything runs.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { connectDB } from "../db/connection";
import {
  CATEGORIES, COLOR_FAMILIES, PATTERNS, OCCASION_TAGS,
} from "../models/enums";
import {
  searchWardrobe, getItem, getPreferenceProfile, getFamilyMembers, getContext, saveLook,
  SearchWardrobeParams, SaveLookParams,
} from "../retrieval";

// stdout belongs to the protocol — send all logs to stderr instead.
console.log = (...args: unknown[]) => console.error(...args);

// z.enum needs a non-empty tuple; our enums are readonly const arrays.
const enumOf = <T extends string>(vals: readonly T[]) =>
  z.enum(vals as unknown as [T, ...T[]]);

const idx = () => z.number().min(0).max(10); // 0-10 scale (temp / coverage)

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

// Every tool returns its contract payload as JSON text (what the LLM consumes).
const json = (payload: unknown): ToolResult => ({
  content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
});

async function main(): Promise<void> {
  const { inMemory } = await connectDB();

  // Dev (in-memory DB is empty + process-private): seed so tools return data.
  // With a real shared MONGO_URI we never seed — that data is real.
  if (inMemory) {
    const { seedDatabase } = await import("../../seed/load");
    const { members, items } = await seedDatabase();
    console.error(`[mcp] in-memory DB auto-seeded: ${members} members, ${items} items`);
  }

  const server = new McpServer({ name: "ai-closet", version: "1.0.0" });

  // Thin wrapper around registerTool. The `as any` casts sidestep the SDK's deep
  // generic inference over zod raw shapes (zod 3.25 → TS2589 "excessively deep");
  // the SDK still validates args at runtime from `inputSchema`. Each handler
  // annotates its own args, so we keep type-safety where it matters.
  type RawShape = Record<string, z.ZodTypeAny>;
  const tool = (
    name: string,
    description: string,
    inputSchema: RawShape,
    cb: (args: any) => Promise<ToolResult>
  ) => server.registerTool(name, { description, inputSchema } as any, cb as any);

  // --- contracts §2.2 tools ---

  // search_wardrobe — main candidate filter. All params optional.
  tool(
    "search_wardrobe",
    "Filter wardrobe items by member/category/color/pattern/temperature/coverage/occasion. All params optional; returns ClothingItem[] (limit default 50).",
    {
      memberId: z.string().optional(),
      category: enumOf(CATEGORIES).optional(),
      colorFamily: enumOf(COLOR_FAMILIES).optional(),
      pattern: enumOf(PATTERNS).optional(),
      tempMin: idx().optional(),
      tempMax: idx().optional(),
      coverageMin: idx().optional(),
      coverageMax: idx().optional(),
      occasion: enumOf(OCCASION_TAGS).optional(),
      limit: z.number().int().positive().optional(),
    },
    async (args: SearchWardrobeParams) => json(await searchWardrobe(args))
  );

  // get_item — single item detail.
  tool(
    "get_item",
    "Get one ClothingItem by id.",
    { id: z.string() },
    async ({ id }: { id: string }) => {
      const item = await getItem({ id });
      if (!item) {
        return {
          content: [{ type: "text", text: JSON.stringify({ message: "Item not found" }) }],
          isError: true,
        };
      }
      return json(item);
    }
  );

  // get_preference_profile — derived from the member's item history (MVP).
  tool(
    "get_preference_profile",
    "Get a member's PreferenceProfile (top colors / styles / brands), derived from their wardrobe.",
    { memberId: z.string() },
    async ({ memberId }: { memberId: string }) => json(await getPreferenceProfile({ memberId }))
  );

  // get_family_members — household members (supports cross-member styling).
  tool(
    "get_family_members",
    "List the Member[] in a household (for cross-member outfit styling).",
    { householdId: z.string() },
    async ({ householdId }: { householdId: string }) => json(await getFamilyMembers({ householdId }))
  );

  // get_context — date / season / mock weather.
  tool(
    "get_context",
    "Get ContextInfo (date, season, mock weather) for an optional date/location.",
    { date: z.string().optional(), location: z.string().optional() },
    async (args: { date?: string; location?: string }) => json(await getContext(args))
  );

  // save_look — persist an accepted outfit; returns its new id.
  tool(
    "save_look",
    "Save an accepted outfit (Look). Returns { id }.",
    {
      memberId: z.string(),
      itemIds: z.array(z.string()),
      prompt: z.string(),
      reasoning: z.string(),
    },
    async (args: SaveLookParams) => json(await saveLook(args))
  );

  await server.connect(new StdioServerTransport());
  console.error("[mcp] ai-closet MCP server ready (stdio) — 6 tools registered");
}

main().catch((err) => {
  console.error("[mcp] fatal:", err);
  process.exit(1);
});
