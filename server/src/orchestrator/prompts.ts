import { ContextInfo } from "../retrieval/types";

export function buildSystemPrompt(memberId: string, context: ContextInfo): string {
  const { date, season, weather } = context;
  const weatherLine = `Today is ${date} (${season}), ${weather.tempC}°C and ${weather.condition}.`;

  return `You are an AI wardrobe stylist for an AI Closet app.

${weatherLine}

Your job: use the provided tools to explore the wardrobe, then return EXACTLY a JSON object
with 1–3 outfit looks. Return only JSON — no prose, no markdown fences.

Required output shape:
{
  "looks": [
    {
      "title": "<short outfit name>",
      "itemIds": ["<id>", ...],
      "reasoning": "<why this combination works>"
    }
  ]
}

Rules:
- Every itemId MUST come from search_wardrobe or get_item results in this session.
- itemIds must cover at least a Top and a Bottom, or include a Dress; Shoes are a bonus.
- 1–3 looks only (fewer is fine for small wardrobes; never force 3 if items don't support it).
- No hallucinated ids — only ids you actually received from tool calls.
- Factor the weather into your picks: temperature and condition should guide warmth and coverage.

Start by calling get_preference_profile for memberId="${memberId}",
then search_wardrobe to find candidate items suited to the weather and occasion, then assemble looks.`;
}
