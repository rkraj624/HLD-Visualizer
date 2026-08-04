import React from 'react';
import type { SimulationConfig, AlgorithmType } from '../types';
import { Sliders, Zap, Activity, Clock, ShieldAlert } from 'lucide-react';

interface ControlsPanelProps {
  algorithm: AlgorithmType;
  config: SimulationConfig;
  onChangeConfig: (newConfig: Partial<SimulationConfig>) => void;
  onSendSingleRequest: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  algorithm,
  config,
  onChangeConfig,
  onSendSingleRequest,
}) => {
  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white-10">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-heading">
          <Sliders className="w-4 h-4 text-blue-400" /> Dynamic Engine Parameter Tuner
        </h3>
        <button
          onClick={onSendSingleRequest}
          className="btn-primary text-xs py-1-5 px-3-5 glow-emerald"
        >
          <Zap className="w-3-5 h-3-5" /> Send Single Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Slider 1: Capacity */}
        <div className="bg-black-40 p-3-5 rounded-xl border border-white-10">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-200 flex items-center gap-1-5 font-heading">
              <Zap className="w-3-5 h-3-5 text-amber-400" />
              {algorithm === 'leaky-bucket' ? 'Queue Capacity' : 'Max Limit / Capacity'}
            </label>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500-10 px-2 py-0-5 rounded border border-amber-500-20">
              {config.capacity}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={config.capacity}
            onChange={(e) => onChangeConfig({ capacity: Number(e.target.value) })}
          />
          <span className="text-xs text-gray-300 block mt-1-5 font-mono">
            Max tokens or requests permitted
          </span>
        </div>

        {/* Slider 2: Refill Rate / Leak Rate */}
        {(algorithm === 'token-bucket' || algorithm === 'leaky-bucket') && (
          <div className="bg-black-40 p-3-5 rounded-xl border border-white-10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1-5 font-heading">
                <Activity className="w-3-5 h-3-5 text-cyan-400" />
                {algorithm === 'token-bucket' ? 'Refill Rate (tokens/s)' : 'Leak Rate (req/s)'}
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500-10 px-2 py-0-5 rounded border border-cyan-500-20">
                {config.refillRate} /s
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={config.refillRate}
              onChange={(e) => onChangeConfig({ refillRate: Number(e.target.value) })}
            />
            <span className="text-xs text-gray-300 block mt-1-5 font-mono">
              Continuous processing speed per sec
            </span>
          </div>
        )}

        {/* Slider 3: Window Duration */}
        {(algorithm === 'fixed-window' ||
          algorithm === 'sliding-window-log' ||
          algorithm === 'sliding-window-counter') && (
          <div className="bg-black-40 p-3-5 rounded-xl border border-white-10">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1-5 font-heading">
                <Clock className="w-3-5 h-3-5 text-amber-400" /> Window Duration
              </label>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500-10 px-2 py-0-5 rounded border border-amber-500-20">
                {(config.windowMs / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={config.windowMs}
              onChange={(e) => onChangeConfig({ windowMs: Number(e.target.value) })}
            />
            <span className="text-xs text-gray-300 block mt-1-5 font-mono">
              Time period evaluated for limit
            </span>
          </div>
        )}

        {/* Slider 4: Traffic Rate */}
        <div className="bg-black-40 p-3-5 rounded-xl border border-white-10">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-200 flex items-center gap-1-5 font-heading">
              <Activity className="w-3-5 h-3-5 text-emerald-400" /> Traffic Generator
            </label>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500-10 px-2 py-0-5 rounded border border-emerald-500-20">
              {config.trafficRate} RPS
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={config.trafficRate}
            onChange={(e) => onChangeConfig({ trafficRate: Number(e.target.value) })}
          />
          <span className="text-xs text-gray-300 block mt-1-5 font-mono">
            Auto request generation frequency
          </span>
        </div>

        {/* Traffic Load Pattern Selector */}
        <div className="bg-black-40 p-3-5 rounded-xl border border-white-10">
          <label className="text-xs font-bold text-gray-200 block mb-2 flex items-center gap-1-5 font-heading">
            <ShieldAlert className="w-3-5 h-3-5 text-rose-400" /> Traffic Load Pattern
          </label>
          <div className="grid grid-cols-2 gap-1-5 font-mono">
            {[
              { id: 'steady', label: '⚡ Steady' },
              { id: 'spike', label: '📈 Spiky' },
              { id: 'wave', label: '🌊 Sin Wave' },
              { id: 'ddos', label: '☠️ DDoS Attack' },
            ].map((pattern) => (
              <button
                key={pattern.id}
                onClick={() =>
                  onChangeConfig({
                    trafficPattern: pattern.id as SimulationConfig['trafficPattern'],
                  })
                }
                className={`py-1-5 px-2 text-xs rounded-lg border transition-all ${
                  config.trafficPattern === pattern.id
                    ? 'bg-blue-600 border-blue-500 text-white font-bold'
                    : 'bg-white-10 border-white-10 text-gray-300 hover:text-white'
                }`}
              >
                {pattern.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
