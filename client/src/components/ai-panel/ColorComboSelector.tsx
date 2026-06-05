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
}

export default function ColorComboSelector({ idx, onChange }: Props) {
  const combo = COLOR_COMBOS[idx];
  const prev = () => onChange((idx - 1 + COLOR_COMBOS.length) % COLOR_COMBOS.length);
  const next = () => onChange((idx + 1) % COLOR_COMBOS.length);

  return (
    <div className="flex flex-col justify-center px-8 py-6 bg-gray-50 border-r border-gray-200">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Color Combo</p>

      <div className="flex items-center gap-3">
        <button onClick={prev} className="text-gray-300 hover:text-gray-600 text-xl leading-none select-none">‹</button>

        <div className="flex gap-2 flex-1">
          {combo.hex.map((hex, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-xl border border-gray-200 shadow-sm"
                style={{ backgroundColor: hex, height: '52px' }}
              />
              <span className="text-xs text-gray-500 font-medium">{combo.colors[i]}</span>
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
