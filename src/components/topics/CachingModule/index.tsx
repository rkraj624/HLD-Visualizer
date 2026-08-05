import React, { useState, useEffect } from 'react';
import { soundFx } from '../../../utils/audio';
import { Database, Trash2, Sparkles, Activity } from 'lucide-react';

export type CachePattern = 'cache-aside' | 'write-through' | 'write-back';
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo';

export interface CacheItem {
  key: string;
  val: string;
  ttl: number; // in seconds
  hits: number;
  lastAccessed: number;
  createdOrder: number;
}

export const CachingModule: React.FC = () => {
  const [pattern, setPattern] = useState<CachePattern>('cache-aside');
  const [evictionPolicy, setEvictionPolicy] = useState<EvictionPolicy>('lru');
  const [capacity, setCapacity] = useState<number>(5);

  const [cacheItems, setCacheItems] = useState<CacheItem[]>([
    { key: 'user:1001', val: '{ name: "Alice", role: "Admin" }', ttl: 45, hits: 12, lastAccessed: Date.now() - 5000, createdOrder: 1 },
    { key: 'product:99', val: '{ title: "MacBook Pro", price: 1999 }', ttl: 120, hits: 45, lastAccessed: Date.now() - 15000, createdOrder: 2 },
    { key: 'session:token_abc', val: '{ userId: 1001, exp: 3600 }', ttl: 15, hits: 8, lastAccessed: Date.now() - 2000, createdOrder: 3 },
  ]);

  const [dbItems, setDbItems] = useState<Record<string, string>>({
    'user:1001': '{ name: "Alice", role: "Admin" }',
    'product:99': '{ title: "MacBook Pro", price: 1999 }',
    'session:token_abc': '{ userId: 1001, exp: 3600 }',
    'user:1002': '{ name: "Bob", role: "User" }',
    'product:100': '{ title: "Dell XPS", price: 1499 }',
  });

  const [cacheHits, setCacheHits] = useState(38);
  const [cacheMisses, setCacheMisses] = useState(6);
  const [lastStatus, setLastStatus] = useState<'HIT' | 'MISS' | 'EVICTED' | 'WRITE' | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [customValInput, setCustomValInput] = useState('');
  const [autoTtlCountdown, setAutoTtlCountdown] = useState(true);
  const [counter, setCounter] = useState(4);

  // Live TTL Countdown effect
  useEffect(() => {
    if (!autoTtlCountdown) return;
    const timer = setInterval(() => {
      setCacheItems((prev) =>
        prev
          .map((item) => ({ ...item, ttl: Math.max(0, item.ttl - 1) }))
          .filter((item) => item.ttl > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [autoTtlCountdown]);

  // Evict item according to policy
  const evictItem = (items: CacheItem[]): CacheItem[] => {
    if (items.length < capacity) return items;
    let targetKey = items[0].key;

    if (evictionPolicy === 'lru') {
      // Least Recently Accessed
      let oldest = Infinity;
      items.forEach((item) => {
        if (item.lastAccessed < oldest) {
          oldest = item.lastAccessed;
          targetKey = item.key;
        }
      });
    } else if (evictionPolicy === 'lfu') {
      // Least Frequently Used
      let minHits = Infinity;
      items.forEach((item) => {
        if (item.hits < minHits) {
          minHits = item.hits;
          targetKey = item.key;
        }
      });
    } else if (evictionPolicy === 'fifo') {
      // First In First Out
      let minOrder = Infinity;
      items.forEach((item) => {
        if (item.createdOrder < minOrder) {
          minOrder = item.createdOrder;
          targetKey = item.key;
        }
      });
    }

    setLastStatus('EVICTED');
    return items.filter((item) => item.key !== targetKey);
  };

  // Handle Query Lookup
  const handleQuery = (keyToQuery?: string) => {
    const key = keyToQuery || customKeyInput || 'user:1001';
    const now = Date.now();

    const existingIndex = cacheItems.findIndex((item) => item.key === key);

    if (existingIndex !== -1) {
      // CACHE HIT
      setCacheHits((h) => h + 1);
      setLastStatus('HIT');
      soundFx.playSuccess();

      setCacheItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, hits: item.hits + 1, lastAccessed: now }
            : item
        )
      );
    } else {
      // CACHE MISS
      setCacheMisses((m) => m + 1);
      setLastStatus('MISS');
      soundFx.playBlocked();

      const dbVal = dbItems[key] || `{ id: "${key}", data: "Record from DB" }`;
      const newItem: CacheItem = {
        key,
        val: dbVal,
        ttl: 60,
        hits: 1,
        lastAccessed: now,
        createdOrder: counter,
      };
      setCounter((c) => c + 1);

      setCacheItems((prev) => {
        const evicted = evictItem(prev);
        return [newItem, ...evicted];
      });

      // Write-Through / Cache-Aside DB update sync
      if (!dbItems[key]) {
        setDbItems((prev) => ({ ...prev, [key]: dbVal }));
      }
    }
  };

  // Handle Write Request
  const handleWrite = () => {
    const key = customKeyInput || `item:${Math.floor(Math.random() * 900) + 100}`;
    const val = customValInput || `{ updated: "${new Date().toLocaleTimeString()}" }`;
    const now = Date.now();

    setLastStatus('WRITE');

    if (pattern === 'cache-aside') {
      // Write to DB first, invalidate cache
      setDbItems((prev) => ({ ...prev, [key]: val }));
      setCacheItems((prev) => prev.filter((item) => item.key !== key));
    } else if (pattern === 'write-through') {
      // Write synchronously to both Cache and DB
      setDbItems((prev) => ({ ...prev, [key]: val }));
      const newItem: CacheItem = {
        key,
        val,
        ttl: 60,
        hits: 1,
        lastAccessed: now,
        createdOrder: counter,
      };
      setCounter((c) => c + 1);
      setCacheItems((prev) => [newItem, ...evictItem(prev.filter((i) => i.key !== key))]);
    } else if (pattern === 'write-back') {
      // Write to Cache immediately, async flush to DB later
      const newItem: CacheItem = {
        key,
        val,
        ttl: 60,
        hits: 1,
        lastAccessed: now,
        createdOrder: counter,
      };
      setCounter((c) => c + 1);
      setCacheItems((prev) => [newItem, ...evictItem(prev.filter((i) => i.key !== key))]);

      setTimeout(() => {
        setDbItems((prev) => ({ ...prev, [key]: val }));
      }, 3000);
    }

    soundFx.playSuccess();
  };

  const handleEvictManual = (key: string) => {
    setCacheItems((prev) => prev.filter((item) => item.key !== key));
  };

  const totalReqs = cacheHits + cacheMisses;
  const hitRatio = totalReqs > 0 ? ((cacheHits / totalReqs) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-emerald-500/30 bg-slate-950/85 shadow-2xl">
        {/* Module Header & Control Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-emerald-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Database className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                Distributed Cache & Eviction Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Test Cache-Aside, Write-Through, Write-Back patterns with live LRU / LFU / FIFO eviction & TTL decay.
            </p>
          </div>

          {/* Pattern Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-emerald-500/30 shadow-inner">
            {[
              { id: 'cache-aside', label: 'Cache-Aside' },
              { id: 'write-through', label: 'Write-Through' },
              { id: 'write-back', label: 'Write-Back (Lazy)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPattern(p.id as CachePattern)}
                className={`px-4 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                  pattern === p.id
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Explanation & Eviction Policy Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/35 text-xs font-mono text-slate-200 flex items-start gap-3.5 shadow-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold text-white text-sm mb-1.5 flex items-center gap-2.5">
                <span className="text-emerald-300 font-extrabold uppercase tracking-wide">Pattern: {pattern}</span>
                <span className="text-[10px] text-emerald-200 bg-emerald-500/25 px-3 py-1 rounded-full border border-emerald-400/40 font-bold uppercase tracking-wider">
                  Active Mode
                </span>
              </div>
              <p className="text-xs text-slate-200 font-normal leading-relaxed">
                {pattern === 'cache-aside' && 'Application queries cache first. On miss, fetches from DB and populates cache manually. Writes invalidate cache.'}
                {pattern === 'write-through' && 'Synchronously updates cache and backend database in one transaction. Guarantees strict consistency.'}
                {pattern === 'write-back' && 'Writes instantly to RAM cache and acknowledges client. Async worker flushes dirty cache entries to DB later.'}
              </p>
            </div>
          </div>

          {/* Eviction Policy & Capacity Tuner */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-emerald-500/35 flex flex-col justify-between gap-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-200 uppercase tracking-wider font-heading">Eviction Policy</span>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                {(['lru', 'lfu', 'fifo'] as EvictionPolicy[]).map((policy) => (
                  <button
                    key={policy}
                    onClick={() => setEvictionPolicy(policy)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded cursor-pointer ${
                      evictionPolicy === policy
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {policy}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-300 font-semibold">Max Capacity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCapacity((c) => Math.max(3, c - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="text-emerald-300 font-extrabold text-xs px-1.5">{capacity} Items</span>
                <button
                  onClick={() => setCapacity((c) => Math.min(10, c + 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-emerald-500/30 shadow-lg">
            <span className="text-xs text-slate-300 block font-mono font-semibold uppercase">CACHE HITS</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">{cacheHits}</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-rose-500/30 shadow-lg">
            <span className="text-xs text-slate-300 block font-mono font-semibold uppercase">CACHE MISSES</span>
            <span className="text-2xl font-extrabold font-mono text-rose-400">{cacheMisses}</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-cyan-500/30 shadow-lg">
            <span className="text-xs text-slate-300 block font-mono font-semibold uppercase">HIT RATIO</span>
            <span className="text-2xl font-extrabold font-mono text-cyan-300">{hitRatio}%</span>
          </div>
          <div className="bg-slate-900/90 p-4 rounded-xl border border-amber-500/30 shadow-lg">
            <span className="text-xs text-slate-300 block font-mono font-semibold uppercase">LAST ACTION</span>
            <span className={`text-lg font-extrabold font-mono ${
              lastStatus === 'HIT' ? 'text-emerald-400' : lastStatus === 'MISS' ? 'text-rose-400' : 'text-amber-300'
            }`}>
              {lastStatus || 'READY'}
            </span>
          </div>
        </div>

        {/* Interactive Query & Write Terminal Controls */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/35 mb-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <span className="text-xs font-mono text-emerald-200 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Interactive Key Query & Write Panel:
            </span>
            <div className="flex items-center gap-2">
              {['user:1001', 'product:99', 'user:1002', 'session:token_abc'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleQuery(k)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white cursor-pointer transition-all"
                >
                  Query "{k}"
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Key (e.g. user:1005)"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
            />
            <input
              type="text"
              placeholder="Value (e.g. { role: 'Editor' })"
              value={customValInput}
              onChange={(e) => setCustomValInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuery()}
                className="btn-primary text-xs flex-1 py-2 px-3 justify-center font-bold cursor-pointer"
              >
                Read (GET)
              </button>
              <button
                onClick={() => handleWrite()}
                className="btn-secondary text-xs text-amber-300 bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 py-2 px-3 font-bold cursor-pointer"
              >
                Write (PUT)
              </button>
            </div>
          </div>
        </div>

        {/* Live Cache Storage & DB Mirror Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* In-Memory RAM Cache Table */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold font-heading text-base tracking-wide">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <Database className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span>In-Memory RAM Cache</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/50">
                    ({cacheItems.length}/{capacity})
                  </span>
                </div>
                <button
                  onClick={() => setAutoTtlCountdown(!autoTtlCountdown)}
                  className={`text-xs font-mono px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer font-semibold ${
                    autoTtlCountdown
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {autoTtlCountdown ? '🟢 TTL Active' : '⏸️ TTL Paused'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/90 text-slate-400 uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-3 w-1/4">KEY</th>
                      <th className="py-3 px-3 w-2/5">VALUE</th>
                      <th className="py-3 px-3 text-center">TTL</th>
                      <th className="py-3 px-3 text-center">HITS</th>
                      <th className="py-3 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cacheItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-slate-500 italic text-center font-sans">
                          Cache memory is currently empty. Execute a GET query or PUT write to populate.
                        </td>
                      </tr>
                    ) : (
                      cacheItems.map((item) => (
                        <tr key={item.key} className="border-b border-slate-900/80 hover:bg-slate-900/70 transition-colors">
                          <td className="py-3.5 px-3 text-emerald-300 font-bold tracking-tight">{item.key}</td>
                          <td className="py-3.5 px-3 text-slate-200 truncate max-w-[180px]" title={item.val}>{item.val}</td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 font-bold">
                              {item.ttl}s
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-500/30 font-bold">
                              {item.hits}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleEvictManual(item.key)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 border border-slate-700/80 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Evict key"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Primary Database Storage Mirror */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-2xl font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="text-slate-200 font-bold font-heading text-base mb-5 border-b border-slate-800/80 pb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" /> Primary Storage DB
                </span>
                <span className="text-[10px] text-cyan-300 bg-cyan-500/15 px-3 py-1 rounded-full border border-cyan-500/40 font-bold uppercase tracking-wider">
                  Persistent Disk
                </span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {Object.entries(dbItems).map(([k, v]) => (
                  <div key={k} className="p-3.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800/90 flex flex-col gap-1 transition-all">
                    <div className="text-cyan-300 font-bold text-xs flex items-center justify-between">
                      <span>{k}</span>
                      <span className="text-[10px] text-slate-400 font-normal">DB Record</span>
                    </div>
                    <div className="text-slate-300 text-[11px] truncate font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800/60" title={v}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
