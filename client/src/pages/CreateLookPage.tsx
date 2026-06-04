import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothingApi } from '../api/clothingApi';
import { recommendationApi } from '../api/recommendationApi';
import { ClothingItem, Category } from '../types/clothing';
import { LookItem } from '../types/look';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORIES: Category[] = ['Top', 'Bottom', 'Shoes', 'Accessory'];

export default function CreateLookPage() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [selected, setSelected] = useState<Record<Category, ClothingItem | null>>({
    Top: null, Bottom: null, Shoes: null, Accessory: null,
  });
  const [activeTab, setActiveTab] = useState<Category>('Top');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clothingApi.getAll().then((d) => setWardrobe(d.items));
  }, []);

  const itemsByCategory = (cat: Category) => wardrobe.filter((i) => i.category === cat);

  const handleSelect = (item: ClothingItem) => {
    setSelected((prev) => ({
      ...prev,
      [item.category]: prev[item.category]?._id === item._id ? null : item,
    }));
  };

  const selectedItems = CATEGORIES.flatMap((cat) => (selected[cat] ? [selected[cat]!] : []));

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('Please give your look a name.'); return; }
    if (selectedItems.length === 0) { setError('Select at least one item.'); return; }

    const items: LookItem[] = selectedItems.map((item) => ({
      clothingItemId: item._id,
      category: item.category,
      clothingItem: item,
    }));

    setSaving(true);
    try {
      const saved = await recommendationApi.create({ title, items });
      navigate(`/looks/${saved._id}`);
    } catch {
      setError('Failed to save look. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/recommendations')} className="text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back to My Looks
      </button>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create a Look</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: item picker */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === cat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {cat}
                {selected[cat] && <span className="ml-1 text-blue-500">•</span>}
              </button>
            ))}
          </div>

          {itemsByCategory(activeTab).length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl">
              <p>No {activeTab} items in your wardrobe.</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-2 text-sm text-gray-900 underline"
              >
                Upload one
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {itemsByCategory(activeTab).map((item) => {
                const img = item.images.find((i) => i.isMain) || item.images[0];
                const isSelected = selected[item.category]?._id === item._id;
                return (
                  <button
                    key={item._id}
                    onClick={() => handleSelect(item)}
                    className={`text-left rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="aspect-square bg-gray-100">
                      {img ? (
                        <img src={getImageUrl(img.url)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">👕</div>
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.colors[0]?.family}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: preview + save */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</h2>

            {selectedItems.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 text-sm rounded-lg bg-gray-50">
                Select items to preview
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {selectedItems.map((item) => {
                  const img = item.images.find((i) => i.isMain) || item.images[0];
                  return (
                    <div key={item._id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                      {img ? (
                        <img src={getImageUrl(img.url)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">👕</div>
                      )}
                      <span className="absolute bottom-1 left-1 right-1 text-center text-xs bg-black/50 text-white rounded py-0.5 truncate px-1">
                        {item.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this look..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Look'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
