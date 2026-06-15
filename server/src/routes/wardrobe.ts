import { Router } from "express";
import { searchWardrobe, getItem } from "../retrieval";
import { SearchWardrobeParams } from "../retrieval/types";

// GET /api/wardrobe?memberId=&category=&colorFamily=&pattern=&occasion=
//                  &tempMin=&tempMax=&coverageMin=&coverageMax=&limit=   -> ClothingItem[]
// GET /api/wardrobe/:id                                                  -> ClothingItem
const router = Router();

const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const num = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? Number(v) : undefined);

router.get("/", async (req, res, next) => {
  try {
    const q = req.query;
    const params: SearchWardrobeParams = {
      memberId: str(q.memberId),
      category: str(q.category) as SearchWardrobeParams["category"],
      colorFamily: str(q.colorFamily) as SearchWardrobeParams["colorFamily"],
      pattern: str(q.pattern) as SearchWardrobeParams["pattern"],
      occasion: str(q.occasion) as SearchWardrobeParams["occasion"],
      tempMin: num(q.tempMin),
      tempMax: num(q.tempMax),
      coverageMin: num(q.coverageMin),
      coverageMax: num(q.coverageMax),
      limit: num(q.limit),
    };
    res.json(await searchWardrobe(params));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await getItem({ id: req.params.id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export default router;
