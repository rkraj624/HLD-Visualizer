import React, { useState, useEffect } from 'react';
import { soundFx } from '../../../utils/audio';
import {
  Server, Cpu, Sparkles, Terminal, Play, Pause, Plus, Trash2, Radio, Gauge, Users, Globe, Flame, ArrowRight
} from 'lucide-react';

export const LoadBalancerModule: React.FC = () => {
  const [lbAlgo, setLbAlgo] = useState<'round-robin' | 'weighted-rr' | 'least-conn' | 'ip-hash'>('round-robin');
  const [lbAutoSim, setLbAutoSim] = useState(false);
  const [clientIpInput, setClientIpInput] = useState('192.168.1.42');
  const [lbServers, setLbServers] = useState([
    { id: 'srv-1', name: 'Server A', region: 'US-East-1', activeConns: 2, totalServed: 145, health: 'healthy' as 'healthy' | 'unhealthy', weight: 1, cpu: 34, maxConns: 12 },
    { id: 'srv-2', name: 'Server B', region: 'US-West-2', activeConns: 1, totalServed: 210, health: 'healthy' as 'healthy' | 'unhealthy', weight: 3, cpu: 20, maxConns: 16 },
    { id: 'srv-3', name: 'Server C', region: 'EU-Central-1', activeConns: 4, totalServed: 110, health: 'healthy' as 'healthy' | 'unhealthy', weight: 1, cpu: 65, maxConns: 10 },
    { id: 'srv-4', name: 'Server D', region: 'AP-South-1', activeConns: 0, totalServed: 85, health: 'healthy' as 'healthy' | 'unhealthy', weight: 2, cpu: 15, maxConns: 12 },
  ]);
  const [lastRoutedServer, setLastRoutedServer] = useState<string | null>(null);
  const [lastRoutedServerId, setLastRoutedServerId] = useState<string | null>(null);
  const [lbRoutingLogs, setLbRoutingLogs] = useState<Array<{ id: string; timestamp: string; ip: string; serverName: string; algo: string; status: 'SUCCESS' | 'FAIL'; latency: number }>>([]);
  const [rrIndex, setRrIndex] = useState(0);

  const handleRouteLBRequest = (customIp?: string) => {
    const ip = customIp || clientIpInput || `192.168.1.${Math.floor(Math.random() * 250) + 1}`;
    const healthyServers = lbServers.filter((s) => s.health === 'healthy');

    if (healthyServers.length === 0) {
      setLastRoutedServer('ALL SERVERS DOWN (503 Service Unavailable)');
      setLastRoutedServerId(null);
      const failLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString(),
        ip,
        serverName: 'NONE (503 Service Unavailable)',
        algo: lbAlgo.toUpperCase(),
        status: 'FAIL' as const,
        latency: 0,
      };
      setLbRoutingLogs((prev) => [failLog, ...prev].slice(0, 30));
      soundFx.playBlocked();
      return;
    }

    let targetServer = healthyServers[0];

    if (lbAlgo === 'round-robin') {
      const idx = rrIndex % healthyServers.length;
      targetServer = healthyServers[idx];
      setRrIndex((prev) => prev + 1);
    } else if (lbAlgo === 'weighted-rr') {
      const weightedList: typeof healthyServers = [];
      healthyServers.forEach((s) => {
        for (let i = 0; i < s.weight; i++) weightedList.push(s);
      });
      const idx = rrIndex % weightedList.length;
      targetServer = weightedList[idx];
      setRrIndex((prev) => prev + 1);
    } else if (lbAlgo === 'least-conn') {
      let minConns = Infinity;
      healthyServers.forEach((srv) => {
        if (srv.activeConns < minConns) {
          minConns = srv.activeConns;
          targetServer = srv;
        }
      });
    } else if (lbAlgo === 'ip-hash') {
      let hash = 0;
      for (let i = 0; i < ip.length; i++) {
        hash = (hash << 5) - hash + ip.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % healthyServers.length;
      targetServer = healthyServers[idx];
    }

    setLastRoutedServer(`${targetServer.name} (${targetServer.region})`);
    setLastRoutedServerId(targetServer.id);
    soundFx.playSuccess();

    setLbServers((prev) =>
      prev.map((srv) =>
        srv.id === targetServer.id
          ? {
              ...srv,
              activeConns: srv.activeConns + 1,
              totalServed: srv.totalServed + 1,
              cpu: Math.min(95, srv.cpu + Math.floor(Math.random() * 5) + 3),
            }
          : srv
      )
    );

    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      ip,
      serverName: `${targetServer.name} (${targetServer.region})`,
      algo: lbAlgo.toUpperCase(),
      status: 'SUCCESS' as const,
      latency: Math.floor(Math.random() * 12) + 4,
    };
    setLbRoutingLogs((prev) => [newLog, ...prev].slice(0, 30));

    setTimeout(() => {
      setLbServers((prev) =>
        prev.map((srv) =>
          srv.id === targetServer.id
            ? {
                ...srv,
                activeConns: Math.max(0, srv.activeConns - 1),
                cpu: Math.max(10, srv.cpu - Math.floor(Math.random() * 4) - 2),
              }
            : srv
        )
      );
    }, 1800);
  };

  const handleTriggerLBBurst = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        handleRouteLBRequest();
      }, i * 90);
    }
  };

  useEffect(() => {
    if (!lbAutoSim) return;
    const interval = setInterval(() => {
      handleRouteLBRequest();
    }, 750);
    return () => clearInterval(interval);
  }, [lbAutoSim, lbAlgo, lbServers, rrIndex]);

  const handleToggleServerHealth = (serverId: string) => {
    setLbServers((prev) =>
      prev.map((srv) =>
        srv.id === serverId
          ? {
              ...srv,
              health: srv.health === 'healthy' ? 'unhealthy' : 'healthy',
              activeConns: srv.health === 'healthy' ? 0 : srv.activeConns,
            }
          : srv
      )
    );
  };

  const handleAdjustServerWeight = (serverId: string, delta: number) => {
    setLbServers((prev) =>
      prev.map((srv) =>
        srv.id === serverId
          ? { ...srv, weight: Math.max(1, Math.min(5, srv.weight + delta)) }
          : srv
      )
    );
  };

  const handleAddLBServer = () => {
    const letters = ['E', 'F', 'G', 'H', 'I'];
    const regions = ['EU-West-1', 'AP-Northeast-1', 'US-Central-1', 'SA-East-1'];
    const nextIdx = lbServers.length;
    const name = `Server ${letters[nextIdx % letters.length] || `X${nextIdx}`}`;
    const region = regions[nextIdx % regions.length];

    const newSrv = {
      id: `srv-${Date.now()}`,
      name,
      region,
      activeConns: 0,
      totalServed: 0,
      health: 'healthy' as const,
      weight: 1,
      cpu: 10,
      maxConns: 12,
    };
    setLbServers((prev) => [...prev, newSrv]);
  };

  const handleRemoveLBServer = (serverId: string) => {
    if (lbServers.length <= 1) return;
    setLbServers((prev) => prev.filter((s) => s.id !== serverId));
  };

  return (
    <div className="glass-panel p-6 border-cyan-500/30">
      {/* Header & Algorithm Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            Interactive Load Balancer Routing Engine
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Observe real-time traffic routing, failover, node weight tuners, and connection distribution.
          </p>
        </div>

        {/* Algorithm Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-cyan-500/15 p-1.5 rounded-2xl border border-white/10">
          {[
            { id: 'round-robin', label: 'Round Robin' },
            { id: 'weighted-rr', label: 'Weighted RR' },
            { id: 'least-conn', label: 'Least Conn' },
            { id: 'ip-hash', label: 'IP Hash' },
          ].map((algo) => (
            <button
              key={algo.id}
              onClick={() => setLbAlgo(algo.id as typeof lbAlgo)}
              className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all ${
                lbAlgo === algo.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-800/80 text-gray-400 border-slate-700/60 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Explanation & Quick Traffic Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono text-gray-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex-shrink-0 mt-0.5 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-xs mb-1 flex items-center gap-2">
              <span>Strategy: {lbAlgo.toUpperCase().replace('-', ' ')}</span>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                Active Strategy
              </span>
            </div>
            <p className="text-xs text-gray-300 font-normal leading-relaxed">
              {lbAlgo === 'round-robin'  && 'Sequential 1:1 distribution across healthy servers. Predictable and simple for homogeneous server clusters.'}
              {lbAlgo === 'weighted-rr'  && 'Distributes requests in proportion to server weight capacity. Servers with 3x weight receive 3x traffic.'}
              {lbAlgo === 'least-conn'   && 'Dynamically routes incoming requests to the healthy backend server with the lowest active connection count.'}
              {lbAlgo === 'ip-hash'      && 'Hashes client IP addresses for session stickiness. Ensures the same user hits the same server for stateful apps.'}
            </p>
          </div>
        </div>

        {/* Traffic Generator Controls */}
        <div className="bg-cyan-500/15 p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 font-heading">Traffic Control</span>
            <button
              onClick={handleAddLBServer}
              className="text-xs text-cyan-300 hover:text-cyan-200 font-mono font-semibold flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> Add Server
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRouteLBRequest()}
              className="btn-primary text-xs flex-1 justify-center py-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Send 1 Req
            </button>

            <button
              onClick={() => handleTriggerLBBurst(10)}
              className="btn-secondary text-xs text-amber-300 border-amber-500/40 hover:bg-amber-500/20 py-2 px-3"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Burst (+10)
            </button>

            <button
              onClick={() => setLbAutoSim(!lbAutoSim)}
              className={`p-2 rounded-xl border transition-all ${
                lbAutoSim
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 text-gray-400 border-slate-700 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {lbAutoSim ? <Pause className="w-4 h-4" /> : <Radio className="w-4 h-4 animate-pulse text-cyan-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Visual Routing Decision Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-cyan-500/70 border border-white/10">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" /> Client Source IP:
          </span>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {['192.168.1.42', '10.0.4.99', '172.16.0.5'].map((ip) => (
              <button
                key={ip}
                onClick={() => {
                  setClientIpInput(ip);
                  handleRouteLBRequest(ip);
                }}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                  clientIpInput === ip
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                    : 'bg-slate-800/80 text-gray-400 border-slate-700 hover:text-white hover:bg-slate-700/80'
                }`}
              >
                IP: {ip}
              </button>
            ))}
          </div>
        </div>

        {lastRoutedServer ? (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-300">Client (<strong>{clientIpInput}</strong>)</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40 text-white font-bold">
                Load Balancer ({lbAlgo.toUpperCase()})
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-emerald-300 font-bold text-sm">{lastRoutedServer}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              ROUTED ⚡
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-400 text-center font-medium">
            Click <strong className="text-cyan-300">Send 1 Req</strong> or <strong className="text-amber-300">Burst</strong> to initiate load balancer routing
          </div>
        )}
      </div>

      {/* Server Pool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {lbServers.map((srv) => {
          const isTarget = lastRoutedServerId === srv.id;
          const totalAllServed = lbServers.reduce((acc, s) => acc + s.totalServed, 0);
          const trafficShare = totalAllServed > 0 ? ((srv.totalServed / totalAllServed) * 100).toFixed(0) : '0';

          return (
            <div
              key={srv.id}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                srv.health === 'unhealthy'
                  ? 'bg-rose-950/20 border-rose-500/30 opacity-75'
                  : isTarget
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md'
                  : 'bg-cyan-500/60 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                    srv.health === 'healthy'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}>
                    <Cpu className="w-4 h-4" />
                  </div>

                  <button
                    onClick={() => handleToggleServerHealth(srv.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-all border ${
                      srv.health === 'healthy'
                        ? 'bg-white text-emerald-500 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300'
                    }`}
                  >
                    {srv.health === 'healthy' ? '🟢 HEALTHY' : '🔴 DOWN'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white font-heading">{srv.name}</h4>
                  <span className="text-xs text-gray-400 font-mono">{srv.region}</span>
                </div>

                {/* Weight Tuner */}
                <div className="flex items-center justify-between bg-cyan-500/40 p-1.5 rounded-xl border border-white/10 mt-3 text-xs font-mono">
                  <span className="text-gray-400 text-[10px]">Weight:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAdjustServerWeight(srv.id, -1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-black flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-cyan-300 font-bold">{srv.weight}x</span>
                    <button
                      onClick={() => handleAdjustServerWeight(srv.id, 1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-black flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Connection & CPU Metrics */}
              <div className="space-y-2.5 mt-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 font-normal">Active Conns:</span>
                    <span className="text-cyan-300 font-bold">{srv.activeConns} / {srv.maxConns}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (srv.activeConns / srv.maxConns) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 font-normal">CPU Load:</span>
                    <span className={`font-bold ${
                      srv.cpu > 80 ? 'text-rose-400' : srv.cpu > 50 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>{srv.cpu}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        srv.cpu > 80 ? 'bg-rose-500' : srv.cpu > 50 ? 'bg-amber-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${srv.cpu}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                  <span>Share: <strong className="text-white font-bold">{trafficShare}%</strong></span>
                  <span>Total: <strong className="text-cyan-300 font-bold">{srv.totalServed}</strong></span>

                  {lbServers.length > 1 && (
                    <button
                      onClick={() => handleRemoveLBServer(srv.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/50 hover:bg-rose-500/20 transition-all flex items-center justify-center shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Traffic Share Progress Bars */}
      <div className="p-4 rounded-2xl bg-cyan-500/60 border border-white/10 mb-6">
        <h4 className="text-xs font-bold text-white font-heading mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" /> Server Traffic Distribution Share (%)
        </h4>
        <div className="space-y-2">
          {lbServers.map((srv) => {
            const totalAllServed = lbServers.reduce((acc, s) => acc + s.totalServed, 0);
            const sharePct = totalAllServed > 0 ? ((srv.totalServed / totalAllServed) * 100).toFixed(1) : '0.0';

            return (
              <div key={srv.id} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-300">{srv.name} ({srv.region})</span>
                  <span className="text-cyan-400 font-bold">{sharePct}% ({srv.totalServed} requests)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${sharePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Routing Decision Log Console */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-gray-300">
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" /> Live Routing Decision Console Logs ({lbRoutingLogs.length})
          </div>
          {lbRoutingLogs.length > 0 && (
            <button
              onClick={() => setLbRoutingLogs([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear Logs
            </button>
          )}
        </div>

        <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar text-xs">
          {lbRoutingLogs.length === 0 ? (
            <div className="text-gray-500 italic">No routing decisions logged yet. Click "Send 1 Req" to test.</div>
          ) : (
            lbRoutingLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-2 border-b border-white/5 pb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className="text-gray-400">IP: {log.ip}</span>
                <span className="text-cyan-400 font-bold">➔ {log.algo}</span>
                <span className="text-white font-semibold">➔ {log.serverName}</span>
                <span className={log.status === 'SUCCESS' ? 'text-emerald-400 font-bold ml-auto' : 'text-rose-400 font-bold ml-auto'}>
                  {log.status === 'SUCCESS' ? `[OK ${log.latency}ms]` : '[503 DOWN]'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
