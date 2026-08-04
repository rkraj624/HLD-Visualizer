import React, { useState, useEffect } from 'react';
import { HLD_TOPICS, type HLDTopic } from '../utils/hldTopics';
import {
  Database, Server, Cpu, Activity, RefreshCw, Layers, ShieldCheck,
  CheckCircle2, XCircle, ArrowRight, Code2, BookOpen, Sparkles, Terminal,
  Zap, Copy, Check, Play, Plus, Trash2, Radio
} from 'lucide-react';

interface TopicModuleViewerProps {
  topicId: string;
}

export const TopicModuleViewer: React.FC<TopicModuleViewerProps> = ({ topicId }) => {
  const topic = HLD_TOPICS.find((t) => t.id === topicId) || HLD_TOPICS[0];
  const [activeTab, setActiveTab] = useState<'visualizer' | 'architecture' | 'code'>('visualizer');
  const [copiedCode, setCopiedCode] = useState(false);

  // Load Balancer State
  const [lbAlgo, setLbAlgo] = useState<'round-robin' | 'least-conn' | 'ip-hash'>('round-robin');
  const [lbServers, setLbServers] = useState([
    { id: 'srv-1', name: 'Server A (US-East)', activeConns: 3, totalServed: 120, health: 'healthy', weight: 1 },
    { id: 'srv-2', name: 'Server B (US-West)', activeConns: 1, totalServed: 95, health: 'healthy', weight: 2 },
    { id: 'srv-3', name: 'Server C (EU-Central)', activeConns: 5, totalServed: 140, health: 'healthy', weight: 1 },
  ]);
  const [lastRoutedServer, setLastRoutedServer] = useState<string | null>(null);
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

  // Load Balancer Routing Logic
  const handleRouteLBRequest = () => {
    let targetIdx = 0;
    if (lbAlgo === 'round-robin') {
      targetIdx = rrIndex % lbServers.length;
      setRrIndex((prev) => prev + 1);
    } else if (lbAlgo === 'least-conn') {
      let minConns = Infinity;
      lbServers.forEach((srv, idx) => {
        if (srv.activeConns < minConns) {
          minConns = srv.activeConns;
          targetIdx = idx;
        }
      });
    } else {
      targetIdx = Math.floor(Math.random() * lbServers.length);
    }

    const chosenServer = lbServers[targetIdx];
    setLastRoutedServer(chosenServer.name);

    setLbServers((prev) =>
      prev.map((srv, idx) =>
        idx === targetIdx
          ? { ...srv, activeConns: srv.activeConns + 1, totalServed: srv.totalServed + 1 }
          : srv
      )
    );

    // Auto-release connection after 1.5s
    setTimeout(() => {
      setLbServers((prev) =>
        prev.map((srv, idx) =>
          idx === targetIdx ? { ...srv, activeConns: Math.max(0, srv.activeConns - 1) } : srv
        )
      );
    }, 1500);
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
            <div className="glass-panel p-6 border-cyan-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-400" /> Live Load Balancer Routing Engine
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Select an algorithm and trigger traffic to observe backend node load distribution.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(['round-robin', 'least-conn', 'ip-hash'] as const).map((algo) => (
                    <button
                      key={algo}
                      onClick={() => setLbAlgo(algo)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all ${
                        lbAlgo === algo
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold glow-cyan'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {algo.toUpperCase()}
                    </button>
                  ))}
                  <button
                    onClick={handleRouteLBRequest}
                    className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Send Request
                  </button>
                </div>
              </div>

              {lastRoutedServer && (
                <div className="mb-6 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/40 text-xs text-cyan-300 font-mono flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>Routed to: <strong>{lastRoutedServer}</strong> via {lbAlgo.toUpperCase()}</span>
                </div>
              )}

              {/* Server Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lbServers.map((srv) => (
                  <div
                    key={srv.id}
                    className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                      lastRoutedServer === srv.name
                        ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-400 glow-cyan scale-[1.02]'
                        : 'bg-black/60 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <span className="badge badge-emerald text-[10px]">HEALTHY</span>
                    </div>

                    <h4 className="text-sm font-bold text-white font-heading mb-1">{srv.name}</h4>
                    <div className="text-xs text-gray-400 font-mono space-y-1 mt-3">
                      <div className="flex justify-between">
                        <span>Active Conns:</span>
                        <span className="text-cyan-300 font-bold">{srv.activeConns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Served:</span>
                        <span className="text-white font-bold">{srv.totalServed}</span>
                      </div>
                    </div>

                    {/* Conns Gauge Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, srv.activeConns * 25)}%` }}
                      />
                    </div>
                  </div>
                ))}
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
