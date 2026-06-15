import { Router } from "express";
import { saveLook } from "../retrieval";

// POST /api/looks   { memberId, itemIds, prompt, reasoning } -> { id }
const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { memberId, itemIds, prompt, reasoning } = req.body ?? {};
    if (
      typeof memberId !== "string" ||
      !Array.isArray(itemIds) ||
      !itemIds.every((x) => typeof x === "string") ||
      typeof prompt !== "string" ||
      typeof reasoning !== "string"
    ) {
      return res.status(400).json({
        message: "looks requires { memberId: string, itemIds: string[], prompt: string, reasoning: string }",
      });
    }
    res.status(201).json(await saveLook({ memberId, itemIds, prompt, reasoning }));
  } catch (err) {
    next(err);
  }
});

export default router;
