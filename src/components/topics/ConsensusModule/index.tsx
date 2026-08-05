import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { Lock, Activity } from 'lucide-react';

export type RaftRole = 'LEADER' | 'FOLLOWER' | 'CANDIDATE';

export interface RaftNode {
  id: string;
  name: string;
  role: RaftRole;
  term: number;
  votedFor: string | null;
}

export const ConsensusModule: React.FC = () => {
  const [term, setTerm] = useState(1);
  const [leaderId, setLeaderId] = useState('node-A');
  const [nodes, setNodes] = useState<RaftNode[]>([
    { id: 'node-A', name: 'Node-A (Leader)', role: 'LEADER', term: 1, votedFor: 'node-A' },
    { id: 'node-B', name: 'Node-B (Follower)', role: 'FOLLOWER', term: 1, votedFor: 'node-A' },
    { id: 'node-C', name: 'Node-C (Follower)', role: 'FOLLOWER', term: 1, votedFor: 'node-A' },
  ]);

  const [logMsg, setLogMsg] = useState<string | null>(null);

  const handleSimulateLeaderCrash = () => {
    const nextTerm = term + 1;
    setTerm(nextTerm);
    // Node-B becomes Candidate & wins election
    const newLeaderId = 'node-B';
    setLeaderId(newLeaderId);

    setNodes([
      { id: 'node-A', name: 'Node-A (Crashed)', role: 'FOLLOWER', term: nextTerm, votedFor: null },
      { id: 'node-B', name: 'Node-B (Leader)', role: 'LEADER', term: nextTerm, votedFor: 'node-B' },
      { id: 'node-C', name: 'Node-C (Follower)', role: 'FOLLOWER', term: nextTerm, votedFor: 'node-B' },
    ]);

    setLogMsg(`💥 Leader Node-A crashed! Raft Election triggered for Term ${nextTerm}. Majority vote quorum elected [Node-B] as new Leader!`);
    soundFx.playBlocked();
  };

  const handleRecoverLeader = () => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'node-A'
          ? { ...n, name: 'Node-A (Follower)', role: 'FOLLOWER', term, votedFor: leaderId }
          : n
      )
    );
    setLogMsg(`🟢 Node-A recovered and joined cluster as FOLLOWER under Leader [${leaderId}] (Term ${term}).`);
    soundFx.playSuccess();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-rose-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-rose-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Lock className="w-5 h-5 text-rose-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-rose-100 to-rose-400 bg-clip-text text-transparent">
                Distributed Consensus & Leader Election (Raft / Paxos / Redlock)
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Simulate Raft quorum heartbeat checks, leader crash recovery, term incrementing, and election voting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSimulateLeaderCrash} className="btn-danger text-xs py-2 px-4 font-bold cursor-pointer">
              Crash Current Leader
            </button>
            <button onClick={handleRecoverLeader} className="btn-secondary text-xs text-emerald-300 border-emerald-500/40 py-2 px-4 font-bold cursor-pointer">
              Recover Node-A
            </button>
          </div>
        </div>

        {logMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>{logMsg}</span>
            </div>
            <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/40 font-bold uppercase">
              TERM {term} RAFT
            </span>
          </div>
        )}

        {/* Raft Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`p-5 rounded-2xl border font-mono text-xs flex flex-col justify-between ${
                node.role === 'LEADER'
                  ? 'bg-slate-900 border-rose-400 ring-2 ring-rose-400/40 shadow-xl shadow-rose-500/20'
                  : 'bg-slate-900/90 border-slate-700/80 shadow-lg'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center font-bold">
                    {node.id.replace('node-', '')}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                      node.role === 'LEADER' ? 'bg-rose-500/20 text-rose-300 border-rose-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {node.role}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-heading mb-2">{node.name}</h4>

                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300 text-xs">
                  <div className="flex justify-between">
                    <span>Raft Term:</span>
                    <strong className="text-rose-300">Term {node.term}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Voted For:</span>
                    <strong className="text-cyan-300">{node.votedFor || 'None'}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
