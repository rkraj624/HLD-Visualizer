import React from 'react';
import type { AlgorithmType } from '../types';
import { ALGORITHMS } from '../utils/constants';
import { ShieldCheck, Zap, Database, Clock, Layers, Sparkles } from 'lucide-react';

interface AlgorithmSelectorProps {
  selected: AlgorithmType;
  onSelect: (algorithm: AlgorithmType) => void;
}

const ICON_MAP: Record<AlgorithmType, React.ReactNode> = {
  'token-bucket': <Zap className="w-5 h-5 text-blue-400" />,
  'leaky-bucket': <Database className="w-5 h-5 text-cyan-400" />,
  'fixed-window': <Clock className="w-5 h-5 text-amber-400" />,
  'sliding-window-log': <Layers className="w-5 h-5 text-pink-400" />,
  'sliding-window-counter': <ShieldCheck className="w-5 h-5 text-emerald-400" />,
};

export const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {Object.values(ALGORITHMS).map((algo) => {
        const isSelected = selected === algo.id;
        return (
          <button
            key={algo.id}
            onClick={() => onSelect(algo.id)}
            className={`glass-panel p-5 text-left transition-all relative overflow-hidden group cursor-pointer ${
              isSelected
                ? 'border-2 shadow-xl scale-[1.02]'
                : 'hover:border-white-20 opacity-85 hover:opacity-100'
            }`}
            style={{
              borderColor: isSelected ? algo.accentColor : 'rgba(255, 255, 255, 0.1)',
              boxShadow: isSelected ? `0 0 25px ${algo.bgGlow}` : 'none',
            }}
          >
            {/* Top Glowing Active Line */}
            {isSelected && (
              <div
                className="absolute top-0 inset-x-0 h-1"
                style={{ backgroundColor: algo.accentColor }}
              />
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2-5 rounded-xl bg-white-5 border border-white-10 group-hover:scale-110 transition-transform">
                {ICON_MAP[algo.id]}
              </div>
              <h3 className="text-sm font-bold text-white tracking-tight font-heading">{algo.name}</h3>
            </div>

            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-4">
              {algo.tagline}
            </p>

            {/* Feature Pills: Spacious padding and gap */}
            <div className="flex flex-wrap items-center gap-2-5 text-xs font-mono mt-3-5">
              <span
                className="bg-white-10 text-gray-200 px-3 py-1 rounded-lg border border-white-10 flex items-center gap-1"
                title="Time Complexity per request evaluation"
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                {algo.timeComplexity}
              </span>
              <span
                className={`px-3 py-1 rounded-lg border font-semibold ${
                  algo.burstSupport
                    ? 'bg-emerald-500-10 text-emerald-400 border-emerald-500-20'
                    : 'bg-rose-500-10 text-rose-400 border-rose-500-20'
                }`}
                title={algo.burstSupport ? 'Permits sudden burst traffic' : 'Smooths out traffic bursts'}
              >
                {algo.burstSupport ? 'Burst ✓' : 'No Burst'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
