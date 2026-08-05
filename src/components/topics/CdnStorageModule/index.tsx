import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { Cloud, Globe } from 'lucide-react';

export const CdnStorageModule: React.FC = () => {
  const [edgePops] = useState([
    { region: 'US-East (N. Virginia)', cacheHitRatio: '98.4%', latencyMs: 8 },
    { region: 'EU-West (Frankfurt)', cacheHitRatio: '96.1%', latencyMs: 14 },
    { region: 'AP-South (Mumbai)', cacheHitRatio: '94.8%', latencyMs: 22 },
  ]);

  const [originObjects, setOriginObjects] = useState([
    { key: 'static/hero-banner.jpg', size: '2.4 MB', popCached: true },
    { key: 'assets/app-bundle.js', size: '1.1 MB', popCached: true },
    { key: 'media/video-hd.mp4', size: '48.0 MB', popCached: false },
  ]);

  const [fetchLog, setFetchLog] = useState<string | null>(null);

  const handleFetchAsset = (key: string) => {
    const obj = originObjects.find((o) => o.key === key);
    if (obj?.popCached) {
      setFetchLog(`⚡ Edge PoP HIT: Delivered "${key}" from closest Edge Node (Latency: 9ms)`);
      soundFx.playSuccess();
    } else {
      setFetchLog(`🐢 Edge PoP MISS: Origin Shield fetch from S3 Object Bucket "${key}" (Latency: 140ms)`);
      setOriginObjects((prev) =>
        prev.map((o) => (o.key === key ? { ...o, popCached: true } : o))
      );
      soundFx.playBlocked();
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-sky-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-sky-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 text-sky-300 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Cloud className="w-5 h-5 text-sky-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-sky-100 to-sky-400 bg-clip-text text-transparent">
                CDN Edge PoP & Object Store Simulator (Cloudflare / S3)
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Test Edge Point-of-Presence caching, Origin Shield protection, and Multipart chunk object storage.
            </p>
          </div>
        </div>

        {fetchLog && (
          <div className="mb-6 p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/40 text-sky-300 text-xs font-mono flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{fetchLog}</span>
            </div>
          </div>
        )}

        {/* Edge PoPs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {edgePops.map((pop) => (
            <div key={pop.region} className="p-4 bg-slate-900/90 rounded-2xl border border-sky-500/35 shadow-xl font-mono text-xs space-y-2">
              <div className="text-white font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" /> {pop.region}
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Hit Ratio:</span>
                <strong className="text-emerald-400">{pop.cacheHitRatio}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Avg Latency:</span>
                <strong className="text-sky-300">{pop.latencyMs} ms</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Object Assets Table */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/35 shadow-xl font-mono text-xs">
          <div className="text-sky-300 font-bold font-heading text-sm mb-3.5 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>S3 Origin Bucket Objects</span>
            <span className="text-slate-400 text-xs font-normal">Edge Cache Status</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">OBJECT KEY</th>
                  <th className="p-3">FILE SIZE</th>
                  <th className="p-3">EDGE CACHE STATUS</th>
                  <th className="p-3 text-right font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {originObjects.map((obj) => (
                  <tr key={obj.key} className="border-b border-slate-900 hover:bg-slate-900/60">
                    <td className="p-3 text-cyan-300 font-bold">{obj.key}</td>
                    <td className="p-3 text-slate-300">{obj.size}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${obj.popCached ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'}`}>
                        {obj.popCached ? '⚡ CACHED AT EDGE' : '🐢 ORIGIN ONLY'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleFetchAsset(obj.key)} className="btn-primary text-xs py-1.5 px-3 font-bold cursor-pointer">
                        Request Asset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
