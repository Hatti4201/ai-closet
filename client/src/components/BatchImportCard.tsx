import { useState, useEffect } from 'react';
import { clothingApi } from '../api/clothingApi';
import { QueueItem } from '../pages/BatchImportPage';
import { CATEGORIES, PATTERNS, MATERIALS } from '../utils/constants';
import { Category, Pattern, Color, ClothingImage } from '../types/clothing';
import ColorFamilySelect from './ColorFamilySelect';
import { getFirstImage } from '../utils/imageUrl';

const toUrl = (img: string | ClothingImage): string =>
  typeof img === 'string' ? img : img.url;

interface Props {
  item: QueueItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onSaved: (id: string) => void;
}

export default function BatchImportCard({ item, onRetry, onRemove, onSaved }: Props) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Top');
  const [subcategory, setSubcategory] = useState('');
  const [colors, setColors] = useState<Color[]>([{ family: 'Black' }]);
  const [pattern, setPattern] = useState<Pattern>('Solid');
  const [material, setMaterial] = useState('Cotton');
  const [temperatureIndex, setTemperatureIndex] = useState(5);
  const [coverageLevel, setCoverageLevel] = useState(5);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!item.draft) return;
    const d = item.draft;
    setName(d.name ?? '');
    setBrand(d.brand ?? '');
    setDescription(d.description ?? '');
    setCategory(d.category ?? 'Top');
    setSubcategory(d.subcategory ?? '');
    setColors(d.colors?.length ? d.colors : [{ family: 'Black' }]);
    setPattern(d.pattern ?? 'Solid');
    setMaterial(d.material ?? 'Cotton');
    setTemperatureIndex(d.temperatureIndex ?? 5);
    setCoverageLevel(d.coverageLevel ?? 5);
    setSelectedImages((d.images ?? []).map(toUrl).slice(0, 3));
    setExpanded(true);
  }, [item.draft]);

  const toggleImage = (url: string) => {
    setSelectedImages(prev => {
      if (prev.includes(url)) return prev.filter(u => u !== url);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, url];
    });
  };

  const handleSave = async () => {
    if (!item.draft) return;
    setSaving(true);
    try {
      await clothingApi.createImported({
        ...item.draft,
        name, brand, description, category, subcategory, colors, pattern, material,
        temperatureIndex, coverageLevel,
        images: selectedImages.length ? selectedImages : (item.draft.images ?? []).slice(0, 3),
      });
      onSaved(item.id);
    } finally {
      setSaving(false);
    }
  };

  const allImages = (item.draft?.images ?? []).map(toUrl);
  const imgUrl = selectedImages[0] ?? (allImages.length ? getFirstImage(allImages) : null);

  const statusBadge = {
    pending:    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Waiting</span>,
    processing: <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-2.5 h-2.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />Processing</span>,
    done:       <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Ready</span>,
    error:      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Failed</span>,
    saved:      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Saved ✓</span>,
  }[item.status];

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      item.status === 'saved' ? 'border-gray-100 opacity-60' : 'border-gray-200'
    }`}>
      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => item.status === 'done' || item.status === 'saved' ? setExpanded(e => !e) : undefined}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-gray-300">
              {item.status === 'processing' ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin inline-block" />
              ) : '👕'}
            </span>
          )}
        </div>

        {/* URL + name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name || item.url}</p>
          {name && <p className="text-xs text-gray-400 truncate">{item.url}</p>}
        </div>

        {/* Status + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge}
          {(item.status === 'done' || item.status === 'saved') && (
            <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      {/* Error state */}
      {item.status === 'error' && (
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <p className="text-xs text-red-500 flex-1">{item.error}</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onRetry(item.id)}
              className="text-xs border border-blue-200 text-blue-500 rounded-lg px-3 py-1.5 hover:bg-blue-50"
            >
              Retry
            </button>
            <button
              onClick={() => onRemove(item.id)}
              className="text-xs border border-gray-200 text-gray-400 rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Editable form — only when done/saved and expanded */}
      {(item.status === 'done' || item.status === 'saved') && expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Image selection grid */}
          {allImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                选择图片（最多3张，点击选中/取消）
                <span className="ml-2 text-blue-500">{selectedImages.length}/3 已选</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allImages.map((url, i) => {
                  const isSelected = selectedImages.includes(url);
                  const order = selectedImages.indexOf(url);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleImage(url)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-blue-500' : 'border-gray-200 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <span className="absolute top-1 left-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {order + 1}
                        </span>
                      )}
                      {!isSelected && selectedImages.length >= 3 && (
                        <div className="absolute inset-0 bg-black/30" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={brand}
                onChange={e => setBrand(e.target.value)}
                placeholder="Brand"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="Subcategory"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Description */}
          {description && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={pattern}
              onChange={e => setPattern(e.target.value as Pattern)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PATTERNS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input
              list="batch-materials"
              value={material}
              onChange={e => setMaterial(e.target.value)}
              placeholder="Material"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <datalist id="batch-materials">
              {MATERIALS.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          {/* Colors */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Colors</p>
            <div className="space-y-1.5">
              {colors.map((color, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <ColorFamilySelect
                    value={color.family}
                    onChange={v => setColors(colors.map((c, j) => j === i ? { ...c, family: v } : c))}
                  />
                  <input
                    value={color.name ?? ''}
                    onChange={e => setColors(colors.map((c, j) => j === i ? { ...c, name: e.target.value } : c))}
                    placeholder="Shade (optional)"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {colors.length > 1 && (
                    <button type="button" onClick={() => setColors(colors.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 px-1">×</button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setColors([...colors, { family: 'Black' }])}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                + Add color
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Warmth: {temperatureIndex}</p>
              <input type="range" min={0} max={10} value={temperatureIndex}
                onChange={e => setTemperatureIndex(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Coverage: {coverageLevel}</p>
              <input type="range" min={0} max={10} value={coverageLevel}
                onChange={e => setCoverageLevel(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Actions */}
          {item.status === 'done' && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onRemove(item.id)}
                className="px-4 py-2 text-xs border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50"
              >
                Remove
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 text-xs bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save to Wardrobe'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
