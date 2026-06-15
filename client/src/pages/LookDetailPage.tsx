import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recommendationApi } from '../api/recommendationApi';
import { SavedLook } from '../types/look';
import { getFirstImage } from '../utils/imageUrl';

const CATEGORY_ORDER = ['Top', 'Bottom', 'Shoes', 'Outerwear', 'Dress', 'Accessory'];

export default function LookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [look, setLook] = useState<SavedLook | null>(null);

  useEffect(() => {
    recommendationApi.getOne(id!).then(setLook).catch(() => navigate('/recommendations'));
  }, [id]);

  if (!look) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  const sorted = [...(look.items ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">{look.title ?? 'Saved Look'}</h1>
      {look.reasoning && <p className="text-sm text-gray-500 mb-6">{look.reasoning}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((item, idx) => {
          const imgUrl = getFirstImage(item.clothingItem?.images as any);
          return (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="aspect-[4/3] bg-gray-50">
                {imgUrl ? (
                  <img src={imgUrl} alt={item.clothingItem?.name ?? item.category} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                    {item.category === 'Top' ? '👕' : item.category === 'Bottom' ? '👖' : item.category === 'Shoes' ? '👟' : '👔'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm">{item.clothingItem?.name ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>
              </div>
            </div>
          );
        })}
      </div>

      {look.prompt && (
        <div className="mt-8 bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Original prompt</p>
          <p className="text-sm text-gray-700">{look.prompt}</p>
        </div>
      )}
    </div>
  );
}
