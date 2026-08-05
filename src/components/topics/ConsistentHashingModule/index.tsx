import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { CircleDot, Plus, Trash2, Key, Sparkles, Server, ShieldCheck } from 'lucide-react';

export interface RingNode {
  id: string;
  name: string;
  angle: number; // 0..359
  vnodeCount: number;
  color: string;
}

export interface RingKey {
  id: string;
  key: string;
  angle: number; // 0..359
  assignedNodeId: string;
  assignedNodeName: string;
}

const NODE_COLORS = ['#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#a855f7', '#3b82f6'];

// Simple String Hash function to 0..359 degrees
function hashStringToDegree(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export const ConsistentHashingModule: React.FC = () => {
  const [vnodesMultiplier] = useState<number>(3);
  const [nodes, setNodes] = useState<RingNode[]>([
    { id: 'node-A', name: 'Node Alpha (0°)', angle: 0, vnodeCount: 3, color: '#f59e0b' },
    { id: 'node-B', name: 'Node Beta (120°)', angle: 120, vnodeCount: 3, color: '#06b6d4' },
    { id: 'node-C', name: 'Node Gamma (240°)', angle: 240, vnodeCount: 3, color: '#ec4899' },
  ]);

  const [keys, setKeys] = useState<RingKey[]>([
    { id: 'k1', key: 'user:session:99', angle: 45, assignedNodeId: 'node-B', assignedNodeName: 'Node Beta (120°)' },
    { id: 'k2', key: 'order:cart:1001', angle: 180, assignedNodeId: 'node-C', assignedNodeName: 'Node Gamma (240°)' },
    { id: 'k3', key: 'payment:txn_abc', angle: 310, assignedNodeId: 'node-A', assignedNodeName: 'Node Alpha (0°)' },
  ]);

  const [customKeyInput, setCustomKeyInput] = useState('');
  const [lastRemapLog, setLastRemapLog] = useState<string | null>(null);

  // Compute key routing clockwise on ring
  const getClockwiseNode = (angle: number, currentNodes: RingNode[]) => {
    if (currentNodes.length === 0) return null;
    const sorted = [...currentNodes].sort((a, b) => a.angle - b.angle);
    for (const node of sorted) {
      if (node.angle >= angle) return node;
    }
    return sorted[0]; // wrap around ring
  };

  // Re-evaluate key distribution when nodes change
  const reevaluateKeys = (updatedNodes: RingNode[]) => {
    setKeys((prevKeys) => {
      let remappedCount = 0;
      const nextKeys = prevKeys.map((k) => {
        const targetNode = getClockwiseNode(k.angle, updatedNodes);
        const nextNodeId = targetNode ? targetNode.id : 'NONE';
        const nextNodeName = targetNode ? targetNode.name : 'Unassigned';
        if (k.assignedNodeId !== nextNodeId) {
          remappedCount++;
        }
        return {
          ...k,
          assignedNodeId: nextNodeId,
          assignedNodeName: nextNodeName,
        };
      });

      if (remappedCount > 0) {
        setLastRemapLog(`Topology change! Only ${remappedCount} of ${prevKeys.length} keys remapped (${((remappedCount / Math.max(1, prevKeys.length)) * 100).toFixed(0)}%).`);
      } else {
        setLastRemapLog('Zero key remapping required for existing keys!');
      }

      return nextKeys;
    });
  };

  const handleAddNode = () => {
    if (nodes.length >= 6) return;
    const angle = Math.floor(Math.random() * 360);
    const nodeChar = String.fromCharCode(65 + nodes.length);
    const color = NODE_COLORS[nodes.length % NODE_COLORS.length];
    const newNode: RingNode = {
      id: `node-${nodeChar}`,
      name: `Node ${nodeChar} (${angle}°)`,
      angle,
      vnodeCount: vnodesMultiplier,
      color,
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    reevaluateKeys(nextNodes);
    soundFx.playSuccess();
  };

  const handleRemoveNode = (nodeId: string) => {
    if (nodes.length <= 1) return;
    const nextNodes = nodes.filter((n) => n.id !== nodeId);
    setNodes(nextNodes);
    reevaluateKeys(nextNodes);
    soundFx.playBlocked();
  };

  const handleAddKey = () => {
    const keyName = customKeyInput || `key:${Math.floor(Math.random() * 9000) + 1000}`;
    const angle = hashStringToDegree(keyName);
    const targetNode = getClockwiseNode(angle, nodes);

    const newKey: RingKey = {
      id: `k-${Date.now()}`,
      key: keyName,
      angle,
      assignedNodeId: targetNode ? targetNode.id : 'NONE',
      assignedNodeName: targetNode ? targetNode.name : 'Unassigned',
    };

    setKeys((prev) => [newKey, ...prev.slice(0, 7)]);
    setCustomKeyInput('');
    soundFx.playSuccess();
  };

  return (
    <div className="glass-panel p-6 border-amber-500-30">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white-10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-amber-400" /> Consistent Hashing Ring Visualizer
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            Observe how keys map to node positions on a 360° ring with minimal remapping on topology changes.
          </p>
        </div>
        <button onClick={handleAddNode} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold">
          <Plus className="w-4 h-4" /> Add Server Node ({nodes.length}/6)
        </button>
      </div>

      {/* Remap Alert Banner */}
      {lastRemapLog && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-950-30 border border-amber-500-30 text-amber-300 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{lastRemapLog}</span>
          </div>
          <span className="text-[10px] bg-amber-500-20 px-2 py-0.5 rounded border border-amber-500-30 font-bold uppercase">
            Consistent Hash Result
          </span>
        </div>
      )}

      {/* Ring Canvas Graphic & Active Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-6">
        {/* Ring Canvas Graphic */}
        <div className="relative w-80 h-80 mx-auto flex items-center justify-center p-4">
          {/* Main Glass Center Container */}
          <div
            className="w-full h-full rounded-full border border-amber-500/40 flex items-center justify-center relative shadow-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(15, 23, 42, 0.75) 0%, rgba(5, 7, 13, 0.85) 100%)',
              backdropFilter: 'blur(16px)',
            }}
          >
            
            {/* Explicit SVG Circular Ring Orbit Tracks */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
              {/* Outer Server Node Track (Radius 120) */}
              <circle
                cx="160"
                cy="160"
                r="120"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeOpacity="0.6"
                strokeDasharray="6 4"
              />

              {/* Inner Key Track (Radius 85) */}
              <circle
                cx="160"
                cy="160"
                r="85"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />

              {/* Degree Angle Reference Markers */}
              <text x="160" y="28" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">0° / 360°</text>
              <text x="295" y="163" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="start">90°</text>
              <text x="160" y="302" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">180°</text>
              <text x="25" y="163" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">270°</text>
            </svg>

            <div className="text-center font-mono z-10 pointer-events-none select-none">
              <span className="text-4xl font-extrabold text-white block tracking-tight">{nodes.length}</span>
              <span className="text-xs text-amber-400 font-bold uppercase block mt-0.5">Server Nodes</span>
              <span className="text-[10px] text-cyan-300 font-mono block mt-1">{keys.length} Mapped Keys</span>
            </div>

            {/* Render Server Nodes on Ring Orbit */}
            {nodes.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const radius = 120;
              const x = radius * Math.cos(rad);
              const y = radius * Math.sin(rad);

              return (
                <div
                  key={node.id}
                  className="absolute w-10 h-10 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center shadow-lg border border-white-20 cursor-pointer transition-all hover:scale-125 z-20"
                  style={{
                    left: 'calc(50% - 20px)',
                    top: 'calc(50% - 20px)',
                    transform: `translate(${x}px, ${y}px)`,
                    backgroundColor: node.color,
                    color: '#000000',
                  }}
                  title={`${node.name} at ${node.angle}°`}
                >
                  <Server className="w-4 h-4" />
                  <span className="text-[9px] font-mono leading-none mt-0.5">{node.angle}°</span>
                </div>
              );
            })}

            {/* Render Mapped Keys on Ring Inner Orbit */}
            {keys.map((k) => {
              const rad = (k.angle * Math.PI) / 180;
              const radius = 85;
              const x = radius * Math.cos(rad);
              const y = radius * Math.sin(rad);

              return (
                <div
                  key={k.id}
                  className="absolute w-6 h-6 rounded-full bg-cyan-400 text-black font-extrabold text-[10px] flex items-center justify-center shadow-md border border-white-20 cursor-pointer z-30"
                  style={{
                    left: 'calc(50% - 12px)',
                    top: 'calc(50% - 12px)',
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  title={`Key: ${k.key} (${k.angle}°) -> ${k.assignedNodeName}`}
                >
                  <Key className="w-3.5 h-3.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership List & Key Routing Form */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white-10 flex items-center gap-2.5">
            <input
              type="text"
              placeholder="Insert key (e.g. user:profile:500)"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              className="bg-slate-950/80 border border-white-10 rounded-lg px-3.5 py-2 text-xs font-mono text-white flex-1 focus:outline-none focus:border-amber-500-30"
            />
            <button onClick={handleAddKey} className="btn-primary text-xs py-2 px-4 font-bold whitespace-nowrap">
              Route Key
            </button>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-heading">Ring Membership</h4>
            {nodes.map((n) => (
              <div key={n.id} className="p-3 bg-slate-900/80 rounded-xl border border-amber-500-30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: n.color }} />
                  <span className="text-white font-bold">{n.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-bold">{vnodesMultiplier} V-Nodes</span>
                  {nodes.length > 1 && (
                    <button
                      onClick={() => handleRemoveNode(n.id)}
                      className="p-1 rounded bg-slate-800 text-gray-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500-30 transition-all cursor-pointer"
                      title="Remove node from ring"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Mapping Audit Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-white-10 font-mono text-xs">
        <div className="text-white font-bold font-heading text-sm mb-3.5 border-b border-white-10 pb-3 flex items-center justify-between">
          <span className="text-amber-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Key-to-Node Ring Mapping Audit Table
          </span>
          <span className="text-gray-400 text-xs font-normal">Clockwise Next-Node Assignment</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white-10 text-gray-400">
                <th className="p-3">KEY NAME</th>
                <th className="p-3">RING ANGLE</th>
                <th className="p-3">ASSIGNED SERVER NODE</th>
                <th className="p-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-white-5 hover:bg-white-5">
                  <td className="p-3 text-cyan-300 font-bold">{k.key}</td>
                  <td className="p-3 text-amber-400 font-bold">{k.angle}°</td>
                  <td className="p-3 text-emerald-400 font-bold">{k.assignedNodeName}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">MAPPED ⚡</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
