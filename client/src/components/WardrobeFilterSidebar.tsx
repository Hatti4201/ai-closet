import { ClothingFilters, Category, Pattern } from '../types/clothing';
import { CATEGORIES, PATTERNS, COLOR_FAMILIES } from '../utils/constants';

interface Props {
  filters: ClothingFilters;
  onChange: (filters: ClothingFilters) => void;
}

export default function WardrobeFilterSidebar({ filters, onChange }: Props) {
  const update = (key: keyof ClothingFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <aside className="w-56 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5 sticky top-8">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => update('category', undefined)}
                className="accent-gray-900"
              />
              All
            </label>
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat}
                  onChange={() => update('category', cat)}
                  className="accent-gray-900"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Color</h3>
          <select
            value={filters.colorFamily ?? ''}
            onChange={(e) => update('colorFamily', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="">All colors</option>
            {COLOR_FAMILIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pattern</h3>
          <select
            value={filters.pattern ?? ''}
            onChange={(e) => update('pattern', e.target.value as Pattern)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
          >
            <option value="">All patterns</option>
            {PATTERNS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Temperature</h3>
          <div className="flex gap-2">
            <input
              type="number" min={0} max={10} placeholder="Min"
              value={filters.minTemperatureIndex ?? ''}
              onChange={(e) => update('minTemperatureIndex', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              type="number" min={0} max={10} placeholder="Max"
              value={filters.maxTemperatureIndex ?? ''}
              onChange={(e) => update('maxTemperatureIndex', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => onChange({})}
          className="w-full text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-1.5"
        >
          Clear filters
        </button>
      </div>
    </aside>
  );
}
