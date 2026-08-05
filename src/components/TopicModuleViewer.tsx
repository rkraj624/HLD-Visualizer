import React, { useState } from 'react';
import { HLD_TOPICS } from '../utils/hldTopics';
import { EXPLANATIONS } from '../utils/explanations';
import { CODE_SNIPPETS } from '../utils/codeSnippets';
import {
  CheckCircle2, XCircle, Code2, BookOpen, Layers, Copy, Check
} from 'lucide-react';
import { LoadBalancerModule } from './topics/LoadBalancerModule';
import { CachingModule } from './topics/CachingModule';
import { ConsistentHashingModule } from './topics/ConsistentHashingModule';

interface TopicModuleViewerProps {
  topicId: string;
}

export const TopicModuleViewer: React.FC<TopicModuleViewerProps> = ({ topicId }) => {
  const topic = HLD_TOPICS.find((t) => t.id === topicId) || HLD_TOPICS[0];
  const [activeTab, setActiveTab] = useState<'visualizer' | 'architecture' | 'code'>('visualizer');
  const [copiedCode, setCopiedCode] = useState(false);

  const defaultExplanation = EXPLANATIONS['token-bucket'];
  const defaultSnippet = CODE_SNIPPETS['token-bucket'].javascript;

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
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 font-bold text-lg font-mono"
              style={{
                backgroundColor: `${topic.accentColor}25`,
                borderColor: topic.accentColor,
                color: topic.accentColor,
              }}
            >
              {topic.shortTitle.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight font-heading">
                  {topic.title}
                </h2>
                {topic.status === 'interactive' ? (
                  <span className="badge badge-cyan">⚡ Live Simulator</span>
                ) : (
                  <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/40">📄 HLD Spec</span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{topic.description}</p>
            </div>
          </div>

          {/* Module Tab Selector */}
          <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                activeTab === 'visualizer'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Interactive Sim
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              HLD Spec & Trade-offs
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-all ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Code Blueprint
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE VISUALIZER SIMULATOR */}
      {activeTab === 'visualizer' && (
        <div>
          {topicId === 'load-balancing' && <LoadBalancerModule />}
          {topicId === 'caching' && <CachingModule />}
          {topicId === 'consistent-hashing' && <ConsistentHashingModule />}

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
                {defaultExplanation.pros.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons & Pitfalls */}
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Engineering Pitfalls & Challenges
              </h4>
              <ul className="text-xs text-gray-300 space-y-2 leading-relaxed">
                {defaultExplanation.cons.map((dis, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{dis}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Real World Production Cases */}
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Real-World Enterprise Implementations
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {defaultExplanation.useCases.map((company, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-bold"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTION CODE BLUEPRINT */}
      {activeTab === 'code' && (
        <div className="glass-panel p-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" /> {topic.title} Production Implementation
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Reference TypeScript implementation pattern.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(defaultSnippet);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <pre className="bg-slate-950 p-5 rounded-2xl border border-white/10 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed custom-scrollbar max-h-96">
            <code>{defaultSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
