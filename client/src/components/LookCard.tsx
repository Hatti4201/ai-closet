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

export default function LookCard({ look, onSaved }: Props) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const thumbs = look.items.slice(0, 4);

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
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-2 mb-3">
        {thumbs.map((item, idx) => {
          const img = item.clothingItem?.images?.find((i) => i.isMain) || item.clothingItem?.images?.[0];
          return (
            <div key={idx} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
              {img ? (
                <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">?</div>
              )}
            </div>
          );
        })}
        {look.items.length === 0 && (
          <div className="w-full h-16 flex items-center justify-center text-gray-300 text-sm">No items</div>
        )}
      </div>

      <h3 className="font-medium text-gray-900">{look.title}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{look.reasoning}</p>

      <div className="flex gap-2 mt-3">
        {isSaved(look) ? (
          <button
            onClick={() => navigate(`/looks/${look._id}`)}
            className="flex-1 text-sm bg-gray-900 text-white rounded-lg py-2 hover:bg-gray-700"
          >
            Open Look
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 text-sm rounded-lg py-2 font-medium transition-colors ${
              saved
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
            } disabled:opacity-60`}
          >
            {saved ? '♥ Saved' : saving ? 'Saving...' : '♡ Save to Favorites'}
          </button>
        )}
      </div>
    </div>
  );
}
