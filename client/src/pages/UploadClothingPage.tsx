import { useNavigate } from 'react-router-dom';
import { clothingApi } from '../api/clothingApi';
import ClothingForm from '../components/ClothingForm';
import { useState } from 'react';

export default function UploadClothingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await clothingApi.create(formData);
      navigate('/wardrobe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back
      </button>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add Clothing Item</h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <ClothingForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
