const MOCK = { tempF: 72, condition: 'Sunny', icon: '☀️', location: 'Fremont' };

export default function WeatherQuadrant() {
  return (
    <div className="flex flex-col justify-center px-8 py-6 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-r border-gray-200">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Weather</p>
      <div className="flex items-end gap-3">
        <span className="text-5xl">{MOCK.icon}</span>
        <div>
          <p className="text-4xl font-light text-gray-900 leading-none">{MOCK.tempF}°F</p>
          <p className="text-sm text-gray-500 mt-1">{MOCK.condition}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <span>📍</span>{MOCK.location}
      </p>
    </div>
  );
}
