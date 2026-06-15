import { Router } from "express";
import { getContext } from "../retrieval";

const router = Router();

// GET /api/context?lat=&lon=  — returns ContextInfo (real weather if coords provided)
router.get("/", async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    const location = lat && lon ? `${lat},${lon}` : undefined;
    res.json(await getContext({ location }));
  } catch (err) { next(err); }
});

export default router;
