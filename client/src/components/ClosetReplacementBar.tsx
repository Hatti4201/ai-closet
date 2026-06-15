import { ClothingItem, Category } from '../types/clothing';
import { getFirstImage } from '../utils/imageUrl';

interface Props {
  items: ClothingItem[];
  priorityCategory: Category | null;
  onSelect: (item: ClothingItem) => void;
}

export default function ClosetReplacementBar({ items, priorityCategory, onSelect }: Props) {
  const sorted = priorityCategory
    ? [...items].sort((a, b) => {
        const aMatch = a.category === priorityCategory ? 0 : 1;
        const bMatch = b.category === priorityCategory ? 0 : 1;
        return aMatch - bMatch;
      })
    : items;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Replace with {priorityCategory ? `(${priorityCategory} shown first)` : ''}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {sorted.map((item) => {
          const imgUrl = getFirstImage(item.images);
          return (
            <button
              key={item.id ?? item._id}
              onClick={() => onSelect(item)}
              className="shrink-0 flex flex-col items-center gap-1 group"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-colors">
                {imgUrl ? (
                  <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">?</div>
                )}
              </div>
              <span className="text-xs text-gray-500 w-16 truncate text-center">{item.name}</span>
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-gray-400 py-4">No items in your wardrobe</p>
        )}
      </div>
    </div>
  );
}
