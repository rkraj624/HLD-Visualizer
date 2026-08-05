import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { Database } from 'lucide-react';

export const CachingModule: React.FC = () => {
  const [cacheItems, setCacheItems] = useState<Array<{ key: string; val: string; ttl: number; hits: number }>>([
    { key: 'user:1001', val: '{ name: "Alice", role: "Admin" }', ttl: 45, hits: 12 },
    { key: 'product:99', val: '{ title: "MacBook Pro", price: 1999 }', ttl: 120, hits: 45 },
    { key: 'session:token_abc', val: '{ userId: 1001, exp: 3600 }', ttl: 15, hits: 8 },
  ]);
  const [cacheHits, setCacheHits] = useState(38);
  const [cacheMisses, setCacheMisses] = useState(6);
  const [lastCacheStatus, setLastCacheStatus] = useState<'HIT' | 'MISS' | null>(null);

  const handleCacheLookup = (queryKey: string) => {
    const found = cacheItems.find((item) => item.key === queryKey);
    if (found) {
      setLastCacheStatus('HIT');
      setCacheHits((h) => h + 1);
      setCacheItems((prev) =>
        prev.map((item) => (item.key === queryKey ? { ...item, hits: item.hits + 1 } : item))
      );
      soundFx.playSuccess();
    } else {
      setLastCacheStatus('MISS');
      setCacheMisses((m) => m + 1);
      const newItem = { key: queryKey, val: `{ data: "DB_RECORD_${Math.floor(Math.random() * 900) + 100}" }`, ttl: 60, hits: 1 };
      setCacheItems((prev) => [newItem, ...prev.slice(0, 4)]);
      soundFx.playBlocked();
    }
  };

  return (
    <div className="glass-panel p-6 border-emerald-500/30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" /> Distributed Cache Simulator (LRU Eviction)
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            Inspect Cache Hits vs Misses, TTL expirations, and Cache-Aside lookup patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCacheLookup('user:1001')}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Query "user:1001"
          </button>
          <button
            onClick={() => handleCacheLookup(`random:${Math.floor(Math.random() * 500)}`)}
            className="btn-primary text-xs px-3 py-1.5"
          >
            Simulate DB Miss
          </button>
        </div>
      </div>

      {/* Cache Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black/60 p-4 rounded-xl border border-white/10">
          <span className="text-xs text-gray-400 block font-mono">CACHE HITS</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{cacheHits}</span>
        </div>
        <div className="bg-black/60 p-4 rounded-xl border border-white/10">
          <span className="text-xs text-gray-400 block font-mono">CACHE MISSES</span>
          <span className="text-2xl font-bold font-mono text-rose-400">{cacheMisses}</span>
        </div>
        <div className="bg-black/60 p-4 rounded-xl border border-white/10">
          <span className="text-xs text-gray-400 block font-mono">HIT RATIO</span>
          <span className="text-2xl font-bold font-mono text-cyan-300">
            {((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="bg-black/60 p-4 rounded-xl border border-white/10">
          <span className="text-xs text-gray-400 block font-mono">LAST STATUS</span>
          <span className={`text-xl font-bold font-mono ${lastCacheStatus === 'HIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {lastCacheStatus || 'READY'}
          </span>
        </div>
      </div>

      {/* Cache Memory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="p-3">KEY</th>
              <th className="p-3">CACHED VALUE</th>
              <th className="p-3">TTL (s)</th>
              <th className="p-3">HITS</th>
            </tr>
          </thead>
          <tbody>
            {cacheItems.map((item) => (
              <tr key={item.key} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 text-cyan-300 font-bold">{item.key}</td>
                <td className="p-3 text-gray-300 truncate max-w-xs">{item.val}</td>
                <td className="p-3 text-amber-400">{item.ttl}s</td>
                <td className="p-3 text-emerald-400 font-bold">{item.hits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
