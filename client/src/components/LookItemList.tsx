import { LookItem } from '../types/look';

interface Props {
  items: LookItem[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onRemove: (idx: number) => void;
}

export default function LookItemList({ items, selectedIdx, onSelect, onRemove }: Props) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const img = item.clothingItem?.images?.find((i) => i.isMain) || item.clothingItem?.images?.[0];
        return (
          <div
            key={idx}
            onClick={() => onSelect(idx)}
            className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-colors ${
              selectedIdx === idx ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              {img ? (
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.clothingItem?.name ?? 'Unknown item'}
              </p>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
              className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
              title="Remove item"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
