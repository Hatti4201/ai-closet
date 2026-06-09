# Owner C — LLM ↔ MCP Orchestration Design
_AI Closet Stylist · v1 · 2026-06-09_

## Scope

Owner C builds the recommendation brain: a mock MCP server (in-process),
the LLM ↔ MCP orchestration loop, validation + fallback, and the HTTP
endpoint the frontend calls. Voice input is optional/mock for demo.

This spec covers `server/` only. Frontend (`client/`) is touched only for
the voice input wire-up if time allows.

---

## 1. Architecture

```
POST /api/recommend
  { memberId, prompt }
        │
        ▼
RecommendationOrchestrator
  ├── builds system prompt + registers MCP tools
  ├── calls LLM (OpenAI-compatible, env-swappable)
  │     LLM decides which tools to call:
  │       get_context()            → ContextInfo (mock: date/season/weather)
  │       get_preference_profile() → PreferenceProfile (mock: derived from wardrobe stats)
  │       search_wardrobe()        → ClothingItem[] (real DB query)
  │       get_item()               → ClothingItem   (real DB query)
  │       get_family_members()     → Member[]        (real DB query)
  ├── feeds tool results back into context
  └── loops until LLM returns 3 looks in JSON
        │
        ▼
  Validator
  ├── parse JSON (structured output / JSON mode)
  ├── confirm every itemId came from tool results (no hallucination)
  ├── on failure → retry once with stricter prompt
  └── on second failure → code-driven fallback (pick Top + Bottom + Shoes)
        │
        ▼
  RecommendationResult  (contracts_v1 §3)
```

All MCP tools are **in-process functions** — no separate server process.
Tool signatures match `contracts_v1.md §2` exactly so Owner B can swap in
the real implementation without touching orchestration code.

---

## 2. MCP Tools (mock implementations for Phase 1)

| Tool | Mock behaviour | Real (B's job) |
|---|---|---|
| `get_context` | Returns hardcoded date + season + `{ tempC: 22, condition: "sunny" }` | Calls weather API |
| `get_preference_profile` | Derives top colors + occasion tags by counting memberId's wardrobe | Full preference learning |
| `search_wardrobe` | Real DB query via `ClothingItem.find()` with all filter params | Same, with better indexes |
| `get_item` | Real DB query `ClothingItem.findById()` | Same |
| `get_family_members` | Real DB query `Member.find({ householdId })` | Same |
| `save_look` | Not implemented in MVP | Saves accepted look |

`get_context` and `get_preference_profile` are the only mocks.
`search_wardrobe` and `get_item` hit the real DB from day one.

---

## 3. Orchestration Loop

```
systemPrompt = buildSystemPrompt(memberId, tools)
messages = [{ role: "user", content: prompt }]

loop (max 6 tool-call rounds):
  response = llm.chat({ messages, tools, tool_choice: "auto" })

  if response has tool_calls:
    for each tool_call:
      result = dispatchTool(tool_call.name, tool_call.arguments)
      messages.push(assistant tool_call message)
      messages.push(tool result message)
    continue loop

  if response is text content:
    parsed = JSON.parse(response.content)
    break

validate(parsed, seenItemIds)   // seenItemIds = all ids returned by search_wardrobe/get_item
```

`seenItemIds` is accumulated as tools return results — only items the LLM
actually retrieved can appear in the final looks.

---

## 4. Validation & Fallback

**Validate:**
- Exactly 1–3 looks (fewer allowed for small wardrobes, never more than 3)
- Every `itemId` in `seenItemIds`
- Each look has at least one item

**On failure → retry once:**
```
messages.push({ role: "user", content:
  "Your last response was invalid. Return only valid JSON matching the schema.
   Use only itemIds from the search results already in this conversation." })
```

**On second failure → code fallback:**
```ts
// seenItemIds may be empty if LLM never called search tools
// in that case: query DB directly for memberId's Top + Bottom + Shoes
pick one Top, one Bottom, one Shoes from seenItemIds (or DB if empty)
return as single look titled "Today's Pick"
reasoning = "Assembled from your wardrobe."
```

Never throw to the user. The fallback always produces a usable result.

---

## 5. Data Model Changes (server-side refactor)

The existing `server/` uses `User` + `userId`. Contracts use `Member` + `householdId`.

**New models needed:**
```ts
Member { id, householdId, displayName, role? }
```

**ClothingItem additions:**
```ts
memberId: string          // replaces userId
occasionTags: OccasionTag[]
brand?: string
source: ItemSource
```

**Look additions:**
```ts
context: ContextInfo      // snapshot of date/weather at generation time
```

Auth (JWT + User model) is removed per CLAUDE.md ("NO authentication").

---

## 6. HTTP API (Owner C's endpoint)

```
POST /api/recommend   { memberId, prompt }  →  RecommendationResult
GET  /api/members                           →  Member[]           (thin wrapper over DB)
GET  /api/wardrobe?memberId=&...            →  ClothingItem[]     (thin wrapper over search_wardrobe)
POST /api/looks       { memberId, itemIds, prompt, reasoning }  →  { id }
POST /api/ingest      (dev only)            →  { inserted }       (seed script)
```

Error shape everywhere: `{ "message": "..." }`

---

## 7. Folder Structure (server/src additions)

```
server/src/
  mcp/
    tools.ts          ← tool implementations (in-process functions)
    types.ts          ← MCP tool param/return types (mirrors contracts §2)
  orchestration/
    orchestrator.ts   ← main LLM ↔ MCP loop
    validator.ts      ← itemId validation + fallback assembly
    prompts.ts        ← system prompt builder (replaces utils/prompts.ts)
  models/
    Member.ts         ← new
    ClothingItem.ts   ← updated (occasionTags, brand, source, memberId)
    Look.ts           ← updated (context field)
  seed/
    seed.ts           ← 20 sample items across 2 family members
```

Existing `services/recommendationService.ts` and `services/aiService.ts`
are replaced by `orchestration/`. `services/imageService.ts` and
`controllers/clothingController.ts` are kept (image upload unchanged).

---

## 8. Voice Input (optional / Phase 5)

Web Speech API on the frontend (`VoicePromptInput.tsx` already exists).
Three phases already stubbed in the component: idle → listening → done.
Only change needed: wire the speech transcript into the existing
`customPrompt` state in `HomeAIControlPanel.tsx`. No backend changes.
Mark as "demo assumption" in the presentation.

---

## 9. LLM Client Config

```env
PORT=5000
MONGO_URI=...
LLM_BASE_URL=https://api.openai.com/v1   # swap for teacher's endpoint
LLM_API_KEY=...
LLM_MODEL=gpt-4o-mini
```

`aiService.ts` already reads these. Rename env vars to match CLAUDE.md
(`LLM_*` not `AI_*`).

---

## 10. Definition of Done (Owner C)

1. Seed populates a 2-member household wardrobe (20 items)
2. `GET /api/members` and `GET /api/wardrobe` return correct data
3. MCP tools callable in-process; `search_wardrobe` filters correctly
4. `POST /api/recommend` runs the loop and returns valid `RecommendationResult`
   (all itemIds real, context populated)
5. Fallback fires correctly when LLM is stubbed/fails
6. `POST /api/looks` saves an accepted look
7. Voice: transcript wires into prompt (best-effort)
