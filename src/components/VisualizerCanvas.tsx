import React, { useEffect, useState } from 'react';
import type { AlgorithmType, SimulationConfig, SimulationState, RequestItem } from '../types';
import { ALGORITHMS } from '../utils/constants';
import { Server, CheckCircle2, XCircle, Activity, Clock, Coins, Droplet, ArrowRight, Cpu, Info } from 'lucide-react';

interface VisualizerCanvasProps {
  algorithm: AlgorithmType;
  state: SimulationState;
  config: SimulationConfig;
  recentLogs: RequestItem[];
}

interface FlyingPacket {
  id: string;
  status: 'allowed' | 'rejected';
  endpoint: string;
  startTime: number;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  algorithm,
  state,
  config,
  recentLogs,
}) => {
  const algoInfo = ALGORITHMS[algorithm];
  const now = Date.now();

  const [packets, setPackets] = useState<FlyingPacket[]>([]);

  useEffect(() => {
    if (recentLogs.length > 0) {
      const latestLog = recentLogs[0];
      setPackets((prev) => {
        if (prev.some((p) => p.id === latestLog.id)) return prev;
        const newPacket: FlyingPacket = {
          id: latestLog.id,
          status: latestLog.status === 'allowed' ? 'allowed' : 'rejected',
          endpoint: latestLog.endpoint,
          startTime: Date.now(),
        };
        return [newPacket, ...prev].slice(0, 8);
      });
    }
  }, [recentLogs]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setPackets((prev) => prev.filter((p) => current - p.startTime < 1300));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Compute live plain English mathematical explanation text
  const getLiveExplanation = () => {
    if (algorithm === 'token-bucket') {
      return `Refill Engine: Adding ${config.refillRate} tokens/s. Tank holds ${state.tokens.toFixed(1)} / ${config.capacity} tokens. Each request consumes 1 token.`;
    }
    if (algorithm === 'leaky-bucket') {
      return `Funnel Buffer: ${state.queue.length} / ${config.capacity} requests queued. Leaking out to server at fixed ${config.refillRate} req/s.`;
    }
    if (algorithm === 'fixed-window') {
      const timeLeft = Math.max(0, Math.ceil((config.windowMs - (now - state.currentWindowStart)) / 1000));
      return `Fixed Window Counter: ${state.windowRequestCount} / ${config.capacity} requests used in current window. Resets in ${timeLeft}s.`;
    }
    if (algorithm === 'sliding-window-log') {
      return `Sliding Window Log: ${state.requestLogs.length} / ${config.capacity} active timestamps in window [t - ${(config.windowMs / 1000).toFixed(1)}s, t].`;
    }
    if (algorithm === 'sliding-window-counter') {
      const weighted = ((state.prevWindowCount || 0) * 0.5 + (state.currWindowCount || 0)).toFixed(1);
      return `Sliding Counter Formula: (PrevWindow ${state.prevWindowCount || 0} × Overlap Weight) + CurrWindow ${state.currWindowCount || 0} = ${weighted} / ${config.capacity} estimated requests.`;
    }
    return '';
  };

  return (
    <div className="glass-panel p-7 sm:p-9 mb-8 relative overflow-hidden shadow-2xl border-blue-500-30">
      {/* Background Ambient Glow */}
      <div
        className="absolute top-0 right-25pct w-96 h-96 rounded-full pointer-events-none opacity-25"
        style={{ backgroundColor: algoInfo.accentColor, filter: 'blur(100px)' }}
      />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-white-10 gap-4 relative z-10">
        <div className="flex items-center gap-3-5">
          <div
            className="w-4 h-4 rounded-full animate-ping"
            style={{ backgroundColor: algoInfo.accentColor }}
          />
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2-5 font-heading">
              <Cpu className="w-5 h-5 text-blue-400" style={{ color: algoInfo.accentColor }} />
              {algoInfo.name} Real-Time Visual Engine
            </h2>
            <span className="text-xs text-gray-300 font-mono">
              {algoInfo.tagline}
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3-5 py-1-5 rounded-full bg-emerald-500-10 border border-emerald-500-30 text-emerald-400 font-bold shadow-md glow-emerald">
            <CheckCircle2 className="w-4 h-4" /> 200 Passed: <span>{state.allowedRequests}</span>
          </div>
          <div className="flex items-center gap-2 px-3-5 py-1-5 rounded-full bg-rose-500-10 border border-rose-500-30 text-rose-400 font-bold shadow-md glow-rose">
            <XCircle className="w-4 h-4" /> 429 Blocked: <span>{state.rejectedRequests}</span>
          </div>
        </div>
      </div>

      {/* Live Engine Math Terminal Banner */}
      <div className="mb-6 bg-gradient-to-r from-black-90 via-black-80 to-black-90 p-4 rounded-2xl border border-cyan-500-40 flex items-center gap-3 text-xs text-cyan-300 font-mono shadow-xl glow-cyan">
        <Info className="w-4-5 h-4-5 text-cyan-400 flex-shrink-0" />
        <span className="leading-relaxed"><strong>Live Engine Math:</strong> {getLiveExplanation()}</span>
      </div>

      {/* Main Flow Canvas: Client Stream -> Limiter Engine -> Backend Node */}
      <div className="relative min-h-350px grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

        {/* Connecting Laser Track Line */}
        <div className="hidden md:block absolute left-22pct right-22pct top-50pct translate-y-50pct-neg h-1-5 laser-line rounded-full z-0 pointer-events-none opacity-70" />

        {/* Flying Packets Container */}
        <div className="hidden md:block absolute left-20pct right-20pct top-50pct translate-y-50pct-neg h-14 z-20 pointer-events-none overflow-hidden">
          {packets.map((pkt) => (
            <div
              key={pkt.id}
              className={`absolute top-50pct translate-y-50pct-neg px-3 py-1-5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 shadow-xl ${
                pkt.status === 'allowed'
                  ? 'bg-emerald-600 text-white border border-emerald-400 packet-allowed glow-emerald'
                  : 'bg-rose-600 text-white border border-rose-400 packet-rejected glow-rose'
              }`}
            >
              <span>{pkt.status === 'allowed' ? '200' : '429'}</span>
              <span className="opacity-90">{pkt.endpoint.split('/').pop()}</span>
            </div>
          ))}
        </div>

        {/* 1. Traffic Client Stream Node (Left 3 Cols) */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-black-60 to-black-80 rounded-2xl border border-white-10 relative z-10 shadow-xl hover:border-blue-500-40 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600-30 to-cyan-500-30 border border-blue-500-40 flex items-center justify-center mb-3 shadow-lg glow-blue">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-heading">Traffic Generator</h4>
          <div className="text-xs text-blue-300 font-mono bg-blue-950-40 px-3 py-1 rounded-lg border border-blue-500-30 mb-3 font-semibold shadow-sm">
            {config.trafficRate} Req/Sec • {config.trafficPattern.toUpperCase()}
          </div>

          <div className="flex items-center justify-center gap-2 w-full overflow-hidden">
            {recentLogs.slice(0, 5).map((log, idx) => (
              <div
                key={log.id + idx}
                className={`w-3-5 h-3-5 rounded-full ${
                  log.status === 'allowed'
                    ? 'bg-emerald-400 glow-emerald'
                    : 'bg-rose-500 glow-rose'
                }`}
                title={`${log.endpoint} - ${log.status}`}
              />
            ))}
          </div>
        </div>

        {/* Arrow Left to Center */}
        <div className="hidden md:flex md:col-span-1 justify-center z-10">
          <ArrowRight className="w-7 h-7 text-gray-400" />
        </div>

        {/* 2. Limiter Gateway Engine (Center 4 Cols) */}
        <div
          className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-black-80 rounded-2xl border relative z-10 min-h-320px shadow-2xl"
          style={{
            borderColor: algoInfo.accentColor,
            boxShadow: `0 0 35px ${algoInfo.bgGlow}`,
          }}
        >
          {/* TOKEN BUCKET */}
          {algorithm === 'token-bucket' && (
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3 px-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2 font-mono">
                  <Coins className="w-4-5 h-4-5 text-amber-400" />
                  Tokens: {state.tokens.toFixed(1)} / {config.capacity}
                </span>
                <span className="text-xs text-amber-400 bg-amber-500-10 px-2-5 py-1 rounded-lg border border-amber-500-30 font-mono font-semibold">
                  +{config.refillRate}/s
                </span>
              </div>

              <div
                className="border-2 border-amber-500-50 rounded-b-3xl bg-amber-950-20 flex flex-wrap-reverse content-end gap-2 justify-center relative overflow-hidden shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '16rem',
                  minHeight: '11rem',
                  padding: '2.25rem 0.875rem 0.875rem 0.875rem',
                }}
              >
                <div className="absolute top-0 left-50pct translate-x-50pct-neg w-2 h-7 bg-amber-400 rounded-b shadow-lg" />

                {Array.from({ length: Math.floor(state.tokens) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-amber-400 border border-yellow-200 text-black flex items-center justify-center text-xs font-extrabold shadow-lg"
                  >
                    ⚡
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LEAKY BUCKET */}
          {algorithm === 'leaky-bucket' && (
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3 px-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-2 font-mono">
                  <Droplet className="w-4-5 h-4-5 text-cyan-400" />
                  Queue: {state.queue.length} / {config.capacity}
                </span>
                <span className="text-xs text-cyan-400 bg-cyan-500-10 px-2-5 py-1 rounded-lg border border-cyan-500-30 font-mono font-semibold">
                  💧 Leak: {config.refillRate}/s
                </span>
              </div>

              <div className="w-52 h-44 border-2 border-cyan-500-50 rounded-b-3xl bg-cyan-950-20 relative p-1 flex flex-col justify-end overflow-hidden shadow-2xl">
                <div
                  className="w-full bg-cyan-500 rounded-b-2xl transition-all duration-300 liquid-wave opacity-85 shadow-lg"
                  style={{
                    height: `${Math.min(100, (state.queue.length / config.capacity) * 100)}%`,
                  }}
                />
                <div className="absolute bottom-1.5 left-50pct translate-x-50pct-neg w-3.5 h-3.5 bg-cyan-400 rounded-full glow-cyan" />
              </div>
            </div>
          )}

          {/* FIXED WINDOW COUNTER */}
          {algorithm === 'fixed-window' && (
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3 px-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2 font-mono">
                  <Clock className="w-4-5 h-4-5 text-amber-400" />
                  Window Limit: {state.windowRequestCount} / {config.capacity}
                </span>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={
                      2 * Math.PI * 58 * (1 - Math.min(1, state.windowRequestCount / config.capacity))
                    }
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {state.windowRequestCount}
                  </span>
                  <span className="text-xs text-amber-400 font-mono uppercase font-bold">
                    Max {config.capacity}
                  </span>
                </div>
              </div>

              <div className="w-full bg-white-10 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, ((now - state.currentWindowStart) / config.windowMs) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* SLIDING WINDOW LOG */}
          {algorithm === 'sliding-window-log' && (
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2.5">
                <span className="text-xs font-bold text-pink-400 font-mono">
                  Logs: {state.requestLogs.length} / {config.capacity}
                </span>
                <span className="text-xs text-gray-300 font-mono">
                  {(config.windowMs / 1000).toFixed(1)}s Window
                </span>
              </div>

              <div className="w-full h-36 bg-black-90 border border-pink-500-40 rounded-2xl p-3.5 relative flex items-center justify-start overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-pink-500-10 border-x border-pink-500-40 pointer-events-none" />

                <div className="flex items-center gap-2-5 overflow-x-auto w-full z-10 px-1">
                  {state.requestLogs.map((ts, idx) => {
                    const ageMs = now - ts;
                    const pct = Math.max(0, Math.min(100, 100 - (ageMs / config.windowMs) * 100));
                    return (
                      <div key={idx + ts} className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div
                          className="w-3.5 h-12 rounded-full bg-pink-500 shadow-md"
                          style={{ opacity: 0.5 + (pct / 100) * 0.5 }}
                        />
                        <span className="text-xs font-mono text-pink-300">
                          {((now - ts) / 1000).toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SLIDING WINDOW COUNTER */}
          {algorithm === 'sliding-window-counter' && (
            <div className="w-full flex flex-col items-center">
              <div className="text-xs font-bold text-emerald-400 mb-3 font-mono">
                Weighted: {((state.prevWindowCount || 0) * 0.5 + (state.currWindowCount || 0)).toFixed(1)} / {config.capacity}
              </div>

              <div className="w-full grid grid-cols-2 gap-3.5">
                <div className="bg-white-10 border border-white-10 p-3-5 rounded-2xl text-center shadow-md">
                  <span className="text-xs text-gray-300 block font-heading uppercase font-bold">Prev Window</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {state.prevWindowCount || 0}
                  </span>
                </div>
                <div className="bg-emerald-950-40 border border-emerald-500-40 p-3-5 rounded-2xl text-center glow-emerald shadow-md">
                  <span className="text-xs text-emerald-300 block font-heading uppercase font-bold">Curr Window</span>
                  <span className="text-2xl font-bold font-mono text-emerald-300">
                    {state.currWindowCount || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Arrow Center to Right */}
        <div className="hidden md:flex md:col-span-1 justify-center z-10">
          <ArrowRight className="w-7 h-7 text-gray-400" />
        </div>

        {/* 3. Protected Backend Server Node (Right 3 Cols) */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-950-40 to-black-80 border border-emerald-500-40 rounded-2xl relative z-10 shadow-xl hover:border-emerald-400 transition-all">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600-30 to-teal-500-30 border border-emerald-500-40 flex items-center justify-center mb-3 shadow-lg glow-emerald">
            <Server className="w-8 h-8 text-emerald-400" />
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-heading">Protected Server</h4>
          <div className="text-xs text-emerald-400 font-mono bg-emerald-950-60 px-3 py-1 rounded-lg border border-emerald-500-30 mb-1 font-semibold shadow-sm">
            {state.allowedRequests} Requests Served
          </div>
          <span className="text-xs text-gray-300 font-mono">
            HTTP 200 OK • 100% Active
          </span>
        </div>
      </div>
    </div>
  );
};
