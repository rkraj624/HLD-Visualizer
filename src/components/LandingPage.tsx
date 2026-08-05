import React, { useEffect, useState, useRef } from 'react';
import { Play, ShieldAlert, GitBranch, Layers, Cpu, Server, Database, Radio, RefreshCw, HardDrive, Zap, Cloud } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface LandingPageProps {
  onNavigateToTopic: (topicId: string) => void;
}

interface Packet {
  id: number;
  edgeIndex: number;
  progress: number; // 0..1
  color: string;
}

interface NodeItem {
  id: string;
  name: string;
  icon: any;
  color: string;
  x: number; // percentage
  y: number; // percentage
}

// Initial 10 HLD Nodes (User Specified Topology Coordinates)
const INITIAL_NODES: NodeItem[] = [
  { id: 'rate-limiting', name: 'Rate Limiter', icon: ShieldAlert, color: '#f59e0b', x: 2, y: 24 },
  { id: 'api-gateway', name: 'API Gateway', icon: Cpu, color: '#a855f7', x: 2, y: 70 },
  { id: 'load-balancing', name: 'Load Balancer', icon: GitBranch, color: '#06b6d4', x: 31, y: 8 },
  { id: 'service-discovery', name: 'Service Registry', icon: RefreshCw, color: '#38bdf8', x: 33, y: 85 },
  { id: 'caching', name: 'Distributed Cache', icon: Layers, color: '#10b981', x: 60, y: 10 },
  { id: 'consistent-hashing', name: 'Consistent Hashing', icon: HardDrive, color: '#3b82f6', x: 30, y: 45 },
  { id: 'consensus', name: 'Raft Consensus', icon: Server, color: '#f43f5e', x: 69, y: 80 },
  { id: 'message-queues', name: 'Kafka Queues', icon: Radio, color: '#8b5cf6', x: 80, y: 24 },
  { id: 'db-sharding', name: 'DB Shards', icon: Database, color: '#ec4899', x: 85, y: 40 },
  { id: 'cdn-storage', name: 'CDN Edge PoP', icon: Cloud, color: '#14b8a6', x: 83, y: 67 },
];

const PIPELINE_EDGES = [
  { from: 0, to: 2 },
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 6 },
  { from: 4, to: 7 },
  { from: 5, to: 8 },
  { from: 6, to: 8 },
  { from: 4, to: 9 },
];

const LOCAL_STORAGE_KEY = 'hld_graph_node_positions_v1';

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToTopic }) => {
  // Load initial node positions from localStorage or fallback to default
  const [nodes, setNodes] = useState<NodeItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, { x: number; y: number }>;
        return INITIAL_NODES.map((node) => {
          if (parsed[node.id]) {
            return { ...node, x: parsed[node.id].x, y: parsed[node.id].y };
          }
          return node;
        });
      }
    } catch (e) {
      console.warn('Failed to load saved graph positions:', e);
    }
    return INITIAL_NODES;
  });

  const [packets, setPackets] = useState<Packet[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Save node positions to localStorage
  const savePositions = (updatedNodes: NodeItem[]) => {
    try {
      const positionMap: Record<string, { x: number; y: number }> = {};
      updatedNodes.forEach((n) => {
        positionMap[n.id] = { x: n.x, y: n.y };
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(positionMap));
    } catch (e) {
      console.warn('Failed to save graph positions:', e);
    }
  };

  const handleResetPositions = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setNodes(INITIAL_NODES);
  };

  const lastSoundTimeRef = useRef<number>(0);

  // Dragging handlers (Mouse & Touch)
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingNodeId(id);
    soundFx.playDragSound();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
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

  const handlePointerUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // Continuous animation of data packets travelling along dynamic node coordinates
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
            updated.push({
              id: Date.now() + Math.random(),
              edgeIndex: edgeIdx,
              progress: 0,
              color: srcNode.color,
            });
          }
        }

        return updated;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none"
    >
      {/* FULL-SCREEN INTERACTIVE SYSTEM TOPOLOGY CANVAS */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] pointer-events-none" />

        {/* SVG Pipeline Bus Lines (Dynamic to Node Dragging) */}
        <svg className="w-full h-full absolute inset-0 pointer-events-none">
          {PIPELINE_EDGES.map((edge, idx) => {
            const n1 = nodes[edge.from];
            const n2 = nodes[edge.to];
            if (!n1 || !n2) return null;
            return (
              <line
                key={idx}
                x1={`${n1.x}%`}
                y1={`${n1.y}%`}
                x2={`${n2.x}%`}
                y2={`${n2.y}%`}
                stroke={n1.color}
                strokeWidth="2"
                strokeOpacity="0.35"
                strokeDasharray="4 6"
              />
            );
          })}
        </svg>

        {/* Render Moving Data Packets Travelling Along Dynamic Coordinates */}
        {packets.map((p) => {
          const edge = PIPELINE_EDGES[p.edgeIndex];
          const n1 = nodes[edge.from];
          const n2 = nodes[edge.to];
          if (!n1 || !n2) return null;
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

        {/* Render Draggable HLD Topic Nodes */}
        {nodes.map((node) => {
          const Icon = node.icon;
          const isDragging = draggingNodeId === node.id;
          return (
            <div
              key={node.id}
              onPointerDown={(e) => handlePointerDown(node.id, e)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-3.5 px-4 rounded-2xl bg-slate-900/90 border ${
                isDragging ? 'border-cyan-400 scale-125 z-50 shadow-cyan-500/50' : 'border-slate-800 hover:border-cyan-400/80 z-20 hover:scale-110'
              } shadow-2xl backdrop-blur-md flex items-center gap-3.5 transition-transform duration-75 group touch-none`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md font-bold transition-transform group-hover:scale-105 flex-shrink-0"
                style={{
                  backgroundColor: `${node.color}25`,
                  borderColor: `${node.color}60`,
                  color: node.color,
                }}
              >
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-slate-200 block group-hover:text-white transition-colors">
                  {node.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToTopic(node.id);
                  }}
                  className="text-[10px] font-bold inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border mt-1 transition-all hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: `${node.color}20`,
                    borderColor: `${node.color}50`,
                    color: node.color,
                  }}
                >
                  <Play className="w-2.5 h-2.5 fill-current" /> Launch Sim
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOP BRAND BAR */}
      <header className="max-w-6xl mx-auto w-full relative z-50 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg glow-cyan border border-white/20">
              ⚡
            </div>
            <span className="text-xl font-extrabold font-heading tracking-tight text-white">
              System Craft HLD
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetPositions}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/90 text-slate-300 hover:text-white font-mono font-bold text-xs border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset graph nodes to default layout"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
            <button
              onClick={() => onNavigateToTopic('rate-limiting')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-mono font-bold text-xs shadow-xl shadow-cyan-500/25 border border-white/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-2 glow-cyan z-50 relative"
            >
              <span>Launch All Simulators</span>
              <Play className="w-3.5 h-3.5 fill-current text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* FOOTER */}
      <footer className="text-center font-mono text-xs text-slate-500 relative z-30">
        System Craft HLD • Drag any node to rearrange graph architecture | Click "Launch Sim" to enter simulator
      </footer>
    </div>
  );
};
