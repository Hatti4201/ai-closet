import { useEffect, useRef, useState } from 'react';
import { COLOR_FAMILIES } from '../utils/constants';

export const COLOR_SWATCHES: Record<string, string> = {
  Black: '#111827',
  White: '#ffffff',
  Gray: '#9ca3af',
  Blue: '#2563eb',
  Green: '#16a34a',
  Red: '#dc2626',
  Pink: '#ec4899',
  Purple: '#9333ea',
  Yellow: '#facc15',
  Orange: '#f97316',
  Brown: '#92400e',
  Beige: '#d6c3a5',
  Multi: 'linear-gradient(135deg, #ef4444 0 25%, #facc15 25% 50%, #22c55e 50% 75%, #3b82f6 75% 100%)',
  'Multi-color': 'linear-gradient(135deg, #ef4444 0 25%, #facc15 25% 50%, #22c55e 50% 75%, #3b82f6 75% 100%)',
};

interface Props {
  value: string;
  onChange: (value: string) => void;
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border ${color === 'White' ? 'border-gray-300' : 'border-black/10'}`}
      style={{ background: COLOR_SWATCHES[color] ?? COLOR_SWATCHES.Multi }}
    />
  );
}

export default function ColorFamilySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Swatch color={value} />
          <span className="truncate">{value}</span>
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          {COLOR_FAMILIES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm flex items-center gap-2 text-left hover:bg-gray-50 ${
                color === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <Swatch color={color} />
              <span>{color}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
