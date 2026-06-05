import { useState } from 'react';
import { UnsavedLook } from '../../types/look';
import { recommendationApi } from '../../api/recommendationApi';
import { getImageUrl } from '../../utils/imageUrl';

interface Props {
  look: UnsavedLook;
  index: number;
}

const CATEGORY_ORDER = ['Top', 'Bottom', 'Shoes', 'Accessory'];

export default function RecommendationCard({ look, index }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const sorted = [...look.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await recommendationApi.save(look);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Look {index + 1}</p>
        <h3 className="font-semibold text-gray-900">{look.title}</h3>
      </div>

      {/* Vertical item stack */}
      <div className="flex flex-col gap-3 px-5 py-4 flex-1">
        {sorted.map((item, i) => {
          const img = item.clothingItem?.images?.find((x) => x.isMain) || item.clothingItem?.images?.[0];
          return (
            <div key={i} className="flex flex-col gap-1.5">
              {/* Uniform image box */}
              <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {img ? (
                  <img
                    src={getImageUrl(img.url)}
                    alt={item.clothingItem?.name ?? item.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                    {item.category === 'Top' ? '👕' : item.category === 'Bottom' ? '👖' : item.category === 'Shoes' ? '👟' : '👜'}
                  </div>
                )}
              </div>
              {/* Name + category */}
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs text-gray-700 truncate flex-1">
                  {item.clothingItem?.name ?? '—'}
                </p>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{item.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reasoning */}
      {look.reasoning && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 px-5 pb-3">{look.reasoning}</p>
      )}

      {/* Save button */}
      <div className="px-5 pb-5">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all border ${
            saved
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700 disabled:opacity-50'
          }`}
        >
          {saved ? '♥ Saved to Favorites' : saving ? 'Saving…' : '♡ Save to Favorites'}
        </button>
      </div>
    </div>
  );
}
