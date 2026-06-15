import { useEffect, useRef, useState } from 'react';
import { COLOR_FAMILIES } from '../../utils/constants';
import { COLOR_SWATCHES } from '../ColorFamilySelect';

export const COLOR_COMBOS: { colors: [string, string]; hex: [string, string] }[] = [
  { colors: ['Blue', 'White'],   hex: ['#3B82F6', '#F9FAFB'] },
  { colors: ['Black', 'Gray'],   hex: ['#111827', '#9CA3AF'] },
  { colors: ['Beige', 'Brown'],  hex: ['#D4B896', '#92400E'] },
  { colors: ['Pink', 'White'],   hex: ['#EC4899', '#F9FAFB'] },
  { colors: ['Green', 'Beige'],  hex: ['#16A34A', '#D4B896'] },
  { colors: ['Navy', 'Cream'],   hex: ['#1E3A8A', '#FFF8DC'] },
];

interface Props {
  idx: number;
  onChange: (idx: number) => void;
  overrides: [string | null, string | null];
  onOverrideChange: (slot: number, color: string | null) => void;
}

export default function ColorComboSelector({ idx, onChange, overrides, onOverrideChange }: Props) {
  const combo = COLOR_COMBOS[idx];
  const prev = () => onChange((idx - 1 + COLOR_COMBOS.length) % COLOR_COMBOS.length);
  const next = () => onChange((idx + 1) % COLOR_COMBOS.length);
  const [pickerOpen, setPickerOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setPickerOpen(null);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const colorAt = (i: number) => overrides[i] ?? combo.colors[i];
  const hexAt = (i: number) => COLOR_SWATCHES[colorAt(i)] ?? combo.hex[i];

  return (
    <div className="flex flex-col justify-center px-8 py-6 bg-gray-50 border-r border-gray-200">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Color Combo</p>

      <div className="flex items-center gap-3">
        <button onClick={prev} className="text-gray-300 hover:text-gray-600 text-xl leading-none select-none">‹</button>

        <div ref={ref} className="flex gap-2 flex-1">
          {[0, 1].map((i) => (
            <div key={i} className="relative flex-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(pickerOpen === i ? null : i)}
                className="w-full rounded-xl border border-gray-200 shadow-sm hover:ring-2 hover:ring-blue-300 transition-shadow"
                style={{ background: hexAt(i), height: '52px' }}
                title="Click to change color"
              />
              <span className="text-xs text-gray-500 font-medium">{colorAt(i)}</span>

              {pickerOpen === i && (
                <div className="absolute top-full mt-1 z-30 w-40 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                  {COLOR_FAMILIES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        onOverrideChange(i, color);
                        setPickerOpen(null);
                      }}
                      className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 text-left hover:bg-gray-50 ${
                        color === colorAt(i) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block w-4 h-4 rounded-full border ${color === 'White' ? 'border-gray-300' : 'border-black/10'}`}
                        style={{ background: COLOR_SWATCHES[color] ?? COLOR_SWATCHES.Multi }}
                      />
                      <span>{color}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={next} className="text-gray-300 hover:text-gray-600 text-xl leading-none select-none">›</button>
      </div>

      <div className="flex justify-center gap-1 mt-3">
        {COLOR_COMBOS.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-gray-700' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}
