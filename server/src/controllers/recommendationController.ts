import { Response } from 'express';
import Look, { ILook } from '../models/Look';
import ClothingItem from '../models/ClothingItem';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateLooks } from '../services/recommendationService';
import mongoose from 'mongoose';

// Attach full clothing item data to every item inside each saved look
const populateLooks = async (looks: ILook[]) => {
  const allIds = looks.flatMap((l) => l.items.map((i) => i.clothingItemId));
  const clothing = await ClothingItem.find({ _id: { $in: allIds } });
  const map = new Map(clothing.map((c) => [c._id.toString(), c]));

  return looks.map((look) => ({
    ...look.toObject(),
    items: look.items.map((item) => ({
      clothingItemId: item.clothingItemId,
      category: item.category,
      clothingItem: map.get(item.clothingItemId.toString()) ?? null,
    })),
  }));
};

// Generate 3 AI looks — NOT saved to DB
export const generate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ message: 'Prompt is required' });
    return;
  }
  try {
    const looks = await generateLooks(req.userId!, prompt);
    res.json({ looks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    res.status(400).json({ message });
  }
};

// Save a look to Favorites (AI look or user-created)
export const saveLook = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, prompt, items, reasoning, createdBy } = req.body;

  if (!title || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'title and items are required' });
    return;
  }

  // Validate all referenced items belong to this user
  const itemIds = items.map((i: { clothingItemId: string }) => i.clothingItemId);
  const existing = await ClothingItem.find({ _id: { $in: itemIds }, userId: req.userId });
  const existingMap = new Map(existing.map((c) => [c._id.toString(), c]));

  const lookItems = items
    .filter((i: { clothingItemId: string }) => existingMap.has(i.clothingItemId))
    .map((i: { clothingItemId: string; category: string }) => ({
      clothingItemId: new mongoose.Types.ObjectId(i.clothingItemId),
      category: i.category as 'Top' | 'Bottom' | 'Shoes' | 'Accessory',
    }));

  const look = await Look.create({
    userId: req.userId,
    title,
    prompt: prompt || '',
    items: lookItems,
    reasoning: reasoning || '',
    createdBy: createdBy === 'User' ? 'User' : 'AI',
  });

  const [populated] = await populateLooks([look]);
  res.status(201).json(populated);
};

// Get all saved (favorited) looks
export const getLooks = async (req: AuthRequest, res: Response): Promise<void> => {
  const looks = await Look.find({ userId: req.userId }).sort({ createdAt: -1 });
  const populated = await populateLooks(looks);
  res.json({ looks: populated });
};

// Get one look detail
export const getLookDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const look = await Look.findOne({ _id: req.params.id, userId: req.userId });
  if (!look) {
    res.status(404).json({ message: 'Look not found' });
    return;
  }
  const [populated] = await populateLooks([look]);
  res.json(populated);
};

// Update look items (from edit/replace flow)
export const updateLook = async (req: AuthRequest, res: Response): Promise<void> => {
  const look = await Look.findOne({ _id: req.params.id, userId: req.userId });
  if (!look) {
    res.status(404).json({ message: 'Look not found' });
    return;
  }

  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400).json({ message: 'items must be an array' });
    return;
  }

  const itemIds = items.map((i: { clothingItemId: string }) => i.clothingItemId);
  const existing = await ClothingItem.find({ _id: { $in: itemIds }, userId: req.userId });
  const existingIds = new Set(existing.map((c) => c._id.toString()));

  look.items = items
    .filter((i: { clothingItemId: string }) => existingIds.has(i.clothingItemId))
    .map((i: { clothingItemId: string; category: string }) => ({
      clothingItemId: new mongoose.Types.ObjectId(i.clothingItemId),
      category: i.category as 'Top' | 'Bottom' | 'Shoes' | 'Accessory',
    }));

  await look.save();
  const [populated] = await populateLooks([look]);
  res.json(populated);
};

// Delete (unfavorite) a look
export const deleteLook = async (req: AuthRequest, res: Response): Promise<void> => {
  const look = await Look.findOne({ _id: req.params.id, userId: req.userId });
  if (!look) {
    res.status(404).json({ message: 'Look not found' });
    return;
  }
  await look.deleteOne();
  res.json({ message: 'Look deleted' });
};
