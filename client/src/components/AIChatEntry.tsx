import { useState, useEffect } from 'react';
import { recommendationApi } from '../api/recommendationApi';
import { membersApi } from '../api/membersApi';
import { RecommendationLook } from '../types/look';

interface Props {
  onLooksGenerated: (looks: RecommendationLook[]) => void;
}

const PHASES = [
  { until: 3,  text: 'Reading your wardrobe…' },
  { until: 7,  text: 'Matching colors and styles…' },
  { until: 13, text: 'Putting together 3 looks…' },
  { until: Infinity, text: 'Almost ready…' },
];

function getPhase(s: number) {
  return PHASES.find((p) => s < p.until)!.text;
}

export default function AIChatEntry({ onLooksGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [memberId, setMemberId] = useState('');

  useEffect(() => {
    membersApi.getAll()
      .then((members) => setMemberId(members[0]?.id ?? ''))
      .catch(() => setMemberId(''));
  }, []);

  // Count up every second while loading
  useEffect(() => {
    if (!loading) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError('');
    setLoading(true);
    try {
      if (!memberId) throw new Error('No wardrobe members found');
      const data = await recommendationApi.generate(memberId, prompt);
      onLooksGenerated(data.looks);
      setOpen(false);
      setPrompt('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || (err instanceof Error ? err.message : 'Failed to generate looks'));
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">

            {loading ? (
              /* ── Loading state ── */
              <div className="flex flex-col items-center justify-center px-6 py-12 gap-6">
                {/* Pulsing dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-gray-900 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>

                {/* Timer */}
                <div className="text-center">
                  <p className="text-4xl font-semibold text-gray-900 tabular-nums">
                    {seconds}
                    <span className="text-xl font-normal text-gray-400 ml-1">s</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{getPhase(seconds)}</p>
                </div>

                {/* Prompt reminder */}
                <p className="text-xs text-gray-400 text-center max-w-xs px-2">
                  "{prompt}"
                </p>
              </div>
            ) : (
              /* ── Input state ── */
              <div className="p-6">
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
                    disabled={!prompt.trim()}
                    className="bg-gray-900 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                  >
                    Generate
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
