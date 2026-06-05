import { useState } from 'react';
import { UnsavedLook, Look } from '../../types/look';
import { recommendationApi } from '../../api/recommendationApi';
import { getImageUrl } from '../../utils/imageUrl';

interface Props {
  look: UnsavedLook;
  index: number;
}

export default function RecommendationCard({ look, index }: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
        <h3 className="font-semibold text-gray-900 text-base">{look.title}</h3>
      </div>

      {/* Item images */}
      <div className="flex gap-2 px-5 py-4">
        {look.items.slice(0, 4).map((item, i) => {
          const img = item.clothingItem?.images?.find((x) => x.isMain) || item.clothingItem?.images?.[0];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {img ? (
                  <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">?</div>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center truncate w-full">
                {item.clothingItem?.name ?? item.category}
              </p>
            </div>
          );
        })}
      </div>

      {/* Reasoning */}
      {look.reasoning && (
        <div className="px-5 pb-4 flex-1">
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{look.reasoning}</p>
        </div>
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
