const CHIPS = ['Casual', 'Work', 'Date', 'Party', 'Outdoor', 'Formal', 'Home', 'Sport'];

interface Props {
  selected: string[];
  onToggle: (chip: string) => void;
}

export default function ScenarioSelector({ selected, onToggle }: Props) {
  return (
    <div className="flex flex-col justify-center px-8 py-6 bg-white border-b border-gray-200">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Occasion</p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const active = selected.includes(chip);
          return (
            <button
              key={chip}
              onClick={() => onToggle(chip)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                active
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-gray-300 mt-3">Select one or more occasions</p>
      )}
    </div>
  );
}
