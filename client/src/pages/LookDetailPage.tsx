import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recommendationApi } from '../api/recommendationApi';
import { clothingApi } from '../api/clothingApi';
import { Look, LookItem } from '../types/look';
import { ClothingItem, Category } from '../types/clothing';
import LookPreview from '../components/LookPreview';
import LookItemList from '../components/LookItemList';
import ClosetReplacementBar from '../components/ClosetReplacementBar';

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

  const priorityCategory: Category | null = selectedIdx !== null
    ? (items[selectedIdx]?.category ?? null)
    : null;

  const handleRemove = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    setSelectedIdx(null);
  };

  const handleReplace = (clothing: ClothingItem) => {
    if (selectedIdx === null) return;
    const updated = items.map((item, idx) =>
      idx === selectedIdx
        ? { clothingItemId: clothing._id, category: clothing.category, clothingItem: clothing }
        : item
    );
    setItems(updated);
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

  if (!look) {
    return <div className="text-center py-24 text-gray-400">Loading...</div>;
  }

  return (
    <div>
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

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{look.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{look.reasoning}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</h2>
          <LookPreview items={items} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Items {selectedIdx !== null ? '— click to select for replacement' : '— click to select'}
          </h2>
          <LookItemList
            items={items}
            selectedIdx={selectedIdx}
            onSelect={(idx) => setSelectedIdx(selectedIdx === idx ? null : idx)}
            onRemove={handleRemove}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <ClosetReplacementBar
          items={allClothing}
          priorityCategory={priorityCategory}
          onSelect={handleReplace}
        />
      </div>
    </div>
  );
}
