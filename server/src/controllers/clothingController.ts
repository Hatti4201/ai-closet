import { Response } from 'express';
import ClothingItem from '../models/ClothingItem';
import { AuthRequest } from '../middleware/authMiddleware';
import { deleteImageFile } from '../services/imageService';
import { isValidCategory, isValidPattern, isValidIndex } from '../utils/validators';

export const createClothing = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, category, subcategory, colors: colorsRaw, pattern, material, temperatureIndex, coverageLevel, mainImageIndex } = req.body;

  if (!name || !category || !pattern || !material) {
    res.status(400).json({ message: 'name, category, pattern, and material are required' });
    return;
  }
  if (!isValidCategory(category)) {
    res.status(400).json({ message: 'Invalid category' });
    return;
  }
  if (!isValidPattern(pattern)) {
    res.status(400).json({ message: 'Invalid pattern' });
    return;
  }

  const tempIdx = Number(temperatureIndex);
  const covIdx = Number(coverageLevel);
  if (!isValidIndex(tempIdx)) {
    res.status(400).json({ message: 'Invalid temperature index' });
    return;
  }
  if (!isValidIndex(covIdx)) {
    res.status(400).json({ message: 'Invalid coverage level' });
    return;
  }

  let colors: { family: string; name?: string }[];
  try {
    colors = typeof colorsRaw === 'string' ? JSON.parse(colorsRaw) : colorsRaw;
  } catch {
    res.status(400).json({ message: 'Invalid colors format' });
    return;
  }
  if (!Array.isArray(colors) || colors.length === 0) {
    res.status(400).json({ message: 'At least one color is required' });
    return;
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (files && files.length > 3) {
    res.status(400).json({ message: 'Too many images uploaded' });
    return;
  }

  const mainIdx = files && files.length > 0 ? Number(mainImageIndex ?? 0) : -1;

  const images = (files || []).map((file, idx) => ({
    url: file.path,   // Cloudinary secure URL
    isMain: idx === mainIdx,
  }));

  if (images.length > 0 && !images.some((img) => img.isMain)) {
    images[0].isMain = true;
  }

  const item = await ClothingItem.create({
    userId: req.userId,
    name,
    category,
    subcategory,
    colors,
    pattern,
    material,
    temperatureIndex: tempIdx,
    coverageLevel: covIdx,
    images,
  });

  res.status(201).json(item);
};

export const getClothingItems = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category, colorFamily, pattern, material, minTemperatureIndex, maxTemperatureIndex, minCoverageLevel, maxCoverageLevel } = req.query;

  const filter: Record<string, unknown> = { userId: req.userId };
  if (category) filter.category = category;
  if (pattern) filter.pattern = pattern;
  if (material) filter.material = { $regex: material as string, $options: 'i' };
  if (colorFamily) filter['colors.family'] = colorFamily;
  if (minTemperatureIndex || maxTemperatureIndex) {
    filter.temperatureIndex = {
      ...(minTemperatureIndex && { $gte: Number(minTemperatureIndex) }),
      ...(maxTemperatureIndex && { $lte: Number(maxTemperatureIndex) }),
    };
  }
  if (minCoverageLevel || maxCoverageLevel) {
    filter.coverageLevel = {
      ...(minCoverageLevel && { $gte: Number(minCoverageLevel) }),
      ...(maxCoverageLevel && { $lte: Number(maxCoverageLevel) }),
    };
  }

  const items = await ClothingItem.find(filter).sort({ createdAt: -1 });
  res.json({ items });
};

export const getClothingDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) {
    res.status(404).json({ message: 'Clothing item not found' });
    return;
  }
  res.json(item);
};

export const updateClothing = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) {
    res.status(404).json({ message: 'Clothing item not found' });
    return;
  }

  const { name, category, subcategory, colors: colorsRaw, pattern, material, temperatureIndex, coverageLevel, mainImageIndex } = req.body;

  if (name) item.name = name;
  if (category) {
    if (!isValidCategory(category)) {
      res.status(400).json({ message: 'Invalid category' });
      return;
    }
    item.category = category;
  }
  if (subcategory !== undefined) item.subcategory = subcategory;
  if (pattern) {
    if (!isValidPattern(pattern)) {
      res.status(400).json({ message: 'Invalid pattern' });
      return;
    }
    item.pattern = pattern;
  }
  if (material) item.material = material;
  if (temperatureIndex !== undefined) {
    const idx = Number(temperatureIndex);
    if (!isValidIndex(idx)) {
      res.status(400).json({ message: 'Invalid temperature index' });
      return;
    }
    item.temperatureIndex = idx;
  }
  if (coverageLevel !== undefined) {
    const idx = Number(coverageLevel);
    if (!isValidIndex(idx)) {
      res.status(400).json({ message: 'Invalid coverage level' });
      return;
    }
    item.coverageLevel = idx;
  }
  if (colorsRaw) {
    try {
      const colors = typeof colorsRaw === 'string' ? JSON.parse(colorsRaw) : colorsRaw;
      if (!Array.isArray(colors) || colors.length === 0) {
        res.status(400).json({ message: 'At least one color is required' });
        return;
      }
      item.colors = colors;
    } catch {
      res.status(400).json({ message: 'Invalid colors format' });
      return;
    }
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (files && files.length > 0) {
    if (files.length > 3) {
      res.status(400).json({ message: 'Too many images uploaded' });
      return;
    }
    await Promise.all(item.images.map((img) => deleteImageFile(img.url)));
    const mainIdx = Number(mainImageIndex ?? 0);
    item.images = files.map((file, idx) => ({
      url: file.path,   // Cloudinary secure URL
      isMain: idx === mainIdx,
    }));
    if (!item.images.some((img) => img.isMain)) item.images[0].isMain = true;
  }

  await item.save();
  res.json(item);
};

export const deleteClothing = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await ClothingItem.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) {
    res.status(404).json({ message: 'Clothing item not found' });
    return;
  }
  await Promise.all(item.images.map((img) => deleteImageFile(img.url)));
  await item.deleteOne();
  res.json({ message: 'Clothing item deleted' });
};
