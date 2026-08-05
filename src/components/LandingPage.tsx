import React, { useEffect, useState } from 'react';
import { Play, ShieldAlert, GitBranch, Layers, Cpu, Server, Database, Radio, RefreshCw, HardDrive, Zap, Cloud } from 'lucide-react';

interface LandingPageProps {
  onNavigateToTopic: (topicId: string) => void;
}

interface Packet {
  id: number;
  edgeIndex: number;
  progress: number; // 0..1
  color: string;
}

// 10 HLD Microservice Topology Pipeline (Full Viewport Width Spanning: 7%, 31%, 50%, 69%, 93%)
const ARCHITECTURE_PIPELINE = [
  // Stage 1: Edge & Security (Far Left 7%)
  { id: 'rate-limiting', name: 'Rate Limiter', icon: ShieldAlert, color: '#f59e0b', x: 2, y: 24 },
  { id: 'api-gateway', name: 'API Gateway', icon: Cpu, color: '#a855f7', x: 2, y: 70 },
  
  // Stage 2: Routing & Discovery (Mid-Left 31%)
  { id: 'load-balancing', name: 'Load Balancer', icon: GitBranch, color: '#06b6d4', x: 31, y: 8 },
  { id: 'service-discovery', name: 'Service Registry', icon: RefreshCw, color: '#38bdf8', x: 33, y: 85 },
  
  // Stage 3: Memory & Compute (Center & Mid-Right 69%)
  { id: 'caching', name: 'Distributed Cache', icon: Layers, color: '#10b981', x: 60, y: 10 },
  { id: 'consistent-hashing', name: 'Consistent Hashing', icon: HardDrive, color: '#3b82f6', x: 30, y: 45 },
  { id: 'consensus', name: 'Raft Consensus', icon: Server, color: '#f43f5e', x: 69, y: 80 },

  // Stage 4: Data & Streaming (Far Right 93%)
  { id: 'message-queues', name: 'Kafka Queues', icon: Radio, color: '#8b5cf6', x: 88, y: 24 },
  { id: 'db-sharding', name: 'DB Shards', icon: Database, color: '#ec4899', x: 78, y: 40 },
  { id: 'cdn-storage', name: 'CDN Edge PoP', icon: Cloud, color: '#14b8a6', x: 88, y: 76 },
];

// Production Dependency Flow Edges
const PIPELINE_EDGES = [
  { from: 0, to: 2 }, // Rate Limiter -> Load Balancer
  { from: 1, to: 2 }, // Gateway -> Load Balancer
  { from: 1, to: 3 }, // Gateway -> Service Registry
  { from: 2, to: 4 }, // Load Balancer -> Distributed Cache
  { from: 2, to: 5 }, // Load Balancer -> Consistent Hashing
  { from: 3, to: 6 }, // Registry -> Raft Consensus
  { from: 4, to: 7 }, // Cache -> Kafka Queues
  { from: 5, to: 8 }, // Ring Hash -> DB Shards
  { from: 6, to: 8 }, // Consensus -> DB Shards
  { from: 4, to: 9 }, // Cache -> CDN Edge
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToTopic }) => {
  const [packets, setPackets] = useState<Packet[]>([]);

  // Continuous animation of data packets travelling along architecture edges
  useEffect(() => {
    const interval = setInterval(() => {
      setPackets((prev) => {
        const updated = prev
          .map((p) => ({ ...p, progress: p.progress + 0.035 }))
          .filter((p) => p.progress <= 1);

        // Spawn new data packet continuously
        if (Math.random() > 0.15) {
          const edgeIdx = Math.floor(Math.random() * PIPELINE_EDGES.length);
          const edge = PIPELINE_EDGES[edgeIdx];
          const srcNode = ARCHITECTURE_PIPELINE[edge.from];
          updated.push({
            id: Date.now() + Math.random(),
            edgeIndex: edgeIdx,
            progress: 0,
            color: srcNode.color,
          });
        }

        return updated;
      });
    }, 35);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* FULL-SCREEN INTERACTIVE SYSTEM TOPOLOGY GRAPH */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none" />

        {/* SVG Pipeline Bus Lines */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {PIPELINE_EDGES.map((edge, idx) => {
            const n1 = ARCHITECTURE_PIPELINE[edge.from];
            const n2 = ARCHITECTURE_PIPELINE[edge.to];
            return (
              <line
                key={idx}
                x1={`${n1.x}%`}
                y1={`${n1.y}%`}
                x2={`${n2.x}%`}
                y2={`${n2.y}%`}
                stroke={n1.color}
                strokeWidth="2"
                strokeOpacity="0.3"
                strokeDasharray="4 6"
              />
            );
          })}
        </svg>

        {/* Render Moving Data Packets Travelling Along Lines */}
        {packets.map((p) => {
          const edge = PIPELINE_EDGES[p.edgeIndex];
          const n1 = ARCHITECTURE_PIPELINE[edge.from];
          const n2 = ARCHITECTURE_PIPELINE[edge.to];
          const curX = n1.x + (n2.x - n1.x) * p.progress;
          const curY = n1.y + (n2.y - n1.y) * p.progress;

          return (
            <div
              key={p.id}
              className="absolute w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg z-10 flex items-center justify-center pointer-events-none"
              style={{
                left: `${curX}%`,
                top: `${curY}%`,
                backgroundColor: p.color,
                boxShadow: `0 0 14px ${p.color}`,
              }}
            >
              <Zap className="w-2 h-2 text-slate-950 fill-current" />
            </div>
          );
        })}

        {/* Render All 10 Interactive HLD Topic Nodes */}
        {ARCHITECTURE_PIPELINE.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.id}
              onClick={() => onNavigateToTopic(node.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-3.5 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-400 shadow-2xl backdrop-blur-md flex items-center gap-3.5 cursor-pointer transition-all hover:scale-115 group z-20"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              title={`Launch ${node.name} Simulator`}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-md font-bold transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${node.color}25`,
                  borderColor: `${node.color}60`,
                  color: node.color,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-slate-200 block group-hover:text-white transition-colors">
                  {node.name}
                </span>
                <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 mt-0.5">
                  <Play className="w-2.5 h-2.5 fill-current" /> Launch Sim
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOP BRAND BAR */}
      <header className="max-w-6xl mx-auto w-full relative z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg glow-cyan border border-white/20">
              ⚡
            </div>
            <span className="text-xl font-extrabold font-heading tracking-tight text-white">
              System Craft HLD
            </span>
          </div>

          <button
            onClick={() => onNavigateToTopic('rate-limiting')}
            className="btn-primary text-xs px-5 py-2.5 font-bold cursor-pointer glow-blue"
          >
            Launch All Simulators ➔
          </button>
        </div>
      </header>

      {/* FOOTER */}
      <footer className="text-center font-mono text-xs text-slate-500 relative z-30">
        System Craft HLD • Click any system node above to enter its interactive simulator
      </footer>
    </div>
  );
};
