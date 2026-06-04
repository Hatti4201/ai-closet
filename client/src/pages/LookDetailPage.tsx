import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recommendationApi } from '../api/recommendationApi';
import { clothingApi } from '../api/clothingApi';
import { Look, LookItem } from '../types/look';
import { ClothingItem, Category } from '../types/clothing';
import LookPreview from '../components/LookPreview';
import ClosetReplacementBar from '../components/ClosetReplacementBar';
import { getImageUrl } from '../utils/imageUrl';

export default function LookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [look, setLook] = useState<Look | null>(null);
  const [items, setItems] = useState<LookItem[]>([]);
  const [allClothing, setAllClothing] = useState<ClothingItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      recommendationApi.getOne(id!),
      clothingApi.getAll(),
    ]).then(([lookData, clothingData]) => {
      setLook(lookData);
      setItems(lookData.items);
      setAllClothing(clothingData.items);
    }).catch(() => navigate('/recommendations'));
  }, [id]);

  const selectedItem = selectedIdx !== null ? items[selectedIdx] : null;
  const priorityCategory: Category | null = selectedItem?.category ?? null;

  const handleRemove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const handleSelect = (idx: number) => {
    // Single click selects; clicking the already-selected item deselects
    setSelectedIdx((prev) => (prev === idx ? null : idx));
  };

  const handleReplace = (clothing: ClothingItem) => {
    if (selectedIdx === null) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === selectedIdx
          ? { clothingItemId: clothing._id, category: clothing.category, clothingItem: clothing }
          : item
      )
    );
    setSelectedIdx(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await recommendationApi.update(id!, items);
      setLook(updated);
      setItems(updated.items);
    } finally {
      setSaving(false);
    }
  };

  if (!look) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{look.title}</h1>
      {look.reasoning && <p className="text-sm text-gray-500 mb-6">{look.reasoning}</p>}

      {/* Preview + Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
          <LookPreview items={items} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Items — click to swap, × to remove
          </p>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const img = item.clothingItem?.images?.find((i) => i.isMain) || item.clothingItem?.images?.[0];
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {img ? (
                      <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.clothingItem?.name ?? 'Unknown item'}
                    </p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-gray-400 mr-1">↓ pick below</span>
                  )}
                  {/* X button — stops propagation so it doesn't trigger select */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors text-lg leading-none"
                    title="Remove from look"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">No items — add from the bar below.</p>
            )}
          </div>
        </div>
      </div>

      {/* Replacement bar — always visible, highlights when an item is selected */}
      <div className={`border-t pt-6 transition-all ${selectedIdx !== null ? 'border-gray-900' : 'border-gray-200'}`}>
        {selectedIdx !== null && (
          <p className="text-xs font-semibold text-gray-900 mb-2">
            Replacing: <span className="font-normal">{selectedItem?.clothingItem?.name ?? selectedItem?.category}</span>
            <button onClick={() => setSelectedIdx(null)} className="ml-2 text-gray-400 hover:text-gray-600">cancel</button>
          </p>
        )}
        <ClosetReplacementBar
          items={allClothing}
          priorityCategory={priorityCategory}
          onSelect={handleReplace}
        />
      </div>
    </div>
  );
}
