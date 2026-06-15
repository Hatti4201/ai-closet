import { useEffect, useState } from 'react';
import { contextApi, ContextInfo } from '../../api/contextApi';

interface Props {
  lat: number | null;
  lon: number | null;
}

const CONDITION_ICON: Record<string, string> = {
  sunny: '☀️',
  'partly cloudy': '⛅',
  cloudy: '☁️',
  foggy: '🌫️',
  rain: '🌧️',
  'rain showers': '🌦️',
  snow: '❄️',
  stormy: '⛈️',
  windy: '💨',
};

function cToF(c: number) { return Math.round(c * 9 / 5 + 32); }

export default function WeatherQuadrant({ lat, lon }: Props) {
  const [ctx, setCtx] = useState<ContextInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lon == null) return;
    setLoading(true);
    contextApi.get(lat, lon)
      .then(setCtx)
      .finally(() => setLoading(false));
  }, [lat, lon]);

  const condition = ctx?.weather.condition ?? '';
  const icon = CONDITION_ICON[condition] ?? '🌡️';
  const tempF = ctx ? cToF(ctx.weather.tempC) : null;

  return (
    <div className="flex flex-col justify-center px-8 py-6 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-r border-gray-200">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Weather</p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="animate-pulse">Fetching…</span>
        </div>
      ) : ctx ? (
        <>
          <div className="flex items-end gap-3">
            <span className="text-5xl">{icon}</span>
            <div>
              <p className="text-4xl font-light text-gray-900 leading-none">{tempF}°F</p>
              <p className="text-sm text-gray-500 mt-1 capitalize">{condition}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{ctx.season} · {ctx.date}</p>
        </>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <span className="text-5xl">🌡️</span>
            <div>
              <p className="text-sm text-gray-400 mt-1">Allow location for real weather</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
