import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Look, UnsavedLook } from '../types/look';
import { recommendationApi } from '../api/recommendationApi';
import { getImageUrl } from '../utils/imageUrl';

interface Props {
  look: Look | UnsavedLook;
  onSaved?: (saved: Look) => void;
}

const isSaved = (look: Look | UnsavedLook): look is Look => '_id' in look;

const CATEGORY_ORDER = ['Top', 'Bottom', 'Shoes', 'Accessory'];

export default function LookCard({ look, onSaved }: Props) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sorted = [...look.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await recommendationApi.save(look as UnsavedLook);
      setSaved(true);
      onSaved?.(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* Title */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{look.title}</h3>
      </div>

      {/* Vertical item stack */}
      <div className="flex flex-col gap-2 px-4 py-3 flex-1">
        {sorted.map((item, idx) => {
          const img = item.clothingItem?.images?.find((i) => i.isMain) || item.clothingItem?.images?.[0];
          return (
            <div key={idx} className="flex flex-col gap-1">
              {/* Uniform image box */}
              <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {img ? (
                  <img
                    src={getImageUrl(img.url)}
                    alt={item.clothingItem?.name ?? item.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
                    <span className="text-2xl">
                      {item.category === 'Top' ? '👕' : item.category === 'Bottom' ? '👖' : item.category === 'Shoes' ? '👟' : '👜'}
                    </span>
                  </div>
                )}
              </div>
              {/* Item name + category label */}
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs text-gray-700 truncate flex-1">
                  {item.clothingItem?.name ?? '—'}
                </p>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{item.category}</span>
              </div>
            </div>
          );
        })}

        {look.items.length === 0 && (
          <div className="h-24 flex items-center justify-center text-gray-300 text-sm">No items</div>
        )}
      </div>

      {/* Reasoning */}
      {look.reasoning && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 px-4 pb-3">{look.reasoning}</p>
      )}

      {/* Action */}
      <div className="px-4 pb-4">
        {isSaved(look) ? (
          <button
            onClick={() => navigate(`/looks/${look._id}`)}
            className="w-full text-sm bg-gray-900 text-white rounded-xl py-2.5 hover:bg-gray-700 transition-colors"
          >
            Open Look
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full text-sm rounded-xl py-2.5 font-medium transition-colors border ${
              saved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
            } disabled:opacity-60`}
          >
            {saved ? '♥ Saved' : saving ? 'Saving...' : '♡ Save to Favorites'}
          </button>
        )}
      </div>
    </div>
  );
}
