import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clothingApi, ImportedClothingDraft } from '../api/clothingApi';
import BatchImportCard from '../components/BatchImportCard';

export type QueueItemStatus = 'pending' | 'processing' | 'done' | 'error' | 'saved';

export interface QueueItem {
  id: string;
  url: string;
  status: QueueItemStatus;
  draft?: ImportedClothingDraft;
  error?: string;
}

const MAX_CONCURRENT = 2;

export default function BatchImportPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [batchText, setBatchText] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const dispatchedRef = useRef<Set<string>>(new Set());

  // Queue processor: keep MAX_CONCURRENT items running at all times
  useEffect(() => {
    const processingCount = queue.filter(q => q.status === 'processing').length;
    const pending = queue.filter(q => q.status === 'pending' && !dispatchedRef.current.has(q.id));
    const toStart = pending.slice(0, MAX_CONCURRENT - processingCount);
    if (toStart.length === 0) return;

    toStart.forEach(item => dispatchedRef.current.add(item.id));

    setQueue(prev => prev.map(q =>
      toStart.some(s => s.id === q.id) ? { ...q, status: 'processing' } : q
    ));

    toStart.forEach(item => {
      clothingApi.importUrl(item.url)
        .then(draft => setQueue(prev => prev.map(q =>
          q.id === item.id ? { ...q, status: 'done', draft } : q
        )))
        .catch(err => {
          const msg = (err as any)?.response?.data?.message ?? 'Could not import this link';
          setQueue(prev => prev.map(q =>
            q.id === item.id ? { ...q, status: 'error', error: msg } : q
          ));
        });
    });
  }, [queue]);

  const parseUrls = (raw: string) =>
    raw.split('\n').map(u => u.trim()).filter(u => /^https?:\/\//i.test(u));

  const enqueue = (urls: string[]) => {
    if (urls.length === 0) return;
    const items: QueueItem[] = urls.map(url => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url,
      status: 'pending',
    }));
    setQueue(prev => [...prev, ...items]);
  };

  const handleBatchAdd = () => {
    enqueue(parseUrls(batchText));
    setBatchText('');
  };

  const handleSingleAdd = () => {
    const url = singleUrl.trim();
    if (!url) return;
    enqueue([url]);
    setSingleUrl('');
  };

  const handleRetry = (id: string) => {
    dispatchedRef.current.delete(id);
    setQueue(prev => prev.map(q =>
      q.id === id ? { ...q, status: 'pending', error: undefined } : q
    ));
  };

  const handleRemove = (id: string) => {
    dispatchedRef.current.delete(id);
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const handleSaved = (id: string) =>
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'saved' } : q));

  const handleSaveAll = async () => {
    const ready = queue.filter(q => q.status === 'done' && q.draft);
    if (!ready.length) return;
    setSavingAll(true);
    await Promise.allSettled(
      ready.map(item =>
        clothingApi.createImported(item.draft!)
          .then(() => handleSaved(item.id))
          .catch(() => {})
      )
    );
    setSavingAll(false);
  };

  const counts = {
    processing: queue.filter(q => q.status === 'processing' || q.status === 'pending').length,
    done: queue.filter(q => q.status === 'done').length,
    saved: queue.filter(q => q.status === 'saved').length,
    error: queue.filter(q => q.status === 'error').length,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 mb-6">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Batch Import</h1>
          {queue.length > 0 && (
            <p className="text-sm text-gray-400 mt-1 space-x-2">
              {counts.processing > 0 && <span>{counts.processing} processing…</span>}
              {counts.done > 0 && <span className="text-blue-500">{counts.done} ready to save</span>}
              {counts.saved > 0 && <span className="text-green-600">{counts.saved} saved</span>}
              {counts.error > 0 && <span className="text-red-400">{counts.error} failed</span>}
            </p>
          )}
        </div>
        {counts.done > 0 && (
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 shrink-0"
          >
            {savingAll ? 'Saving…' : `Save All (${counts.done})`}
          </button>
        )}
      </div>

      {/* Input section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Paste multiple links <span className="font-normal text-gray-400">(one per line)</span>
          </label>
          <textarea
            value={batchText}
            onChange={e => setBatchText(e.target.value)}
            placeholder={"https://www.asos.com/product/...\nhttps://www.zara.com/product/...\nhttps://www.uniqlo.com/product/..."}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
          />
          <button
            onClick={handleBatchAdd}
            disabled={!batchText.trim()}
            className="mt-2 bg-gray-900 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-40"
          >
            Add to Queue
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or add one by one</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="flex gap-2">
          <input
            value={singleUrl}
            onChange={e => setSingleUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSingleAdd()}
            placeholder="https://..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSingleAdd}
            disabled={!singleUrl.trim()}
            className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>

      {/* Queue */}
      {queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map(item => (
            <BatchImportCard
              key={item.id}
              item={item}
              onRetry={handleRetry}
              onRemove={handleRemove}
              onSaved={handleSaved}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-300">
          <p className="text-5xl mb-3">🔗</p>
          <p className="text-sm">Paste product links above to start importing</p>
        </div>
      )}
    </div>
  );
}
