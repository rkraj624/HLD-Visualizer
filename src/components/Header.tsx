import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Zap, Gauge, Sparkles, Volume2, VolumeX, Flame } from 'lucide-react';
import type { SimulationConfig } from '../types';
import { PRESET_SCENARIOS } from '../utils/constants';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  config: SimulationConfig;
  onChangeConfig: (newConfig: Partial<SimulationConfig>) => void;
  onReset: () => void;
  onTriggerBurst: (count: number) => void;
  onSelectPreset: (presetId: string) => void;
  onRunStressTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onChangeConfig,
  onReset,
  onTriggerBurst,
  onSelectPreset,
  onRunStressTest,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());

  const toggleSound = () => {
    const nextMute = !isMuted;
    soundFx.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  return (
    <header className="glass-panel p-5 mb-6 border-b border-white/10 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative z-10">
        {/* Title & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20 glow-blue">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight font-heading">
                Rate Limiter Visualizer
              </h1>
              <span className="badge badge-cyan text-[10px]">v2.0 Ultra</span>
            </div>
            <p className="text-xs text-gray-400">
              Interactive high-performance architecture simulation & system design benchmark
            </p>
          </div>
        </div>

        {/* Preset Selector Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 font-heading">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
          </span>
          {PRESET_SCENARIOS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className="btn-secondary text-xs px-3 py-1.5 hover:border-cyan-500/50 hover:text-cyan-300 font-mono transition-all"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Action Controls: Sound Toggle, Stress Test, Speed, Play/Pause, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`btn-secondary text-xs px-2.5 py-1.5 ${!isMuted ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' : 'text-gray-400'}`}
            title={isMuted ? 'Unmute Web Audio Synthesizer' : 'Mute Synthesizer'}
          >
            {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
            {[0.5, 1, 2, 5].map((speed) => (
              <button
                key={speed}
                onClick={() => onChangeConfig({ simSpeed: speed })}
                className={`px-2 py-1 text-xs font-mono font-medium rounded-lg transition-all ${
                  config.simSpeed === speed
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Stress Test */}
          <button
            onClick={onRunStressTest}
            className="btn-danger text-xs px-3 py-1.5"
            title="Run 5-second heavy stress load benchmark"
          >
            <Flame className="w-3.5 h-3.5 animate-bounce" /> Stress Test
          </button>

          {/* Burst (+5) */}
          <button
            onClick={() => onTriggerBurst(5)}
            className="btn-secondary text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
            title="Send sudden 5 requests burst"
          >
            <Gauge className="w-3.5 h-3.5" /> Burst (+5)
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => onChangeConfig({ isPaused: !config.isPaused })}
            className={config.isPaused ? 'btn-primary' : 'btn-secondary text-amber-400 border-amber-500/40'}
          >
            {config.isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="btn-secondary text-gray-400 hover:text-rose-400 hover:border-rose-500/40"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
    </header>
  );
};
