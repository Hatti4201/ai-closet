import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothingApi } from '../api/clothingApi';
import { ClothingItem, ClothingFilters } from '../types/clothing';
import ClothingCard from '../components/ClothingCard';
import WardrobeFilterSidebar from '../components/WardrobeFilterSidebar';

export default function WardrobePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filters, setFilters] = useState<ClothingFilters>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await clothingApi.getAll(filters);
      setItems(data as ClothingItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [JSON.stringify(filters)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: search.trim() || undefined }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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

      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand, category, color, material..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

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
                  key={item.id ?? item._id}
                  item={item}
                  onDeleted={(id) => setItems((prev) => prev.filter((i) => (i.id ?? i._id) !== id))}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
