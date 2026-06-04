import { useState } from 'react';
import { ClothingItem, Category, Pattern, Color } from '../types/clothing';
import { CATEGORIES, PATTERNS, COLOR_FAMILIES, MATERIALS } from '../utils/constants';
import ImageUploader from './ImageUploader';

interface Props {
  initial?: Partial<ClothingItem>;
  onSubmit: (formData: FormData) => Promise<void>;
  loading?: boolean;
}

export default function ClothingForm({ initial, onSubmit, loading }: Props) {
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
        <ImageUploader
          files={files}
          mainIndex={mainIndex}
          onChange={(f, m) => { setFiles(f); setMainIndex(m); }}
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
            <select
              value={color.family}
              onChange={(e) => updateColor(idx, 'family', e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {COLOR_FAMILIES.map((cf) => <option key={cf}>{cf}</option>)}
            </select>
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
