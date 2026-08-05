import React, { useEffect, useState, useRef } from 'react';
import { Play, ShieldAlert, GitBranch, Layers, Cpu, Server, Database, Radio, RefreshCw, HardDrive, Zap, Cloud } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { SqlPlaygroundSection } from './SqlPlaygroundSection';

interface LandingPageProps {
  onNavigateToTopic: (topicId: string) => void;
}

interface Packet {
  id: number;
  edgeIndex: number;
  progress: number;
  color: string;
}

interface NodeItem {
  id: string;
  name: string;
  icon: any;
  color: string;
  x: number;
  y: number;
}

const INITIAL_NODES: NodeItem[] = [
  // Stage 1: Entry (Left 2%)
  { id: 'rate-limiting',      name: 'Rate Limiter',       icon: ShieldAlert, color: '#f59e0b', x: 10,  y: 30 },
  { id: 'api-gateway',        name: 'API Gateway',        icon: Cpu,         color: '#a855f7', x: 10,  y: 80 },

  // Stage 2: Routing & Discovery (Mid-Left 31%)
  { id: 'load-balancing',     name: 'Load Balancer',      icon: GitBranch,   color: '#06b6d4', x: 31, y: 15  },
  { id: 'service-discovery',  name: 'Service Registry',   icon: RefreshCw,   color: '#38bdf8', x: 33, y: 95 },

  // Stage 3: Memory & Compute (Center & Mid-Right 69%)
  { id: 'caching',            name: 'Distributed Cache',  icon: Layers,      color: '#10b981', x: 60, y: 10 },
  { id: 'consistent-hashing', name: 'Consistent Hashing', icon: HardDrive,   color: '#3b82f6', x: 30, y: 45 },
  { id: 'consensus',          name: 'Raft Consensus',     icon: Server,      color: '#f43f5e', x: 59, y: 80 },

  // Stage 4: Data & Streaming (Far Right 93%)
  { id: 'message-queues',     name: 'Kafka Queues',       icon: Radio,       color: '#8b5cf6', x: 84, y: 30 },
  { id: 'db-sharding',        name: 'DB Shards',          icon: Database,    color: '#ec4899', x: 86, y: 50 },
  { id: 'cdn-storage',        name: 'CDN Edge PoP',       icon: Cloud,       color: '#14b8a6', x: 83, y: 74 },
];


const PIPELINE_EDGES = [
  { from: 0, to: 2 }, { from: 1, to: 2 }, { from: 1, to: 3 },
  { from: 2, to: 4 }, { from: 2, to: 5 }, { from: 3, to: 6 },
  { from: 4, to: 7 }, { from: 5, to: 8 }, { from: 6, to: 8 },
  { from: 4, to: 9 },
];

const LOCAL_STORAGE_KEY = 'hld_graph_node_positions_v2';

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToTopic }) => {
  const [nodes, setNodes] = useState<NodeItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, { x: number; y: number }>;
        return INITIAL_NODES.map((node) =>
          parsed[node.id] ? { ...node, ...parsed[node.id] } : node
        );
      }
    } catch (e) { /* ignore */ }
    return INITIAL_NODES;
  });

  const [packets, setPackets] = useState<Packet[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  const savePositions = (updatedNodes: NodeItem[]) => {
    try {
      const map: Record<string, { x: number; y: number }> = {};
      updatedNodes.forEach((n) => { map[n.id] = { x: n.x, y: n.y }; });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  };

  const handleResetPositions = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setNodes(INITIAL_NODES);
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingNodeId(id);
    soundFx.playDragSound();
  };

  // Drag on window so it works even when cursor leaves the graph box
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingNodeId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
      const newY = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      const now = Date.now();
      if (now - lastSoundTimeRef.current > 70) {
        soundFx.playDragSound();
        lastSoundTimeRef.current = now;
      }
      setNodes((prev) => {
        const next = prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        savePositions(next);
        return next;
      });
    };
    const onUp = () => setDraggingNodeId(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingNodeId]);

  // Animate packets
  useEffect(() => {
    const interval = setInterval(() => {
      setPackets((prev) => {
        const updated = prev
          .map((p) => ({ ...p, progress: p.progress + 0.035 }))
          .filter((p) => p.progress <= 1);
        if (Math.random() > 0.15) {
          const edgeIdx = Math.floor(Math.random() * PIPELINE_EDGES.length);
          const edge = PIPELINE_EDGES[edgeIdx];
          const srcNode = nodes[edge.from];
          if (srcNode) {
            updated.push({ id: Date.now() + Math.random(), edgeIndex: edgeIdx, progress: 0, color: srcNode.color });
          }
        }
        return updated;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [nodes]);

  return (
    <>
      {/* ───────────────────────────────────────────────
          SECTION 1 — Interactive Graph (100vh)
      ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#020617' }}
      >
        {/* Grid background */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(to right,#ffffff05 1px,transparent 1px),linear-gradient(to bottom,#ffffff05 1px,transparent 1px)',
          backgroundSize: '36px 36px' }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '50%', left: '25%', transform: 'translate(-50%,-50%)',
          width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%)',
          pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', right: '25%', transform: 'translate(50%,-50%)',
          width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.10),transparent 70%)',
          pointerEvents: 'none', zIndex: 0 }} />

        {/* SVG pipeline lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {PIPELINE_EDGES.map((edge, idx) => {
            const n1 = nodes[edge.from], n2 = nodes[edge.to];
            if (!n1 || !n2) return null;
            return <line key={idx} x1={`${n1.x}%`} y1={`${n1.y}%`} x2={`${n2.x}%`} y2={`${n2.y}%`}
              stroke={n1.color} strokeWidth="2" strokeOpacity="0.35" strokeDasharray="4 6" />;
          })}
        </svg>

        {/* Animated data packets */}
        {packets.map((p) => {
          const edge = PIPELINE_EDGES[p.edgeIndex];
          const n1 = nodes[edge.from], n2 = nodes[edge.to];
          if (!n1 || !n2) return null;
          const cx = n1.x + (n2.x - n1.x) * p.progress;
          const cy = n1.y + (n2.y - n1.y) * p.progress;
          return (
            <div key={p.id} style={{
              position: 'absolute', left: `${cx}%`, top: `${cy}%`,
              transform: 'translate(-50%,-50%)', zIndex: 2, pointerEvents: 'none',
              width: 14, height: 14, borderRadius: '50%',
              backgroundColor: p.color, boxShadow: `0 0 14px ${p.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap className="w-2 h-2 text-slate-950 fill-current" />
            </div>
          );
        })}

        {/* Draggable nodes */}
        {nodes.map((node) => {
          const Icon = node.icon;
          const isDragging = draggingNodeId === node.id;
          return (
            <div key={node.id}
              onPointerDown={(e) => handlePointerDown(node.id, e)}
              style={{
                position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
                transform: `translate(-50%,-50%) scale(${isDragging ? 1.2 : 1})`,
                zIndex: isDragging ? 40 : 10,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: 'transform 75ms',
              }}
              className={`p-3.5 px-4 rounded-2xl bg-slate-900/90 border ${
                isDragging ? 'border-cyan-400' : 'border-slate-800 hover:border-cyan-400/80'
              } shadow-2xl backdrop-blur-md flex items-center gap-3.5 group touch-none`}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md flex-shrink-0"
                style={{ backgroundColor: `${node.color}25`, borderColor: `${node.color}60`, color: node.color }}>
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-slate-200 block group-hover:text-white">{node.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigateToTopic(node.id); }}
                  className="text-[10px] font-bold inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border mt-1 hover:scale-105 transition-all cursor-pointer"
                  style={{ backgroundColor: `${node.color}20`, borderColor: `${node.color}50`, color: node.color }}
                >
                  <Play className="w-2.5 h-2.5 fill-current" /> Launch Sim
                </button>
              </div>
            </div>
          );
        })}

        {/* Header — always on top inside graph */}
        <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}
          className="px-6 sm:px-12 pt-6 pointer-events-auto">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg glow-cyan border border-white/20">⚡</div>
              <span className="text-xl font-extrabold font-heading tracking-tight text-white">System Craft HLD</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleResetPositions}
                className="px-4 py-2.5 rounded-2xl bg-slate-900/90 text-slate-300 hover:text-white font-mono font-bold text-xs border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /><span>Reset Layout</span>
              </button>
              <button onClick={() => onNavigateToTopic('rate-limiting')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-mono font-bold text-xs shadow-xl border border-white/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-2 glow-cyan">
                <span>Launch All Simulators</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* ───────────────────────────────────────────────
          SECTION 2 — SQL Playground (below graph)
      ─────────────────────────────────────────────── */}
      <SqlPlaygroundSection onNavigateToSharding={() => onNavigateToTopic('db-sharding')} />

      {/* ───────────────────────────────────────────────
          FOOTER
      ─────────────────────────────────────────────── */}
      <footer className="text-center font-mono text-xs text-slate-600 bg-slate-950 py-6 border-t border-slate-900">
        System Craft HLD • Drag nodes to rearrange | Scroll down for SQL Playground
      </footer>
    </>
  );
};
