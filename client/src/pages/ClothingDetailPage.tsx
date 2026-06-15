import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clothingApi } from '../api/clothingApi';
import { ClothingItem } from '../types/clothing';
import ClothingForm from '../components/ClothingForm';
import { getImageUrl } from '../utils/imageUrl';

export default function ClothingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clothingApi.getOne(id!).then(setItem).catch(() => navigate('/wardrobe'));
  }, [id]);

  const handleUpdate = async (formData: FormData) => {
    setLoading(true);
    try {
      const updated = await clothingApi.update(id!, formData);
      setItem(updated);
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${item?.name}"?`)) return;
    await clothingApi.delete(id!);
    navigate('/wardrobe');
  };

  if (!item) {
    return <div className="text-center py-24 text-gray-400">Loading...</div>;
  }

  if (editMode) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setEditMode(false)} className="text-sm text-gray-500 hover:text-gray-700 mb-6">
          ← Cancel
        </button>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Item</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <ClothingForm
            initial={item}
            onSubmit={handleUpdate}
            loading={loading}
            remoteImages={item.images.map((img) => (typeof img === 'string' ? img : img.url))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/wardrobe')} className="text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back to wardrobe
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex gap-3 p-4 overflow-x-auto">
          {item.images.map((img, idx) => (
            <div key={idx} className="shrink-0 w-40 h-40 bg-gray-100 rounded-xl overflow-hidden relative">
              <img src={getImageUrl(typeof img === 'string' ? img : img.url)} alt="" className="w-full h-full object-cover" />
              {typeof img !== 'string' && img.isMain && (
                <span className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                  Main
                </span>
              )}
            </div>
          ))}
          {item.images.length === 0 && (
            <div className="w-full h-40 flex items-center justify-center text-gray-300 text-5xl">👕</div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">{item.name}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-sm border border-red-200 rounded-lg px-3 py-1.5 text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            {item.brand && (
              <div>
                <dt className="text-gray-500">Brand</dt>
                <dd className="font-medium text-gray-900">{item.brand}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Category</dt>
              <dd className="font-medium text-gray-900">{item.category}</dd>
            </div>
            {item.subcategory && (
              <div>
                <dt className="text-gray-500">Subcategory</dt>
                <dd className="font-medium text-gray-900">{item.subcategory}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Pattern</dt>
              <dd className="font-medium text-gray-900">{item.pattern}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Material</dt>
              <dd className="font-medium text-gray-900">{item.material}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Colors</dt>
              <dd className="font-medium text-gray-900">
                {item.colors.map((c) => c.name ? `${c.name} (${c.family})` : c.family).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Temperature Index</dt>
              <dd className="font-medium text-gray-900">{item.temperatureIndex} / 10</dd>
            </div>
            <div>
              <dt className="text-gray-500">Coverage Level</dt>
              <dd className="font-medium text-gray-900">{item.coverageLevel} / 10</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
