import { ReactNode, useEffect, useState } from 'react';
import { ClothingItem, Category, Pattern, Color } from '../types/clothing';
import { CATEGORIES, PATTERNS, MATERIALS } from '../utils/constants';
import ImageUploader from './ImageUploader';
import { getFirstImage } from '../utils/imageUrl';
import ColorFamilySelect from './ColorFamilySelect';

interface Props {
  initial?: Partial<ClothingItem>;
  onSubmit: (formData: FormData) => Promise<void>;
  loading?: boolean;
  remoteImages?: string[];
  importSlot?: ReactNode;
}

export default function ClothingForm({ initial, onSubmit, loading, remoteImages = [], importSlot }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'Top');
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? '');
  const [colors, setColors] = useState<Color[]>(initial?.colors ?? [{ family: 'Black' }]);
  const [pattern, setPattern] = useState<Pattern>(initial?.pattern ?? 'Solid');
  const [material, setMaterial] = useState(initial?.material ?? 'Cotton');
  const [temperatureIndex, setTemperatureIndex] = useState(initial?.temperatureIndex ?? 5);
  const [coverageLevel, setCoverageLevel] = useState(initial?.coverageLevel ?? 5);
  const [files, setFiles] = useState<File[]>([]);
  const [mainIndex, setMainIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(initial?.name ?? '');
    setCategory(initial?.category ?? 'Top');
    setSubcategory(initial?.subcategory ?? '');
    setColors(initial?.colors ?? [{ family: 'Black' }]);
    setPattern(initial?.pattern ?? 'Solid');
    setMaterial(initial?.material ?? 'Cotton');
    setTemperatureIndex(initial?.temperatureIndex ?? 5);
    setCoverageLevel(initial?.coverageLevel ?? 5);
    setMainIndex(0);
  }, [initial]);

  const addColor = () => setColors([...colors, { family: 'Black' }]);
  const removeColor = (idx: number) => setColors(colors.filter((_, i) => i !== idx));
  const updateColor = (idx: number, field: keyof Color, value: string) => {
    setColors(colors.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name) { setError('Name is required'); return; }
    if (colors.length === 0) { setError('At least one color is required'); return; }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', category);
    if (subcategory) fd.append('subcategory', subcategory);
    fd.append('colors', JSON.stringify(colors));
    fd.append('pattern', pattern);
    fd.append('material', material);
    fd.append('temperatureIndex', String(temperatureIndex));
    fd.append('coverageLevel', String(coverageLevel));
    files.forEach((f) => fd.append('images', f));
    remoteImages.forEach((url) => fd.append('imageUrls', url));
    fd.append('mainImageIndex', String(mainIndex));

    try {
      await onSubmit(fd);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Something went wrong');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {importSlot}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
        {remoteImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {remoteImages.map((url, idx) => (
              <div key={url} className="relative w-24 h-24">
                <img
                  src={getFirstImage([url])}
                  alt=""
                  className={`w-full h-full object-cover rounded-lg border-2 ${idx === mainIndex ? 'border-blue-500' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setMainIndex(idx)}
                  className="absolute bottom-1 left-1 right-1 text-xs bg-black/50 text-white rounded py-0.5"
                >
                  {idx === mainIndex ? 'Main' : 'Set main'}
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUploader
          files={files}
          mainIndex={Math.max(0, mainIndex - remoteImages.length)}
          onChange={(f, m) => { setFiles(f); setMainIndex(remoteImages.length + m); }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="e.g. White Oxford Shirt"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
          <input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. Oxford Shirt"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Colors *</label>
        {colors.map((color, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <ColorFamilySelect
              value={color.family}
              onChange={(value) => updateColor(idx, 'family', value)}
            />
            <input
              value={color.name ?? ''}
              onChange={(e) => updateColor(idx, 'name', e.target.value)}
              placeholder="Shade (optional)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {colors.length > 1 && (
              <button type="button" onClick={() => removeColor(idx)} className="text-red-400 hover:text-red-600 px-2">×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addColor} className="text-sm text-blue-500 hover:text-blue-700">
          + Add color
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pattern *</label>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value as Pattern)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {PATTERNS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
          <input
            list="materials"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <datalist id="materials">
            {MATERIALS.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature Index: {temperatureIndex}
          </label>
          <input
            type="range" min={0} max={10}
            value={temperatureIndex}
            onChange={(e) => setTemperatureIndex(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>Light (0)</span><span>Heavy (10)</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coverage Level: {coverageLevel}
          </label>
          <input
            type="range" min={0} max={10}
            value={coverageLevel}
            onChange={(e) => setCoverageLevel(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>Minimal (0)</span><span>Full (10)</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Item'}
      </button>
    </form>
  );
}
