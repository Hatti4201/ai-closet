import { Router } from "express";
import { Look } from "../models/Look";
import { ClothingItem } from "../models/ClothingItem";
import { saveLook } from "../retrieval";

const router = Router();

// Helper: attach populated items[] to look JSON
async function populate(look: { id: string; itemIds: string[]; [k: string]: any }) {
  const docs = await ClothingItem.find({ _id: { $in: look.itemIds } });
  const map = new Map(docs.map((d) => [d._id.toString(), d.toJSON()]));
  return {
    ...look,
    items: look.itemIds.map((id) => ({
      clothingItemId: id,
      category: (map.get(id) as any)?.category ?? "Top",
      clothingItem: map.get(id) ?? null,
    })),
  };
}

// GET /api/looks?memberId=
router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.memberId ? { memberId: req.query.memberId as string } : {};
    const looks = await Look.find(filter).sort({ createdAt: -1 });
    const populated = await Promise.all(looks.map((l) => populate(l.toJSON())));
    res.json(populated);
  } catch (err) { next(err); }
});

// GET /api/looks/:id
router.get("/:id", async (req, res, next) => {
  try {
    const look = await Look.findById(req.params.id);
    if (!look) return res.status(404).json({ message: "Look not found" });
    res.json(await populate(look.toJSON()));
  } catch (err) { next(err); }
});

// DELETE /api/looks/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await Look.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /api/looks  { memberId, itemIds, prompt, reasoning, title? } -> { id }
router.post("/", async (req, res, next) => {
  try {
    const { memberId, itemIds, prompt, reasoning, title } = req.body ?? {};
    if (
      typeof memberId !== "string" ||
      !Array.isArray(itemIds) ||
      !itemIds.every((x) => typeof x === "string") ||
      typeof prompt !== "string" ||
      typeof reasoning !== "string"
    ) {
      return res.status(400).json({
        message: "looks requires { memberId, itemIds, prompt, reasoning }",
      });
    }
    const result = await saveLook({ memberId, itemIds, prompt, reasoning });
    // patch title if provided (saveLook doesn't persist it, so update directly)
    if (title) await Look.findByIdAndUpdate(result.id, { title });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;
