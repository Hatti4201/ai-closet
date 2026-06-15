import { useNavigate } from 'react-router-dom';
import { SavedLook } from '../types/look';
import { getFirstImage } from '../utils/imageUrl';

interface Props {
  look: SavedLook;
}

const CATEGORY_ORDER = ['Top', 'Bottom', 'Shoes', 'Outerwear', 'Dress', 'Accessory'];

export default function LookCard({ look }: Props) {
  const navigate = useNavigate();

  const sorted = [...(look.items ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{look.title ?? 'Saved Look'}</h3>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3 flex-1">
        {sorted.map((item, idx) => {
          const imgUrl = getFirstImage(item.clothingItem?.images as any);
          return (
            <div key={idx} className="flex flex-col gap-1">
              <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {imgUrl ? (
                  <img src={imgUrl} alt={item.clothingItem?.name ?? item.category} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
                    {item.category === 'Top' ? '👕' : item.category === 'Bottom' ? '👖' : item.category === 'Shoes' ? '👟' : '👔'}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-0.5">
                <p className="text-xs text-gray-700 truncate flex-1">{item.clothingItem?.name ?? '—'}</p>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{item.category}</span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="h-24 flex items-center justify-center text-gray-300 text-sm">No items</div>
        )}
      </div>

      {look.reasoning && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 px-4 pb-3">{look.reasoning}</p>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={() => navigate(`/looks/${look.id}`)}
          className="w-full text-sm bg-gray-900 text-white rounded-xl py-2.5 hover:bg-gray-700 transition-colors"
        >
          Open Look
        </button>
      </div>
    </div>
  );
}
