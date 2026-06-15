import { Router } from "express";
import multer from "multer";
import { ClothingItem } from "../models/ClothingItem";
import { ensureDefaultMember, searchWardrobe, getItem } from "../retrieval";
import {
  CATEGORIES, COLOR_FAMILIES, PATTERNS,
  Category, ColorFamily, Pattern,
} from "../models/enums";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 3, fileSize: 8 * 1024 * 1024 } });

const one = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return one(value[0]);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const numberField = (value: unknown, fallback: number): number => {
  const parsed = Number(one(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const enumField = <T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] => {
  const raw = one(value);
  return raw && allowed.includes(raw) ? raw : fallback;
};

const parseColors = (value: unknown): { family: ColorFamily; name?: string }[] => {
  const raw = one(value);
  if (!raw) return [{ family: "Black" }];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const colors = parsed
        .map((c) => ({
          family: enumField(c?.family, COLOR_FAMILIES, "Black"),
          name: typeof c?.name === "string" && c.name.trim() ? c.name.trim() : undefined,
        }))
        .filter((c) => c.family);
      if (colors.length) return colors;
    }
  } catch {
    // Fall through to string parsing below.
  }

  return raw.split(",").map((part) => ({
    family: enumField(part.trim(), COLOR_FAMILIES, "Black"),
  }));
};

const imagesFromFiles = (files: Express.Multer.File[] | undefined, mainImageIndex: number): string[] => {
  if (!files?.length) return [];
  const limited = files.slice(0, 3);
  const urls = limited.map((file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`);
  if (mainImageIndex > 0 && mainImageIndex < urls.length) {
    const [main] = urls.splice(mainImageIndex, 1);
    urls.unshift(main);
  }
  return urls;
};

async function resolveMemberId(input?: string): Promise<string> {
  if (input) return input;
  const member = await ensureDefaultMember();
  return String(member._id);
}

function itemPayload(body: Record<string, unknown>, memberId: string, images: string[]) {
  return {
    memberId,
    name: one(body.name) ?? "Untitled item",
    brand: one(body.brand),
    category: enumField(body.category, CATEGORIES, "Top") as Category,
    subcategory: one(body.subcategory),
    colors: parseColors(body.colors),
    pattern: enumField(body.pattern, PATTERNS, "Solid") as Pattern,
    material: one(body.material) ?? "Unknown",
    temperatureIndex: numberField(body.temperatureIndex, 5),
    coverageLevel: numberField(body.coverageLevel, 5),
    occasionTags: [],
    source: "manual" as const,
    images,
  };
}

router.post("/auth/register", async (req, res, next) => {
  try {
    await ensureDefaultMember();
    const name = one(req.body?.name) ?? "Me";
    const email = one(req.body?.email) ?? "local@example.com";
    res.status(201).json({ token: "local-dev-token", user: { id: "local-user", name, email } });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    await ensureDefaultMember();
    const email = one(req.body?.email) ?? "local@example.com";
    res.json({ token: "local-dev-token", user: { id: "local-user", name: email.split("@")[0] || "Me", email } });
  } catch (err) {
    next(err);
  }
});

router.get("/auth/me", async (_req, res, next) => {
  try {
    await ensureDefaultMember();
    res.json({ id: "local-user", name: "Me", email: "local@example.com" });
  } catch (err) {
    next(err);
  }
});

router.get("/clothing", async (req, res, next) => {
  try {
    const items = await searchWardrobe({
      memberId: one(req.query.memberId),
      category: one(req.query.category) as Category | undefined,
      colorFamily: one(req.query.colorFamily) as ColorFamily | undefined,
      pattern: one(req.query.pattern) as Pattern | undefined,
      limit: numberField(req.query.limit, 50),
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get("/clothing/:id", async (req, res, next) => {
  try {
    const item = await getItem({ id: req.params.id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.post("/clothing", upload.array("images", 3), async (req, res, next) => {
  try {
    const memberId = await resolveMemberId(one(req.body.memberId));
    const mainImageIndex = numberField(req.body.mainImageIndex, 0);
    const images = imagesFromFiles(req.files as Express.Multer.File[] | undefined, mainImageIndex);
    const id = `item_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
    const created = await ClothingItem.create({ _id: id, ...itemPayload(req.body, memberId, images) });
    res.status(201).json(created.toJSON());
  } catch (err) {
    next(err);
  }
});

router.put("/clothing/:id", upload.array("images", 3), async (req, res, next) => {
  try {
    const existing = await ClothingItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Item not found" });

    const mainImageIndex = numberField(req.body.mainImageIndex, 0);
    const nextImages = imagesFromFiles(req.files as Express.Multer.File[] | undefined, mainImageIndex);
    const payload = itemPayload(
      req.body,
      one(req.body.memberId) ?? existing.memberId,
      nextImages.length ? nextImages : existing.images,
    );

    existing.set(payload);
    await existing.save();
    res.json(existing.toJSON());
  } catch (err) {
    next(err);
  }
});

router.delete("/clothing/:id", async (req, res, next) => {
  try {
    const deleted = await ClothingItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
