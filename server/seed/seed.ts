import "dotenv/config";
import { connectDB, disconnectDB } from "../src/db/connection";
import { Member, ClothingItem } from "../src/models";
import { members, items, HOUSEHOLD_ID } from "./items";

// Map the seed's contract-style `id` onto mongoose's `_id`.
const toDoc = <T extends { id: string }>({ id, ...rest }: T) => ({ _id: id, ...rest });

// Guard: seeding wipes (deleteMany) then reinserts. Harmless on the throwaway
// in-memory dev DB, but against a real shared MONGO_URI it would erase the whole
// team's data — so refuse unless `--force` is passed (`npm run seed -- --force`).
const FORCE = process.argv.includes("--force");

async function run(): Promise<void> {
  const { inMemory } = await connectDB();

  if (!inMemory && !FORCE) {
    console.error("\n⚠️  Refusing to seed a NON in-memory database.");
    console.error("   This runs deleteMany() and would WIPE all Members + ClothingItems");
    console.error("   for the whole team on the shared DB.");
    console.error("   If you really mean it:  npm run seed -- --force\n");
    await disconnectDB();
    process.exit(1);
  }

  // Fresh start each run.
  await Promise.all([Member.deleteMany({}), ClothingItem.deleteMany({})]);

  // .create() runs validation + the timestamp pre-save hooks.
  await Member.create(members.map(toDoc));
  await ClothingItem.create(items.map(toDoc));

  console.log(`\n✓ Seeded ${members.length} members and ${items.length} clothing items.\n`);

  await showSampleQueries();

  await disconnectDB();
  console.log("\n✓ Done.\n");
  process.exit(0);
}

async function showSampleQueries(): Promise<void> {
  const line = "─".repeat(64);

  // 1) Family members in the household (-> get_family_members)
  console.log(line);
  console.log(`1) Members in household ${HOUSEHOLD_ID}`);
  const fam = await Member.find({ householdId: HOUSEHOLD_ID });
  fam.forEach((m) => console.log(`   ${m.id}  ${m.displayName}  (${m.role})`));

  // 2) mem_001's Tops, light (temperatureIndex <= 4), for casual occasion
  console.log(line);
  console.log("2) search_wardrobe { memberId: mem_001, category: Top, tempMax: 4, occasion: casual }");
  const tops = await ClothingItem.find({
    memberId: "mem_001",
    category: "Top",
    temperatureIndex: { $lte: 4 },
    occasionTags: "casual",
  });
  tops.forEach((i) => console.log(`   ${i.id}  ${i.name}  (temp ${i.temperatureIndex})`));

  // 3) All Blue items across the household (colors.family index)
  console.log(line);
  console.log("3) search_wardrobe { colorFamily: Blue }");
  const blue = await ClothingItem.find({ "colors.family": "Blue" });
  blue.forEach((i) => console.log(`   ${i.id}  ${i.name}  [${i.memberId}]`));

  // 4) Work-appropriate items (occasionTags index)
  console.log(line);
  console.log("4) search_wardrobe { occasion: work }");
  const work = await ClothingItem.find({ occasionTags: "work" });
  work.forEach((i) => console.log(`   ${i.id}  ${i.name}  (${i.category})`));

  // 5) Count by category (proves the data spread)
  console.log(line);
  console.log("5) Item count by category");
  const byCat = await ClothingItem.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$category", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  byCat.forEach((c) => console.log(`   ${c._id.padEnd(10)} ${c.n}`));

  // 6) One full item in the exact contract §1 JSON shape (id, not _id)
  console.log(line);
  console.log("6) Full ClothingItem JSON shape (item_002)");
  const one = await ClothingItem.findById("item_002");
  console.log(JSON.stringify(one?.toJSON(), null, 2));
  console.log(line);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
