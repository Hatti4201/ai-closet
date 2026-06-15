import { useState, useEffect } from 'react';
import { recommendationApi } from '../api/recommendationApi';
import { membersApi, Member } from '../api/membersApi';
import { clothingApi } from '../api/clothingApi';
import { ClothingItem } from '../types/clothing';
import { RecommendationLook } from '../types/look';
import WeatherQuadrant from '../components/ai-panel/WeatherQuadrant';
import ScenarioSelector from '../components/ai-panel/ScenarioSelector';
import ColorComboSelector, { COLOR_COMBOS } from '../components/ai-panel/ColorComboSelector';
import VoicePromptInput from '../components/ai-panel/VoicePromptInput';
import RecommendationCard from '../components/ai-panel/RecommendationCard';

type View = 'panel' | 'loading' | 'results';

const PHASES = [
  { until: 3,        text: 'Reading your wardrobe…' },
  { until: 7,        text: 'Matching colors and styles…' },
  { until: 13,       text: 'Putting together 3 looks…' },
  { until: Infinity, text: 'Almost ready…' },
];

function buildPrompt(
  scenarios: string[],
  colorIdx: number,
  customPrompt: string
): string {
  const parts: string[] = [];
  if (scenarios.length > 0) parts.push(`Occasion: ${scenarios.join(', ')}.`);
  const combo = COLOR_COMBOS[colorIdx];
  parts.push(`Color preference: ${combo.colors[0]} and ${combo.colors[1]}.`);
  if (customPrompt.trim()) parts.push(customPrompt.trim());
  return parts.join(' ') || 'Suggest a casual everyday outfit.';
}

export default function HomeAIControlPanel() {
  const [view, setView] = useState<View>('panel');
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [colorIdx, setColorIdx] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [results, setResults] = useState<RecommendationLook[]>([]);
  const [itemMap, setItemMap] = useState<Map<string, ClothingItem>>(new Map());
  const [member, setMember] = useState<Member | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [prompt, setPrompt] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    membersApi.getAll().then((ms) => { if (ms[0]) setMember(ms[0]); }).catch(() => {});
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},  // permission denied or unavailable — weather falls back to season mock
    );
  }, []);

  // Live timer during loading
  useEffect(() => {
    if (view !== 'loading') { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [view]);

  const toggleScenario = (chip: string) =>
    setScenarios((prev) =>
      prev.includes(chip) ? prev.filter((s) => s !== chip) : [...prev, chip]
    );

  const handleGenerate = async () => {
    if (!member) { setError('No wardrobe members found.'); return; }
    setError('');
    setView('loading');
    try {
      const builtPrompt = buildPrompt(scenarios, colorIdx, customPrompt);
      setPrompt(builtPrompt);
      const [data, items] = await Promise.all([
        recommendationApi.generate(member.id, builtPrompt, coords ?? undefined),
        clothingApi.getAll({ memberId: member.id } as any),
      ]);
      const map = new Map<string, ClothingItem>();
      for (const item of (items as ClothingItem[])) map.set(item.id ?? item._id, item);
      setItemMap(map);
      setResults(data.looks);
      setView('results');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to generate looks. Make sure you have wardrobe items.');
      setView('panel');
    }
  };

  const phaseText = PHASES.find((p) => seconds < p.until)!.text;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-8 bg-gray-50">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-full bg-gray-900 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <div className="text-center">
          <p className="text-6xl font-light text-gray-900 tabular-nums leading-none">
            {seconds}
            <span className="text-2xl text-gray-400 ml-1">s</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">{phaseText}</p>
        </div>
        <p className="text-xs text-gray-400 max-w-xs text-center px-6 leading-relaxed">
          Styling your look for{' '}
          <span className="text-gray-600">
            {scenarios.length > 0 ? scenarios.join(', ') : 'your occasion'}
          </span>
          {customPrompt && ` — "${customPrompt}"`}
        </p>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (view === 'results') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setView('panel')}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 block"
              >
                ← Back to styling
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Your 3 Looks</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {scenarios.length > 0 ? scenarios.join(' · ') : 'AI Generated'}
                {' · '}
                {COLOR_COMBOS[colorIdx].colors.join(' + ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {results.map((look, i) => (
              <RecommendationCard
                key={i}
                look={look}
                index={i}
                itemMap={itemMap}
                memberId={member?.id ?? ''}
                prompt={prompt}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full relative grid grid-cols-2 grid-rows-2">
      {/* Quadrant dividers */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200 -translate-x-px pointer-events-none" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 -translate-y-px pointer-events-none" />

      {/* Four quadrants */}
      <WeatherQuadrant lat={coords?.lat ?? null} lon={coords?.lon ?? null} />
      <ScenarioSelector selected={scenarios} onToggle={toggleScenario} />
      <ColorComboSelector idx={colorIdx} onChange={setColorIdx} />
      <VoicePromptInput value={customPrompt} onChange={setCustomPrompt} />

      {/* Center Generate button */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <button
          onClick={handleGenerate}
          className="w-16 h-16 rounded-full bg-gray-900 text-white text-2xl shadow-xl
                     flex items-center justify-center
                     hover:scale-110 hover:shadow-2xl active:scale-95
                     transition-all duration-200 ring-4 ring-white"
          title="Generate outfit"
        >
          ✨
        </button>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl shadow-md max-w-sm text-center">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-600">×</button>
        </div>
      )}
    </div>
  );
}
