import { Router } from "express";
import { listMembers } from "../retrieval";

// GET /api/members            -> Member[]
// GET /api/members?householdId=hh_001
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const householdId = typeof req.query.householdId === "string" ? req.query.householdId : undefined;
    res.json(await listMembers(householdId));
  } catch (err) {
    next(err);
  }
});

export default router;
