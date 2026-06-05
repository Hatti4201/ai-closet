import { useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function VoicePromptInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const confirm = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    setDraft('');
    onChange('');
    setOpen(false);
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center px-8 py-6 bg-white">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 self-start">Add Prompt</p>

        <button
          onClick={() => { setDraft(value); setOpen(true); }}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-sm border ${
            value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600'
          }`}
          title="Add custom prompt"
        >
          🎤
        </button>

        {value ? (
          <p className="mt-3 text-xs text-gray-500 text-center max-w-[160px] line-clamp-2 leading-relaxed">
            "{value}"
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-300 text-center">Tap to describe</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Add your own prompt</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Describe anything extra — a mood, event detail, or style preference.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. I want something comfortable but still looks good for a casual dinner."
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              {value && (
                <button onClick={clear} className="px-4 py-2 text-sm text-gray-400 hover:text-red-400">
                  Clear
                </button>
              )}
              <button
                onClick={confirm}
                className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
