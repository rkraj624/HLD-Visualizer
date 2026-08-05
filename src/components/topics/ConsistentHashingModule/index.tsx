import React, { useState } from 'react';
import { CircleDot, Plus } from 'lucide-react';

export const ConsistentHashingModule: React.FC = () => {
  const [ringNodes, setRingNodes] = useState([
    { id: 'node-1', name: 'Node-1 (0°)', angle: 0, vnodes: 3 },
    { id: 'node-2', name: 'Node-2 (120°)', angle: 120, vnodes: 3 },
    { id: 'node-3', name: 'Node-3 (240°)', angle: 240, vnodes: 3 },
  ]);

  const handleAddRingNode = () => {
    const newAngle = Math.floor(Math.random() * 360);
    const newNodeId = `node-${ringNodes.length + 1}`;
    const newNode = { id: newNodeId, name: `Node-${ringNodes.length + 1} (${newAngle}°)`, angle: newAngle, vnodes: 3 };
    setRingNodes((prev) => [...prev, newNode]);
  };

  return (
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
  );
};
