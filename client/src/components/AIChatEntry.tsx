import { useState } from 'react';
import { recommendationApi } from '../api/recommendationApi';
import { UnsavedLook } from '../types/look';

interface Props {
  onLooksGenerated: (looks: UnsavedLook[]) => void;
}

export default function AIChatEntry({ onLooksGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await recommendationApi.generate(prompt);
      onLooksGenerated(data.looks);
      setOpen(false);
      setPrompt('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to generate looks');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    'I need a casual outfit for a warm day.',
    'Give me a clean and simple outfit for a date.',
    'I want a sporty look.',
    'Something for church.',
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-gray-700 transition-colors z-40"
        title="Ask AI Stylist"
      >
        ✨
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center pb-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">AI Stylist</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Tell me what kind of outfit you need today.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 hover:bg-gray-50"
                >
                  {ex}
                </button>
              ))}
            </div>
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I need a casual outfit for a warm day"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? '...' : 'Generate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
