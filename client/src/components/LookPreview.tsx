import { LookItem } from '../types/look';
import { getImageUrl } from '../utils/imageUrl';

interface Props {
  items: LookItem[];
}

export default function LookPreview({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, idx) => {
        const img = item.clothingItem?.images?.find((i) => i.isMain) || item.clothingItem?.images?.[0];
        return (
          <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
            {img ? (
              <img src={getImageUrl(img.url)} alt={item.clothingItem?.name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <span className="text-3xl">👕</span>
                <span className="text-xs mt-1">{item.category}</span>
              </div>
            )}
            <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {item.category}
            </span>
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-2 h-48 flex items-center justify-center text-gray-300 text-sm">
          No items in this look
        </div>
      )}
    </div>
  );
}
