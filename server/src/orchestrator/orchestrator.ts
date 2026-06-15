import {
  searchWardrobe, getItem, getPreferenceProfile,
  getFamilyMembers, getContext, saveLook,
} from "../retrieval";
import { buildSystemPrompt } from "./prompts";
import { validate, codeFallback, RecommendationResult } from "./validator";

// OpenAI-compatible tool definitions (mirror contracts_v1 §2)
const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_wardrobe",
      description: "Search clothing items by member, category, color, occasion, temperature, etc.",
      parameters: {
        type: "object",
        properties: {
          memberId: { type: "string" },
          category: { type: "string", enum: ["Top","Bottom","Shoes","Outerwear","Dress","Accessory"] },
          colorFamily: { type: "string" },
          pattern: { type: "string" },
          tempMin: { type: "number" },
          tempMax: { type: "number" },
          coverageMin: { type: "number" },
          coverageMax: { type: "number" },
          occasion: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_item",
      description: "Get full details of a single clothing item by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_preference_profile",
      description: "Get style preferences for a member (top colors, brands, styles).",
      parameters: {
        type: "object",
        properties: { memberId: { type: "string" } },
        required: ["memberId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_family_members",
      description: "Get all members of a household for cross-member styling.",
      parameters: {
        type: "object",
        properties: { householdId: { type: "string" } },
        required: ["householdId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_context",
      description: "Get current date, season, and weather context.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string" },
          location: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_look",
      description: "Save an accepted outfit look.",
      parameters: {
        type: "object",
        properties: {
          memberId: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
          prompt: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["memberId", "itemIds", "prompt", "reasoning"],
      },
    },
  },
];

type Message = { role: string; content: string | null; tool_call_id?: string; tool_calls?: any[] };

async function dispatchTool(name: string, args: any, seenItemIds: Set<string>): Promise<string> {
  try {
    switch (name) {
      case "search_wardrobe": {
        const items = await searchWardrobe(args);
        for (const it of items) seenItemIds.add(String(it._id));
        return JSON.stringify(items);
      }
      case "get_item": {
        const item = await getItem(args);
        if (item) seenItemIds.add(String(item._id));
        return JSON.stringify(item);
      }
      case "get_preference_profile":
        return JSON.stringify(await getPreferenceProfile(args));
      case "get_family_members":
        return JSON.stringify(await getFamilyMembers(args));
      case "get_context":
        return JSON.stringify(await getContext(args));
      case "save_look":
        return JSON.stringify(await saveLook(args));
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e: any) {
    return JSON.stringify({ error: e?.message ?? "Tool error" });
  }
}

/** Stub mode: no LLM configured — return a hardcoded result immediately. */
async function stubResult(memberId: string, prompt: string): Promise<RecommendationResult> {
  const context = await getContext({});
  const fallbackLooks = await codeFallback(memberId, new Set());
  return { prompt, context, looks: fallbackLooks };
}

function llmBaseUrl(): string | null {
  return process.env.LLM_BASE_URL ?? null;
}

async function callLLM(messages: Message[]): Promise<any> {
  const base = llmBaseUrl()!;
  const url = base.replace(/\/$/, "") + "/chat/completions";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY ?? ""}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

const MAX_ROUNDS = 6;
const RETRY_MSG =
  "Your last response was invalid JSON or contained unknown itemIds. " +
  "Return ONLY a JSON object matching the schema. Use only itemIds from " +
  "the search results already in this conversation.";

export async function runOrchestrator(
  memberId: string,
  userPrompt: string,
): Promise<RecommendationResult> {
  // Stub mode — no LLM URL configured
  if (!llmBaseUrl()) {
    return stubResult(memberId, userPrompt);
  }

  const context = await getContext({});
  const seenItemIds = new Set<string>();

  const messages: Message[] = [
    { role: "system", content: buildSystemPrompt(memberId) },
    { role: "user", content: userPrompt },
  ];

  let rawText = "";
  let attempts = 0;

  // Main loop
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await callLLM(messages);
    const choice = response.choices?.[0];
    const msg = choice?.message;

    if (!msg) break;

    // Tool calls
    if (msg.tool_calls?.length) {
      messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments ?? "{}");
        const result = await dispatchTool(tc.function.name, args, seenItemIds);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      continue;
    }

    // Text response — try to parse
    rawText = msg.content ?? "";
    const rawStr = rawText;

    // Try to extract JSON if the model wrapped it in markdown
    const jsonMatch = rawStr.match(/```(?:json)?\s*([\s\S]*?)```/) ??
                      rawStr.match(/(\{[\s\S]*\})/);
    const candidate = jsonMatch ? jsonMatch[1] : rawStr;

    try {
      const looks = validate(candidate, seenItemIds);
      return { prompt: userPrompt, context, looks };
    } catch {
      attempts++;
      if (attempts >= 2) break; // fall through to code fallback
      messages.push({ role: "assistant", content: rawStr });
      messages.push({ role: "user", content: RETRY_MSG });
    }
  }

  // Code-driven fallback — never surfaces an error to the caller
  const looks = await codeFallback(memberId, seenItemIds);
  return { prompt: userPrompt, context, looks };
}
