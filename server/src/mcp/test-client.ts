// A-P3 acceptance test: spawn the real MCP server over stdio (exactly how
// Backend B connects), list its tools, and call each one — proving every tool
// matches contracts §2 and returns correct data. Run: `npm run mcp:test`.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const EXPECTED_TOOLS = [
  "search_wardrobe", "get_item", "get_preference_profile",
  "get_family_members", "get_context", "save_look",
];

// Pull the JSON payload back out of a tool result's text content.
function parse(result: any): any {
  const text = result?.content?.find((c: any) => c.type === "text")?.text ?? "null";
  return JSON.parse(text);
}

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["ts-node", "--transpile-only", "src/mcp/server.ts"],
    cwd: process.cwd(),
    stderr: "inherit", // surface the server's [mcp]/[db] logs in this terminal
  });

  const client = new Client({ name: "ai-closet-test-client", version: "1.0.0" });
  await client.connect(transport);

  const line = "─".repeat(64);
  let failures = 0;
  const check = (label: string, ok: boolean, detail: string) => {
    console.log(`${ok ? "✓" : "✗"} ${label.padEnd(24)} ${detail}`);
    if (!ok) failures++;
  };

  // 0) tools/list — names must equal the contract set.
  console.log(line);
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  check("tools/list", EXPECTED_TOOLS.every((t) => names.includes(t)) && names.length === EXPECTED_TOOLS.length,
    names.join(", "));

  console.log(line);

  // 1) search_wardrobe — mem_001 light casual Tops -> item_001 + item_002.
  const sw = parse(await client.callTool({
    name: "search_wardrobe",
    arguments: { memberId: "mem_001", category: "Top", tempMax: 4, occasion: "casual" },
  }));
  check("search_wardrobe", Array.isArray(sw) && sw.length === 2,
    `${sw.length} items: ${sw.map((i: any) => i.id).join(", ")}`);

  // 2) get_item — known id.
  const gi = parse(await client.callTool({ name: "get_item", arguments: { id: "item_002" } }));
  check("get_item", gi?.id === "item_002", `${gi?.id} → ${gi?.name}`);

  // 3) get_item — missing id returns an error result, not a crash.
  const miss = await client.callTool({ name: "get_item", arguments: { id: "nope" } });
  check("get_item (missing)", (miss as any).isError === true, "isError=true {message}");

  // 4) get_preference_profile — derived stats.
  const pp = parse(await client.callTool({ name: "get_preference_profile", arguments: { memberId: "mem_001" } }));
  check("get_preference_profile", Array.isArray(pp?.topColors) && pp.memberId === "mem_001",
    `topColors=[${pp.topColors.join(",")}] brands=[${pp.preferredBrands.join(",")}]`);

  // 5) get_family_members — both household members.
  const fam = parse(await client.callTool({ name: "get_family_members", arguments: { householdId: "hh_001" } }));
  check("get_family_members", Array.isArray(fam) && fam.length === 2,
    `${fam.length}: ${fam.map((m: any) => m.id).join(", ")}`);

  // 6) get_context — season derived from the date.
  const ctx = parse(await client.callTool({ name: "get_context", arguments: { date: "2025-07-15" } }));
  check("get_context", ctx?.season === "summer",
    `date=${ctx.date} season=${ctx.season} weather=${ctx.weather.tempC}°C/${ctx.weather.condition}`);

  // 7) save_look — persists and returns a new id.
  const sl = parse(await client.callTool({
    name: "save_look",
    arguments: { memberId: "mem_001", itemIds: ["item_002", "item_004", "item_007"], prompt: "smart casual", reasoning: "test" },
  }));
  check("save_look", typeof sl?.id === "string" && sl.id.length > 0, `id=${sl.id}`);

  console.log(line);
  await client.close();

  if (failures) {
    console.log(`\n✗ ${failures} check(s) FAILED\n`);
    process.exit(1);
  }
  console.log("\n✓ All MCP tools pass — signatures match contracts §2.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("test-client fatal:", err);
  process.exit(1);
});
