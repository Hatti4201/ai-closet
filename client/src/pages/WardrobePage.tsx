import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothingApi } from '../api/clothingApi';
import { ClothingItem, ClothingFilters } from '../types/clothing';
import ClothingCard from '../components/ClothingCard';
import WardrobeFilterSidebar from '../components/WardrobeFilterSidebar';
import AIChatEntry from '../components/AIChatEntry';
import LookCard from '../components/LookCard';
import { Look, UnsavedLook } from '../types/look';

export default function WardrobePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filters, setFilters] = useState<ClothingFilters>({});
  const [loading, setLoading] = useState(true);
  const [generatedLooks, setGeneratedLooks] = useState<UnsavedLook[]>([]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await clothingApi.getAll(filters);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [JSON.stringify(filters)]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Wardrobe</h1>
        <button
          onClick={() => navigate('/upload')}
          className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-700"
        >
          + Add Item
        </button>
      </div>

      {generatedLooks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-gray-900">Generated Looks</h2>
            <button onClick={() => setGeneratedLooks([])} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {generatedLooks.map((look, idx) => (
              <LookCard
                key={idx}
                look={look}
                onSaved={(saved) =>
                  setGeneratedLooks((prev) =>
                    prev.map((l, i) => (i === idx ? (saved as unknown as UnsavedLook) : l))
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <WardrobeFilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">👔</p>
              <p className="text-lg font-medium">Your wardrobe is empty</p>
              <p className="text-sm mt-1">Upload your first clothing item to get started</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700"
              >
                Upload Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <ClothingCard
                  key={item._id}
                  item={item}
                  onDeleted={(id) => setItems((prev) => prev.filter((i) => i._id !== id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AIChatEntry onLooksGenerated={setGeneratedLooks} />
    </div>
  );
}
