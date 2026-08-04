import React from 'react';
import { ALGORITHMS } from '../utils/constants';
import { Table, CheckCircle2, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { AlgorithmType } from '../types';

interface ComparisonMatrixProps {
  selectedAlgorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  selectedAlgorithm,
  onSelectAlgorithm,
}) => {
  return (
    <div className="glass-panel p-5 mb-8">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
        <Table className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
          Algorithm System Design Comparison Matrix
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="text-xs uppercase font-heading text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-3">Algorithm</th>
              <th className="p-3">Time Complexity</th>
              <th className="p-3">Space Complexity</th>
              <th className="p-3">Supports Bursts?</th>
              <th className="p-3">Boundary Vulnerability</th>
              <th className="p-3">Distributed Scale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {Object.values(ALGORITHMS).map((algo) => {
              const isSelected = algo.id === selectedAlgorithm;
              return (
                <tr
                  key={algo.id}
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/10 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-white flex items-center gap-2 font-heading">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: algo.accentColor }}
                    />
                    {algo.name}
                  </td>
                  <td className="p-3 font-mono text-blue-300">{algo.timeComplexity}</td>
                  <td className="p-3 font-mono text-gray-300">{algo.spaceComplexity}</td>
                  <td className="p-3 font-mono">
                    {algo.burstSupport ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> No (Smooths)
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    {algo.id === 'fixed-window' ? (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> High (2x Limit)
                      </span>
                    ) : algo.id === 'sliding-window-counter' ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Low (Approx)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Immune
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-semibold font-mono">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        algo.distributedSupport === 'High'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {algo.distributedSupport}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
