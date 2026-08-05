import React, { useState } from 'react';
import type { AlgorithmType } from '../types';
import { EXPLANATIONS } from '../utils/explanations';
import { BookOpen, CheckCircle2, AlertTriangle, Layers, Cpu, Compass, X, Sparkles, Lightbulb } from 'lucide-react';

interface EducationalGuideProps {
  algorithm: AlgorithmType;
}

export const EducationalGuide: React.FC<EducationalGuideProps> = ({ algorithm }) => {
  const [showAllModal, setShowAllModal] = useState(false);
  const info = EXPLANATIONS[algorithm];

  return (
    <div className="glass-panel p-6 sm:p-8 mb-8 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-white-10 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-indigo-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg glow-blue">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-extrabold text-white tracking-tight font-heading">
                {info.title} Architecture Breakdown
              </h3>
              <span className="badge badge-cyan text-xs">Interactive Handbook</span>
            </div>
            <p className="text-xs text-gray-300 mt-0-5 font-sans">
              Learn the internal engine mechanics, real-world analogy, formula math & system tradeoffs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAllModal(true)}
          className="btn-secondary text-xs px-4 py-2-5 font-mono hover:text-cyan-300 shadow-md transition-all flex items-center gap-2"
        >
          <Compass className="w-4 h-4 text-cyan-400" /> Compare All 5 Limiter Types
        </button>
      </div>

      {/* Top Row: Real-World Analogy & Math Formula */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
        {/* Real-World Analogy Box (7 Cols) */}
        <div className="md:col-span-7 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-black/80 p-6 rounded-2xl border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Lightbulb className="w-24 h-24 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 font-heading">
              <Sparkles className="w-4 h-4" /> Real-World Mental Model
            </div>
            <h4 className="text-base font-extrabold text-white font-heading mb-2 flex items-center gap-2">
              {info.analogy}
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed font-sans">
              {info.simpleSummary}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white-10 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase font-heading">Production Systems:</span>
            {info.useCases.map((uc, i) => (
              <span key={i} className="text-xs font-mono bg-blue-950-40 text-blue-300 px-3 py-1 rounded-lg border border-blue-500-30 shadow-sm">
                {uc}
              </span>
            ))}
          </div>
        </div>

        {/* Core Formula Box (5 Cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-black/80 p-6 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 font-heading">
              <Cpu className="w-4 h-4" /> Mathematical Algorithm Formula
            </div>
            <div className="bg-black-90 p-4 rounded-xl border border-cyan-500-40 font-mono text-xs text-cyan-300 leading-relaxed shadow-inner glow-cyan">
              {info.formula}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white-10 text-xs text-gray-300 font-mono flex items-center justify-between">
            <span>Evaluation Time:</span>
            <span className="text-emerald-400 font-bold">Continuous Request Tick</span>
          </div>
        </div>
      </div>

      {/* 4-Step Pipeline Stepper */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-heading">
          <Layers className="w-4 h-4 text-blue-400" /> Step-by-Step Request Execution Pipeline:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {info.steps.map((st) => (
            <div
              key={st.step}
              className="bg-black-60 p-5 rounded-2xl border border-white-10 relative flex flex-col justify-between hover:border-blue-500-40 transition-all hover:scale-[1.01] shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-600-30 border border-blue-500-40 text-blue-400 font-bold font-mono text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    0{st.step}
                  </span>
                  <span className="text-xs font-mono text-gray-400">Step {st.step}</span>
                </div>
                <h5 className="text-xs font-bold text-white font-heading mb-1.5">{st.title}</h5>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pros vs Cons Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-gradient-to-br from-emerald-950-40 to-black-80 p-5 rounded-2xl border border-emerald-500-30 shadow-lg">
          <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 mb-3 font-heading">
            <CheckCircle2 className="w-4.5 h-4.5" /> Architectural Strengths & Key Advantages
          </h5>
          <ul className="space-y-2 text-xs text-gray-200">
            {info.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tradeoffs */}
        <div className="bg-gradient-to-br from-rose-950-40 to-black-80 p-5 rounded-2xl border border-rose-500-30 shadow-lg">
          <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 mb-3 font-heading">
            <AlertTriangle className="w-4.5 h-4.5" /> Tradeoffs & Potential System Vulnerabilities
          </h5>
          <ul className="space-y-2 text-xs text-gray-200">
            {info.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold text-sm">⚠️</span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactive Handbook Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-85 backdrop-blur-md">
          <div className="glass-panel p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto border-blue-500-40 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white-10">
              <div className="flex items-center gap-3">
                <Compass className="w-7 h-7 text-cyan-400" />
                <div>
                  <h3 className="text-xl font-extrabold text-white font-heading">
                    Master System Design Rate Limiting Handbook
                  </h3>
                  <p className="text-xs text-gray-300 font-mono">
                    Comprehensive architectural comparison of all 5 rate limiter techniques
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {Object.values(EXPLANATIONS).map((item) => (
                <div key={item.id} className="bg-black-60 p-6 rounded-2xl border border-white-10 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <h4 className="text-base font-bold text-white font-heading flex items-center gap-2">
                      <span>{item.analogy.split(' ')[0]}</span> {item.title}
                    </h4>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500-10 px-3 py-1 rounded-lg border border-cyan-500-20">
                      {item.formula.split('|')[0]}
                    </span>
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed mb-4">
                    {item.simpleSummary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-emerald-950-30 p-4 rounded-xl border border-emerald-500-20">
                      <strong className="text-emerald-400 block mb-1.5 font-heading">Pros:</strong>
                      <ul className="space-y-1.5 text-gray-200">
                        {item.pros.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-400">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-rose-950-30 p-4 rounded-xl border border-rose-500-20">
                      <strong className="text-rose-400 block mb-1.5 font-heading">Tradeoffs:</strong>
                      <ul className="space-y-1.5 text-gray-200">
                        {item.cons.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-rose-400">⚠️</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAllModal(false)}
              className="btn-primary w-full mt-6 justify-center py-2.5 text-sm"
            >
              Close Handbook
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
