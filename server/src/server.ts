import "dotenv/config";
import { connectDB } from "./db/connection";
import { createApp } from "./app";

async function main(): Promise<void> {
  const { inMemory } = await connectDB();

  // Dev only: the in-memory DB starts empty and is private to this process,
  // so auto-seed it on boot to make the read endpoints immediately testable.
  // With a real MONGO_URI (shared DB) we never auto-seed — that data is real.
  if (inMemory) {
    const { seedDatabase } = await import("../seed/load");
    const { members, items } = await seedDatabase();
    console.log(`[server] in-memory DB auto-seeded: ${members} members, ${items} items`);
  }

  // One-time migration: fix items that were saved with memberId "undefined" (string)
  // due to a toJSON bug where _id was read from an exposeStringId-transformed document.
  if (!inMemory) {
    const { Member, ClothingItem } = await import("./models");
    const firstMember = await Member.findOne({});
    if (firstMember) {
      const result = await ClothingItem.updateMany(
        { memberId: "undefined" },
        { $set: { memberId: firstMember._id } },
      );
      if (result.modifiedCount > 0) {
        console.log(`[server] migrated ${result.modifiedCount} items from memberId "undefined" → "${firstMember._id}"`);
      }
    }
  }

  const app = createApp();
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
    console.log(`[server] health check: http://localhost:${port}/health`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
