import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import membersRouter from "./routes/members";
import wardrobeRouter from "./routes/wardrobe";
import looksRouter from "./routes/looks";
import ingestRouter from "./routes/ingest";
import recommendRouter from "./routes/recommend";
import contextRouter from "./routes/context";
import compatRouter from "./routes/compat";

/**
 * Express assembly point — the ONE file Backend A and B both touch.
 * Convention: each route lives in its own file under src/routes/; here we only
 * `import` it and `app.use()` it. Keep middleware order + the error handler fixed.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "ai-closet backend" });
  });

  // --- routes mount here ---
  app.use("/api/members", membersRouter); // A-P2 — read: GET /api/members
  app.use("/api/wardrobe", wardrobeRouter); // A-P2 — read: GET /api/wardrobe[/:id]
  app.use("/api/looks", looksRouter); // A-P4 — write: POST /api/looks
  app.use("/api/ingest", ingestRouter); // A-P4 — write (dev): POST /api/ingest
  app.use("/api", recommendRouter);              // C — POST /api/recommend
  app.use("/api/context", contextRouter);        // C — GET /api/context?lat=&lon=
  app.use("/api", compatRouter);                 // legacy MVP routes: /auth, /clothing

  // 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found" });
  });

  // Error handler — uniform error shape: { message }
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err?.status === "number" ? err.status : 500;
    res.status(status).json({ message: err?.message ?? "Internal error" });
  });

  return app;
}
