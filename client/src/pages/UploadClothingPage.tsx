import { useNavigate } from 'react-router-dom';
import { clothingApi, ImportedClothingDraft } from '../api/clothingApi';
import ClothingForm from '../components/ClothingForm';
import { useState } from 'react';
import { Category, Pattern } from '../types/clothing';
import { CATEGORIES, COLOR_FAMILIES, PATTERNS, MATERIALS } from '../utils/constants';
import { getFirstImage } from '../utils/imageUrl';

export default function UploadClothingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [draft, setDraft] = useState<ImportedClothingDraft | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      await clothingApi.create(formData);
      navigate('/wardrobe');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImportError('');
    setImporting(true);
    try {
      const nextDraft = await clothingApi.importUrl(importUrl.trim());
      setDraft(nextDraft);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setImportError(msg || 'Could not import this product link');
    } finally {
      setImporting(false);
    }
  };

  const updateDraft = <K extends keyof ImportedClothingDraft>(key: K, value: ImportedClothingDraft[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const saveDraft = async () => {
    if (!draft) return;
    setLoading(true);
    try {
      await clothingApi.createImported(draft);
      navigate('/wardrobe');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setImportError(msg || 'Could not save imported item');
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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Import from product link</h2>
        <form onSubmit={handleImport} className="flex gap-2">
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Paste a Zara, H&M, Uniqlo, or product page URL"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={importing || !importUrl.trim()}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </form>
        {importError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{importError}</div>
        )}

        {draft && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="flex gap-4 mb-5">
              <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                {getFirstImage(draft.images) ? (
                  <img src={getFirstImage(draft.images)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1 truncate">{draft.sourceUrl}</p>
                <input
                  value={draft.name}
                  onChange={(e) => updateDraft('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  value={draft.brand ?? ''}
                  onChange={(e) => updateDraft('brand', e.target.value)}
                  placeholder="Brand"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-gray-700">
                Category
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft('category', e.target.value as Category)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Subcategory
                <input
                  value={draft.subcategory ?? ''}
                  onChange={(e) => updateDraft('subcategory', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-gray-700">
                Color
                <select
                  value={draft.colors[0]?.family ?? 'Black'}
                  onChange={(e) => updateDraft('colors', [{ family: e.target.value as any }])}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {COLOR_FAMILIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Pattern
                <select
                  value={draft.pattern}
                  onChange={(e) => updateDraft('pattern', e.target.value as Pattern)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {PATTERNS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Material
                <input
                  list="materials"
                  value={draft.material ?? ''}
                  onChange={(e) => updateDraft('material', e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <datalist id="materials">
                  {MATERIALS.map((m) => <option key={m} value={m} />)}
                </datalist>
              </label>
              <label className="text-sm text-gray-700">
                Occasions
                <input
                  value={(draft.occasionTags ?? []).join(', ')}
                  onChange={(e) => updateDraft('occasionTags', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <label className="text-sm text-gray-700">
                Temperature Index: {draft.temperatureIndex}
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={draft.temperatureIndex}
                  onChange={(e) => updateDraft('temperatureIndex', Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
              <label className="text-sm text-gray-700">
                Coverage Level: {draft.coverageLevel}
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={draft.coverageLevel}
                  onChange={(e) => updateDraft('coverageLevel', Number(e.target.value))}
                  className="w-full mt-1"
                />
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveDraft}
                disabled={loading}
                className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save imported item'}
              </button>
              <button
                onClick={() => setDraft(null)}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <ClothingForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
