import { Router } from "express";
import { ingestPurchases } from "../ingest";
import { PurchaseEvent } from "../ingest/types";
import { ingestProductUrl } from "../ingest/url";

// POST /api/ingest   (dev only) mock purchase feed -> { inserted, ids }
// Body: a PurchaseEvent[] OR { events: PurchaseEvent[] }.
const router = Router();

router.post("/url", async (req, res, next) => {
  try {
    const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    if (!url) return res.status(400).json({ message: "url is required" });
    res.json(await ingestProductUrl(url));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body;
    const events: PurchaseEvent[] | null = Array.isArray(body)
      ? body
      : Array.isArray(body?.events)
        ? body.events
        : null;

    if (!events || events.length === 0) {
      return res.status(400).json({
        message: "Body must be a non-empty PurchaseEvent[] (or { events: [...] }).",
      });
    }
    for (const ev of events) {
      if (!ev?.memberId || !ev?.product?.title || !ev?.product?.category) {
        return res.status(400).json({
          message: "Each event needs memberId and product.{title, category}.",
        });
      }
    }
    res.status(201).json(await ingestPurchases(events));
  } catch (err) {
    next(err);
  }
});

export default router;
