import React, { useState } from 'react';
import type { AlgorithmType } from '../types';
import { CODE_SNIPPETS } from '../utils/codeSnippets';
import { Code2, Check, Copy, Terminal } from 'lucide-react';

interface CodeSnippetsProps {
  algorithm: AlgorithmType;
}

export const CodeSnippets: React.FC<CodeSnippetsProps> = ({ algorithm }) => {
  const [activeLang, setActiveLang] = useState<'python' | 'javascript' | 'go' | 'java'>('python');
  const [copied, setCopied] = useState(false);

  const snippets = CODE_SNIPPETS[algorithm];
  const currentCode = snippets[activeLang];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Production Implementation Snippets
          </h3>
        </div>

        {/* Language Tabs & Copy Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 text-xs">
            {[
              { id: 'python', label: '🐍 Python' },
              { id: 'javascript', label: '⚡ Node.js' },
              { id: 'go', label: '🐹 Go' },
              { id: 'java', label: '☕ Java' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setActiveLang(lang.id as any)}
                className={`px-3 py-1 rounded-lg font-mono transition-all ${
                  activeLang === lang.id
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="btn-secondary text-xs px-3 py-1.5 hover:text-emerald-400 font-mono"
            title="Copy snippet"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display Box */}
      <div className="relative rounded-2xl overflow-hidden bg-black/85 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs font-mono text-gray-400">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            {algorithm}-{activeLang}.{activeLang === 'python' ? 'py' : activeLang === 'javascript' ? 'ts' : activeLang === 'go' ? 'go' : 'java'}
          </span>
          <span className="text-[10px] text-gray-500">Atomic & Distributed Safe</span>
        </div>
        <pre className="p-4 text-xs font-mono text-gray-200 overflow-x-auto leading-relaxed max-h-[350px]">
          <code>{currentCode}</code>
        </pre>
      </div>
    </div>
  );
};
