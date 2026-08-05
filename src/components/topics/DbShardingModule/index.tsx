import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { Layers, Database, ShieldCheck } from 'lucide-react';

export interface ShardNode {
  id: string;
  name: string;
  keyRange: string; // e.g. "0000 - 3999"
  recordCount: number;
  replicas: number;
  masterStatus: 'HEALTHY' | 'DEGRADED';
}

export const DbShardingModule: React.FC = () => {
  const [shardingStrategy, setShardingStrategy] = useState<'range' | 'hash'>('hash');
  const [shards, setShards] = useState<ShardNode[]>([
    { id: 'shard-0', name: 'Shard-0 (US-East)', keyRange: 'Hash(ID) % 4 == 0', recordCount: 1420, replicas: 2, masterStatus: 'HEALTHY' },
    { id: 'shard-1', name: 'Shard-1 (US-West)', keyRange: 'Hash(ID) % 4 == 1', recordCount: 1890, replicas: 2, masterStatus: 'HEALTHY' },
    { id: 'shard-2', name: 'Shard-2 (EU-Central)', keyRange: 'Hash(ID) % 4 == 2', recordCount: 1100, replicas: 2, masterStatus: 'HEALTHY' },
    { id: 'shard-3', name: 'Shard-3 (AP-South)', keyRange: 'Hash(ID) % 4 == 3', recordCount: 1650, replicas: 2, masterStatus: 'HEALTHY' },
  ]);

  const [queryIdInput, setQueryIdInput] = useState('');
  const [lastRouteResult, setLastRouteResult] = useState<string | null>(null);

  const handleRouteQuery = (customId?: string) => {
    const userId = customId || queryIdInput || `user_${Math.floor(Math.random() * 90000) + 10000}`;
    
    let targetShard = shards[0];
    if (shardingStrategy === 'hash') {
      let hash = 0;
      for (let i = 0; i < userId.length; i++) hash = (hash << 5) - hash + userId.charCodeAt(i);
      const idx = Math.abs(hash) % shards.length;
      targetShard = shards[idx];
    } else {
      // Range-based
      const numericId = parseInt(userId.replace(/\D/g, ''), 10) || 1000;
      const idx = numericId % shards.length;
      targetShard = shards[idx];
    }

    setShards((prev) =>
      prev.map((s) => (s.id === targetShard.id ? { ...s, recordCount: s.recordCount + 1 } : s))
    );

    setLastRouteResult(`Query "${userId}" routed to [${targetShard.name}]`);
    soundFx.playSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-pink-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-pink-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/50 text-pink-300 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Layers className="w-5 h-5 text-pink-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-pink-100 to-pink-400 bg-clip-text text-transparent">
                Database Sharding & Replication Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Test horizontal database sharding, Range vs Hash partitioning key routing, and primary-replica sync.
            </p>
          </div>

          {/* Strategy Pills */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-pink-500/30 shadow-inner">
            {(['hash', 'range'] as const).map((strat) => (
              <button
                key={strat}
                onClick={() => setShardingStrategy(strat)}
                className={`px-4 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                  shardingStrategy === strat
                    ? 'bg-pink-500/30 text-pink-200 border-pink-400 font-bold shadow-md shadow-pink-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                {strat === 'hash' ? 'Hash Sharding (Murmur3)' : 'Range Partitioning'}
              </button>
            ))}
          </div>
        </div>

        {/* Shard Routing Input & Output */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-pink-500/35 mb-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 w-full">
              <input
                type="text"
                placeholder="Enter User/Entity Key (e.g. user_88401)"
                value={queryIdInput}
                onChange={(e) => setQueryIdInput(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-white flex-1 focus:outline-none focus:border-pink-400"
              />
              <button
                onClick={() => handleRouteQuery()}
                className="btn-primary text-xs py-2 px-5 font-bold cursor-pointer"
              >
                Route & Write Record
              </button>
            </div>
          </div>

          {lastRouteResult && (
            <div className="p-3.5 rounded-xl bg-pink-950/40 border border-pink-500/40 text-pink-300 text-xs font-mono flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>{lastRouteResult}</span>
              </div>
              <span className="text-[10px] bg-pink-500/20 px-2 py-0.5 rounded border border-pink-400/40 font-bold uppercase">
                SHARD ALLOCATED ⚡
              </span>
            </div>
          )}
        </div>

        {/* Shards Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {shards.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-pink-500/40 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 text-pink-300 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/40">
                    🟢 MASTER ACTIVE
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-heading mb-1">{s.name}</h4>
                <p className="text-xs text-pink-300 font-mono mb-3 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">{s.keyRange}</p>

                <div className="space-y-2 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex justify-between">
                    <span>Records Stored:</span>
                    <strong className="text-white">{s.recordCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Read Replicas:</span>
                    <strong className="text-pink-300">{s.replicas} Replicas</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
