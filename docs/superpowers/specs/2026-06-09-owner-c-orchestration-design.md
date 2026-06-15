# Owner C — LLM ↔ MCP Orchestration Design
_AI Closet Stylist · v1 · updated 2026-06-14_

## Scope

Owner C builds the recommendation brain: the LLM ↔ retrieval orchestration
loop, validation + fallback, and the `POST /api/recommend` HTTP endpoint.

**Branch base:** `origin/backend-a` — teammate already delivered all models,
the shared retrieval service, the MCP stdio server, and all other HTTP
endpoints. We add only the orchestrator and mount the recommend route.

---

## 1. Architecture

```
POST /api/recommend
  { memberId, prompt }
        │
        ▼
RecommendationOrchestrator
  ├── builds system prompt
  ├── calls LLM (OpenAI-compatible, env-swappable) with tool definitions
  │     LLM decides which tools to call in-process:
  │       get_context()            → ContextInfo
  │       get_preference_profile() → PreferenceProfile
  │       search_wardrobe()        → ClothingItem[]
  │       get_item()               → ClothingItem
  │       get_family_members()     → Member[]
  ├── feeds tool results back into context
  └── loops until LLM returns JSON with 1–3 looks
        │
        ▼
  Validator
  ├── parse JSON
  ├── confirm every itemId came from tool results (no hallucination)
  ├── on failure → retry once with stricter prompt
  └── on second failure → code-driven fallback (Top + Bottom + Shoes)
        │
        ▼
  RecommendationResult  (contracts_v1 §3)
```

**In-process dispatch:** tool calls from the LLM are dispatched directly to
the retrieval functions from `src/retrieval/index.ts` — no subprocess, no
stdio. The MCP stdio server (teammate's `src/mcp/server.ts`) is a separate
process for external clients (Claude Desktop, etc.) and is not used here.

---

## 2. Tool Dispatch

All 6 retrieval functions are already implemented by the teammate and imported
from `src/retrieval/index.ts`. We expose them to the LLM as OpenAI-compatible
tool definitions (JSON schema), then dispatch by name in a `switch`:

| Tool name | Retrieval fn | Notes |
|---|---|---|
| `search_wardrobe` | `searchWardrobe()` | accumulate returned ids into `seenItemIds` |
| `get_item` | `getItem()` | accumulate id into `seenItemIds` |
| `get_preference_profile` | `getPreferenceProfile()` | — |
| `get_family_members` | `getFamilyMembers()` | — |
| `get_context` | `getContext()` | returns mock weather (MVP) |
| `save_look` | `saveLook()` | optional; LLM may or may not call it |

Tool parameter schemas mirror `contracts_v1.md §2` exactly.

---

## 3. Orchestration Loop

```
systemPrompt = buildSystemPrompt(memberId)
messages = [{ role: "user", content: prompt }]

loop (max 6 tool-call rounds):
  response = llm({ messages, tools, tool_choice: "auto" })

  if response has tool_calls:
    for each tool_call:
      result = dispatchTool(tool_call.name, tool_call.arguments)
      accumulate ids into seenItemIds if tool is search_wardrobe / get_item
      append assistant tool_call message + tool result message
    continue loop

  if text response:
    parsed = JSON.parse(response.content)
    break

validate(parsed, seenItemIds)
```

`seenItemIds` is a `Set<string>` accumulated across all tool rounds.

---

## 4. Validation & Fallback

**Validate:**
- 1–3 looks (fewer OK for small wardrobes)
- Every `itemId` in `seenItemIds`
- Each look has `title`, `itemIds` (≥1), `reasoning`

**On failure → retry once:**
```
messages.push({ role: "user", content:
  "Your last response was invalid JSON or contained unknown itemIds.
   Return ONLY a JSON object matching the schema. Use only itemIds from
   the search results already in this conversation." })
```

**On second failure → code fallback:**
```ts
// Pick one Top, one Bottom, one Shoes from seenItemIds.
// If seenItemIds is empty, query DB directly for memberId.
// Return as single look: title "Today's Pick", reasoning "Assembled from your wardrobe."
```

Never throws to the caller. The fallback always returns a valid `RecommendationResult`.

---

## 5. LLM Client

- `fetch` against the OpenAI-compatible `/chat/completions` endpoint
- Reads `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` from env
- No SDK — keeps dependencies minimal
- **Stub mode:** if `LLM_BASE_URL` is unset, return a hardcoded valid
  `RecommendationResult` immediately (makes fallback path testable without
  a real API key)

---

## 6. Files Added

```
server/src/
  orchestrator/
    prompts.ts       — system prompt builder
    orchestrator.ts  — LLM loop + tool dispatch
    validator.ts     — validation, retry, code-driven fallback
  routes/
    recommend.ts     — POST /api/recommend
```

One line uncommented in `app.ts`:
```ts
app.use("/api", recommendRouter);  // POST /api/recommend
```

Everything else (`models/`, `retrieval/`, `mcp/`, other routes, seed) is
already done by the teammate's `backend-a` branch — we do not modify those.

---

## 7. Definition of Done

1. `POST /api/recommend` with a real `memberId` + prompt returns a valid
   `RecommendationResult` (all `itemIds` exist in the DB)
2. `context` field is populated (date, season, mock weather)
3. Fallback fires and returns a usable result when LLM is stubbed or fails
4. Stub mode works with no API key set
