import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothingApi, ImportedClothingDraft } from '../api/clothingApi';
import ClothingForm from '../components/ClothingForm';
import { ClothingItem } from '../types/clothing';

export default function UploadClothingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [imported, setImported] = useState<ImportedClothingDraft | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (imported?.sourceUrl) formData.append('sourceUrl', imported.sourceUrl);
      await clothingApi.create(formData);
      navigate('/wardrobe');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImportError('');
    setImporting(true);
    try {
      const draft = await clothingApi.importUrl(importUrl.trim());
      setImported(draft);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setImportError(msg || 'Could not import this product link');
    } finally {
      setImporting(false);
    }
  };

  const initial: Partial<ClothingItem> | undefined = imported ? {
    name: imported.name,
    brand: imported.brand,
    category: imported.category,
    subcategory: imported.subcategory,
    colors: imported.colors,
    pattern: imported.pattern,
    material: imported.material,
    temperatureIndex: imported.temperatureIndex,
    coverageLevel: imported.coverageLevel,
    images: imported.images,
  } : undefined;
  const remoteImages = (imported?.images ?? []).filter((img): img is string => typeof img === 'string');

  const importSlot = (
    <div className="border-b border-gray-100 pb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Product link
      </label>
      <div className="flex gap-2">
        <input
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          placeholder="Paste a product page URL or direct image URL"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !importUrl.trim()}
          className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {importing ? 'Filling...' : 'Auto-fill'}
        </button>
      </div>
      {importError && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {importError}
        </div>
      )}
      {imported && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <span className="truncate">Fields filled from link. Review and edit before saving.</span>
          <button
            type="button"
            onClick={() => { setImported(null); setImportUrl(''); }}
            className="text-green-800 hover:underline shrink-0"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
        ← Back
      </button>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Add Clothing Item</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <ClothingForm
          key={imported?.sourceUrl ?? 'manual'}
          initial={initial}
          remoteImages={remoteImages}
          importSlot={importSlot}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
}
