import mongoose from "mongoose";

// In-memory server handle (dev only). Kept module-level so we can stop it.
let memoryServer: { stop: () => Promise<boolean | void> } | null = null;

/**
 * Connect to MongoDB.
 * - If MONGO_URI is set, connect to it (the team's shared DB later).
 * - If empty, spin up an ephemeral in-memory MongoDB for local dev — no install,
 *   no daemon. Swapping to the shared DB is a one-line .env change, no code change.
 */
export async function connectDB(): Promise<{ uri: string; inMemory: boolean }> {
  let uri = process.env.MONGO_URI?.trim();
  let inMemory = false;

  if (!uri) {
    // Lazy import so production (with a real MONGO_URI) doesn't need the dev dep.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create();
    memoryServer = mem;
    uri = mem.getUri();
    inMemory = true;
    console.log("[db] MONGO_URI empty — started an in-memory MongoDB");
  }

  await mongoose.connect(uri, { dbName: "aicloset" });
  console.log(`[db] connected (${inMemory ? "in-memory" : "external"})`);
  return { uri, inMemory };
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
