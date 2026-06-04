import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationApi } from '../api/recommendationApi';
import { Look } from '../types/look';
import LookCard from '../components/LookCard';

export default function RecommendationPage() {
  const navigate = useNavigate();
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recommendationApi.getAll()
      .then((data) => setLooks(data.looks))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this look from favorites?')) return;
    await recommendationApi.delete(id);
    setLooks((prev) => prev.filter((l) => l._id !== id));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Looks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Saved favorites and your personal outfits</p>
        </div>
        <button
          onClick={() => navigate('/looks/create')}
          className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-700"
        >
          + Create Look
        </button>
      </div>

      {looks.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">♡</p>
          <p className="text-lg font-medium">No saved looks yet</p>
          <p className="text-sm mt-1">
            Use the ✨ AI button on your wardrobe to generate looks, or create one yourself.
          </p>
          <button
            onClick={() => navigate('/looks/create')}
            className="mt-4 bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700"
          >
            Create a Look
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {looks.map((look) => (
            <div key={look._id} className="relative group">
              <LookCard look={look} />
              <button
                onClick={() => handleDelete(look._id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-lg leading-none"
                title="Remove from favorites"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
