import React, { useState, useEffect } from 'react';
import { HLD_TOPICS, type HLDTopic } from '../utils/hldTopics';
import { soundFx } from '../utils/audio';
import {
  Database, Server, Cpu, Activity, RefreshCw, Layers, ShieldCheck, ShieldAlert,
  CheckCircle2, XCircle, ArrowRight, Code2, BookOpen, Sparkles, Terminal,
  Zap, Copy, Check, Play, Pause, Plus, Trash2, Radio, Gauge, Users, Globe, Flame
} from 'lucide-react';

interface TopicModuleViewerProps {
  topicId: string;
}

export const TopicModuleViewer: React.FC<TopicModuleViewerProps> = ({ topicId }) => {
  const topic = HLD_TOPICS.find((t) => t.id === topicId) || HLD_TOPICS[0];
  const [activeTab, setActiveTab] = useState<'visualizer' | 'architecture' | 'code'>('visualizer');
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Balancer State
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

  // Caching State
  const [cacheStrategy, setCacheStrategy] = useState<'cache-aside' | 'write-through' | 'write-back'>('cache-aside');
  const [cacheItems, setCacheItems] = useState<Array<{ key: string; val: string; ttl: number; hits: number }>>([
    { key: 'user:1001', val: '{ name: "Alice", role: "Admin" }', ttl: 45, hits: 12 },
    { key: 'product:99', val: '{ title: "MacBook Pro", price: 1999 }', ttl: 120, hits: 45 },
    { key: 'session:token_abc', val: '{ userId: 1001, exp: 3600 }', ttl: 15, hits: 8 },
  ]);
  const [cacheHits, setCacheHits] = useState(38);
  const [cacheMisses, setCacheMisses] = useState(6);
  const [lastCacheStatus, setLastCacheStatus] = useState<'HIT' | 'MISS' | null>(null);

  // Consistent Hashing State
  const [ringNodes, setRingNodes] = useState([
    { id: 'node-1', name: 'Node-1 (0°)', angle: 0, vnodes: 3 },
    { id: 'node-2', name: 'Node-2 (120°)', angle: 120, vnodes: 3 },
    { id: 'node-3', name: 'Node-3 (240°)', angle: 240, vnodes: 3 },
  ]);
  const [hashedKeys, setHashedKeys] = useState<Array<{ key: string; angle: number; node: string }>>([
    { key: 'user_45', angle: 45, node: 'Node-2' },
    { key: 'user_180', angle: 180, node: 'Node-3' },
    { key: 'user_310', angle: 310, node: 'Node-1' },
  ]);

  // Load Balancer Routing Engine Logic
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

  // Cache Fetch Logic
  const handleCacheLookup = (queryKey: string) => {
    const found = cacheItems.find((item) => item.key === queryKey);
    if (found) {
      setLastCacheStatus('HIT');
      setCacheHits((h) => h + 1);
      setCacheItems((prev) =>
        prev.map((item) => (item.key === queryKey ? { ...item, hits: item.hits + 1 } : item))
      );
    } else {
      setLastCacheStatus('MISS');
      setCacheMisses((m) => m + 1);
      // Insert into cache after DB fetch
      const newItem = { key: queryKey, val: `{ data: "DB_RECORD_${Math.floor(Math.random() * 900) + 100}" }`, ttl: 60, hits: 1 };
      setCacheItems((prev) => [newItem, ...prev.slice(0, 4)]);
    }
  };

  // Consistent Hashing Add Node
  const handleAddRingNode = () => {
    const newAngle = Math.floor(Math.random() * 360);
    const newNodeId = `node-${ringNodes.length + 1}`;
    const newNode = { id: newNodeId, name: `Node-${ringNodes.length + 1} (${newAngle}°)`, angle: newAngle, vnodes: 3 };
    setRingNodes((prev) => [...prev, newNode]);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="glass-panel p-6 border-b border-white/10 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20"
          style={{ backgroundColor: topic.accentColor, filter: 'blur(90px)' }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg glow-blue"
              style={{
                backgroundColor: `${topic.accentColor}22`,
                borderColor: `${topic.accentColor}55`,
                color: topic.accentColor,
              }}
            >
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight">
                  {topic.title}
                </h1>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${topic.accentColor}20`,
                    borderColor: `${topic.accentColor}50`,
                    color: topic.accentColor,
                  }}
                >
                  {topic.badgeText}
                </span>
              </div>
              <p className="text-xs text-gray-300 font-mono mt-1">
                {topic.description}
              </p>
            </div>
          </div>

          {/* Module Nav Tabs */}
          <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'visualizer'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Interactive Playground
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> HLD Spec & Trade-offs
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Code & Config
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE PLAYGROUND VISUALIZERS */}
      {activeTab === 'visualizer' && (
        <div className="space-y-6">
          {/* TOPIC SPECIFIC VISUALIZERS */}
          {topicId === 'load-balancing' && (
            <div className="space-y-6">
              {/* Main Visualizer Panel */}
              <div className="glass-panel p-6 border-white/10">
                {/* Header & Controls Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                      </div>
                      Interactive Load Balancer Routing Engine
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      Observe real-time traffic routing, failover, node weight tuners, and connection distribution.
                    </p>
                  </div>

                  {/* Algorithm Selector Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
                    {[
                      { id: 'round-robin', label: 'Round Robin' },
                      { id: 'weighted-rr', label: 'Weighted RR' },
                      { id: 'least-conn', label: 'Least Conn' },
                      { id: 'ip-hash', label: 'IP Hash' },
                    ].map((algo) => (
                      <button
                        key={algo.id}
                        onClick={() => setLbAlgo(algo.id as any)}
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

                {/* Strategy Explanation & Quick Traffic Actions Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Dynamic Algorithm Explanation Box */}
                  <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs mb-1 flex items-center gap-2">
                        <span>Strategy: {lbAlgo.toUpperCase().replace('-', ' ')}</span>
                        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                          Active Strategy
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 font-normal leading-relaxed">
                        {lbAlgo === 'round-robin' && 'Sequential 1:1 distribution across healthy servers. Predictable and simple for homogeneous server clusters.'}
                        {lbAlgo === 'weighted-rr' && 'Distributes requests in proportion to server weight capacity. Servers with 3x weight receive 3x traffic.'}
                        {lbAlgo === 'least-conn' && 'Dynamically routes incoming requests to the healthy backend server with the lowest active connection count.'}
                        {lbAlgo === 'ip-hash' && 'Hashes client IP addresses for session stickiness. Ensures the same user hits the same server for stateful apps.'}
                      </p>
                    </div>
                  </div>

                  {/* Traffic Generator Controls */}
                  <div className="bg-black/60 p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 font-heading">Traffic Control</span>
                      <button
                        onClick={handleAddLBServer}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30"
                        title="Add a new server to the backend pool"
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
                        title="Send sudden 10 requests burst"
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
                        title={lbAutoSim ? 'Pause Auto Traffic' : 'Play Auto Traffic Flow (750ms)'}
                      >
                        {lbAutoSim ? <Pause className="w-4 h-4" /> : <Radio className="w-4 h-4 animate-pulse text-cyan-400" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3-Tier Visual Architecture Network Topology */}
                <div className="mb-6 p-4 rounded-2xl bg-black/70 border border-white/10">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" /> Client Source IP:
                    </span>

                    {/* Client IP Quick Select Pills */}
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

                  {/* Routing Decision Banner */}
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
                            : 'bg-black/60 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Server Header */}
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
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-300'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-300'
                              }`}
                              title="Click to simulate Server Health Failure / Recovery"
                            >
                              {srv.health === 'healthy' ? '🟢 HEALTHY' : '🔴 DOWN'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white font-heading">{srv.name}</h4>
                            <span className="text-xs text-gray-400 font-mono">{srv.region}</span>
                          </div>

                          {/* Weight Tuner */}
                          <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-xl border border-white/10 mt-3 text-xs font-mono">
                            <span className="text-gray-400 text-[10px]">Weight:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAdjustServerWeight(srv.id, -1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-300 flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-cyan-300 font-bold">{srv.weight}x</span>
                              <button
                                onClick={() => handleAdjustServerWeight(srv.id, 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-300 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Connection & CPU Metrics */}
                        <div className="space-y-2.5 mt-4 text-xs font-mono">
                          {/* Active Connections Bar */}
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

                          {/* CPU Load Gauge */}
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

                          {/* Traffic Share & Total Served */}
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                            <span>Share: <strong className="text-white font-bold">{trafficShare}%</strong></span>
                            <span>Total: <strong className="text-cyan-300 font-bold">{srv.totalServed}</strong></span>

                            {lbServers.length > 1 && (
                              <button
                                onClick={() => handleRemoveLBServer(srv.id)}
                                className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/50 hover:bg-rose-500/20 transition-all flex items-center justify-center shadow-sm"
                                title="Remove server from pool"
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

                {/* Server Traffic Share Progress Bars */}
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-6">
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

                {/* Real-time Terminal Routing Log Console */}
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
            </div>
          )}

          {topicId === 'caching' && (
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
                    Query New Key (Miss)
                  </button>
                </div>
              </div>

              {/* Stats & Last Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
              <div className="bg-black/90 p-4 rounded-2xl border border-white/10 font-mono text-xs">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">InMemory Cache Storage</h4>
                <div className="space-y-2">
                  {cacheItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <span className="text-emerald-400 font-bold">{item.key}</span>
                        <span className="text-gray-400 ml-3">{item.val}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-400">
                        <span>TTL: {item.ttl}s</span>
                        <span className="text-cyan-300 font-bold">{item.hits} Hits</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {topicId === 'consistent-hashing' && (
            <div className="glass-panel p-6 border-amber-500/30">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-amber-400" /> Consistent Hashing Ring Visualizer
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Observe how keys map to node positions on a 360° ring with minimal remapping on topology changes.
                  </p>
                </div>
                <button onClick={handleAddRingNode} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Server Node
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Visual Ring Representation */}
                <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-4 border-amber-500/30 flex items-center justify-center relative shadow-2xl">
                    <div className="text-center font-mono">
                      <span className="text-2xl font-bold text-white block">{ringNodes.length}</span>
                      <span className="text-xs text-amber-400 font-bold uppercase">Ring Nodes</span>
                    </div>

                    {/* Nodes on Ring */}
                    {ringNodes.map((node) => {
                      const rad = (node.angle * Math.PI) / 180;
                      const x = 110 * Math.cos(rad);
                      const y = 110 * Math.sin(rad);
                      return (
                        <div
                          key={node.id}
                          className="absolute w-8 h-8 rounded-full bg-amber-500 text-black font-extrabold text-xs flex items-center justify-center shadow-lg glow-amber cursor-pointer"
                          style={{
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                          title={node.name}
                        >
                          N
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Nodes List */}
                <div className="space-y-3 font-mono text-xs">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Ring Membership</h4>
                  {ringNodes.map((n) => (
                    <div key={n.id} className="p-3 bg-black/60 rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <span className="text-white font-bold">{n.name}</span>
                      <span className="text-amber-400">{n.vnodes} Virtual Nodes</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GENERIC HLD SPEC VISUALIZER FOR OTHER MODULES */}
          {!['load-balancing', 'caching', 'consistent-hashing'].includes(topicId) && (
            <div className="glass-panel p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-violet-600/30 border border-blue-500/40 flex items-center justify-center mx-auto text-blue-400 glow-blue">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-heading">{topic.title} Architecture Overview</h3>
              <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed font-mono">
                {topic.description} Explore the HLD Spec & Trade-offs tab for complete architectural flow diagrams and production design trade-offs.
              </p>
              <button
                onClick={() => setActiveTab('architecture')}
                className="btn-primary text-xs px-5 py-2 mx-auto inline-flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> View Architecture Spec
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HLD SPEC & TRADE-OFFS */}
      {activeTab === 'architecture' && (
        <div className="glass-panel p-7 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" /> {topic.title} Architecture Specification
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Production guidelines, design patterns, and engineering trade-offs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pros & Best Fits */}
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> System Advantages
              </h4>
              <ul className="text-xs text-gray-300 space-y-2 leading-relaxed">
                <li>• High scalability & transparent horizontal expansion across server clusters.</li>
                <li>• Low latency overhead with $O(1)$ lookup complexity in distributed topologies.</li>
                <li>• Protects downstream services from cascading failures and resource exhaustion.</li>
              </ul>
            </div>

            {/* Cons & Caveats */}
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Architecture Trade-offs
              </h4>
              <ul className="text-xs text-gray-300 space-y-2 leading-relaxed">
                <li>• Requires state synchronization or distributed locks (e.g. Redis Redlock).</li>
                <li>• Potential cache stampede / thundering herd problem during key expirations.</li>
                <li>• Higher operational complexity for multi-region failover configuration.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION CODE SNIPPETS */}
      {activeTab === 'code' && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" /> Production Code Reference
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Industrial-strength implementation snippet for {topic.title}.
              </p>
            </div>
            <button
              onClick={() => {
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="bg-black/90 p-4 rounded-2xl border border-cyan-500/30 font-mono text-xs text-cyan-300 overflow-x-auto">
            <pre>
              {`// Production ${topic.title} Implementation Pattern
import { Redis } from 'ioredis';

export class ${topic.title.replace(/[^a-zA-Z]/g, '')}Service {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  public async executePolicy(key: string, limit: number): Promise<boolean> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60);
    }
    return current <= limit;
  }
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
