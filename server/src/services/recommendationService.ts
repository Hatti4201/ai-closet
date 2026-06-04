import ClothingItem, { IClothingItem } from '../models/ClothingItem';
import { buildRecommendationPrompt } from '../utils/prompts';
import { callAI } from './aiService';

interface AILook {
  title: string;
  itemIds: string[];
  reasoning: string;
}

interface AIResponse {
  looks: AILook[];
}

export const validateWardrobe = (items: IClothingItem[]): void => {
  const hasTop = items.some((i) => i.category === 'Top');
  const hasBottom = items.some((i) => i.category === 'Bottom');
  const hasShoes = items.some((i) => i.category === 'Shoes');
  if (!hasTop || !hasBottom || !hasShoes) {
    throw new Error('Please add at least one Top, one Bottom, and one Shoes item before generating a look.');
  }
};

// Returns unsaved look objects with clothingItem already populated.
// Nothing is written to the database here — the user must explicitly save a look.
export const generateLooks = async (userId: string, prompt: string) => {
  const items = await ClothingItem.find({ userId });
  validateWardrobe(items);

  const wardrobeData = items.map((item) => ({
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    colors: item.colors,
    pattern: item.pattern,
    material: item.material,
    temperatureIndex: item.temperatureIndex,
    coverageLevel: item.coverageLevel,
  }));

  const aiPrompt = buildRecommendationPrompt(prompt, JSON.stringify(wardrobeData, null, 2));
  const rawResponse = await callAI(aiPrompt);

  let parsed: AIResponse;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('AI response invalid');
  }

  if (!parsed.looks || parsed.looks.length !== 3) {
    throw new Error('AI response invalid');
  }

  const itemMap = new Map(items.map((i) => [i._id.toString(), i]));

  return parsed.looks.map((look: AILook) => ({
    title: look.title,
    prompt,
    reasoning: look.reasoning,
    createdBy: 'AI' as const,
    items: look.itemIds
      .filter((id) => itemMap.has(id))
      .map((id) => ({
        clothingItemId: id,
        category: itemMap.get(id)!.category,
        clothingItem: itemMap.get(id)!.toJSON(),
      })),
  }));
};
