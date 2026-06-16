import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

type Phase = 'idle' | 'listening' | 'typing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionCtor: (new () => any) | undefined =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export default function VoicePromptInput({ value, onChange }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState(value);
  const [liveText, setLiveText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!value) { setDraft(''); setPhase('idle'); }
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const startListening = () => {
    if (!SpeechRecognitionCtor) {
      // Fallback: skip straight to manual typing
      setDraft(value);
      setPhase('typing');
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || 'zh-CN';

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      setLiveText(final + interim);
    };

    rec.onend = () => {
      // Recognition stopped (natural pause or user clicked stop)
      const currentText = liveTextRef.current.trim();
      setDraft(currentText || value);
      setLiveText('');
      setPhase('typing');
      setTimeout(() => textareaRef.current?.focus(), 50);
    };

    rec.onerror = () => {
      setLiveText('');
      setDraft(value);
      setPhase('typing');
      setTimeout(() => textareaRef.current?.focus(), 50);
    };

    recognitionRef.current = rec;
    setLiveText('');
    setPhase('listening');
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  };

  // Keep a ref to liveText so onend closure can read the latest value
  const liveTextRef = useRef('');
  useEffect(() => { liveTextRef.current = liveText; }, [liveText]);

  const handleMicClick = () => {
    if (phase === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleConfirm = () => {
    onChange(draft.trim());
    setPhase('idle');
  };

  const handleClear = () => {
    setDraft('');
    onChange('');
    setPhase('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirm(); }
    if (e.key === 'Escape') { setDraft(value); setPhase('idle'); }
  };

  return (
    <div className="flex flex-col px-6 py-5 bg-white overflow-hidden">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 shrink-0">
        Add Prompt
      </p>

      {/* ── IDLE: mic button ── */}
      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <button
            onClick={handleMicClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl
                        transition-all duration-200 border shadow-sm
                        hover:scale-105 active:scale-95 ${
              value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-500 hover:text-gray-700'
            }`}
          >
            🎤
          </button>
          {value ? (
            <p className="text-xs text-gray-600 text-center leading-relaxed px-2 line-clamp-3">
              "{value}"
            </p>
          ) : (
            <p className="text-xs text-gray-300">Tap to describe</p>
          )}
        </div>
      )}

      {/* ── LISTENING: real-time transcript + stop button ── */}
      {phase === 'listening' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <button
            onClick={handleMicClick}
            className="relative flex items-center justify-center"
            title="Tap to stop"
          >
            <span className="absolute w-16 h-16 rounded-full bg-red-400/20 animate-ping" />
            <span className="absolute w-12 h-12 rounded-full bg-red-400/25 animate-ping"
                  style={{ animationDelay: '0.2s' }} />
            <div className="relative w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-lg z-10">
              🎤
            </div>
          </button>
          {liveText ? (
            <p className="text-xs text-gray-600 text-center leading-relaxed px-2 line-clamp-4">
              {liveText}
            </p>
          ) : (
            <p className="text-xs text-gray-400 animate-pulse">Listening…</p>
          )}
          <p className="text-xs text-gray-300">Tap to stop</p>
        </div>
      )}

      {/* ── TYPING: editable textarea ── */}
      {phase === 'typing' && (
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Something relaxed but stylish for a casual dinner…"
            className="flex-1 w-full resize-none rounded-xl border border-gray-200
                       px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300
                       focus:outline-none focus:ring-2 focus:ring-gray-900
                       leading-relaxed"
            rows={3}
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-gray-900 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-gray-700 transition-colors"
            >
              Done ↵
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
