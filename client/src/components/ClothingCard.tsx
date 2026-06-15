import { useNavigate } from 'react-router-dom';
import { ClothingItem } from '../types/clothing';
import { clothingApi } from '../api/clothingApi';
import { getFirstImage } from '../utils/imageUrl';

interface Props {
  item: ClothingItem;
  onDeleted: (id: string) => void;
}

export default function ClothingCard({ item, onDeleted }: Props) {
  const navigate = useNavigate();
  const itemId = item.id ?? item._id ?? '';
  const imgUrl = getFirstImage(item.images);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${item.name}"?`)) return;
    await clothingApi.delete(itemId);
    onDeleted(itemId);
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/clothing/${itemId}`)}
    >
      <div className="aspect-square bg-gray-100 relative">
        {imgUrl ? (
          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            👕
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.colors[0]?.family}</p>
        <p className="text-xs text-gray-400">{item.pattern} · {item.material}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/clothing/${itemId}/edit`); }}
            className="flex-1 text-xs py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 text-xs py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
