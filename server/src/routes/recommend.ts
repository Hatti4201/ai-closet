import { Router, Request, Response } from "express";
import { runOrchestrator } from "../orchestrator/orchestrator";
import { Member } from "../models";

const router = Router();

router.post("/recommend", async (req: Request, res: Response) => {
  try {
    const { memberId, prompt } = req.body ?? {};

    if (!memberId || typeof memberId !== "string") {
      return res.status(400).json({ message: "memberId is required" });
    }
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "prompt is required" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: `Member "${memberId}" not found` });
    }

    const result = await runOrchestrator(memberId, prompt);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Internal error" });
  }
});

export default router;
