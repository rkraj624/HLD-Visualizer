import React, { useState } from 'react';
import type { SimulationState, RequestItem } from '../types';
import { BarChart3, CheckCircle, XCircle, Percent, ListFilter, Trash2, Activity, Info, X, Radio } from 'lucide-react';

interface MetricsDashboardProps {
  state: SimulationState;
  onClearLogs: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  state,
  onClearLogs,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'allowed' | 'rejected'>('all');
  const [selectedLog, setSelectedLog] = useState<RequestItem | null>(null);

  const rejectionRate =
    state.totalRequests > 0
      ? ((state.rejectedRequests / state.totalRequests) * 100).toFixed(1)
      : '0.0';

  const filteredLogs = state.logs.filter((log) => {
    if (filterStatus === 'allowed') return log.status === 'allowed';
    if (filterStatus === 'rejected') return log.status === 'rejected';
    return true;
  });

  // Calculate live sparkline points for traffic SVG chart
  const recentHistory = state.logs.slice(0, 25).reverse();

  // Generate SVG path string for smooth curve
  const points = recentHistory.map((item, idx) => {
    const x = (idx / Math.max(1, recentHistory.length - 1)) * 100;
    const y = item.status === 'allowed' ? 25 : 75;
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaD = points.length > 0 ? `M ${points[0].split(',')[0]},100 L ${points.join(' L ')} L ${points[points.length - 1].split(',')[0]},100 Z` : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
      {/* Telemetry Metrics & Sparkline (Left 5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* 4 Core Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Traffic */}
          <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-xs font-bold uppercase tracking-wider font-heading text-white">Total Traffic</span>
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">{state.totalRequests}</span>
              <span className="text-xs text-gray-300 block mt-1">Total incoming hits</span>
            </div>
          </div>

          {/* Card 2: 200 OK Passed */}
          <div className="glass-panel p-4 flex flex-col justify-between border-emerald-500-30 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-bold uppercase tracking-wider font-heading">200 Passed</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {state.allowedRequests}
              </span>
              <span className="text-xs text-gray-300 block mt-1">Served by backend</span>
            </div>
          </div>

          {/* Card 3: 429 Blocked */}
          <div className="glass-panel p-4 flex flex-col justify-between border-rose-500-30 relative overflow-hidden">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-xs font-bold uppercase tracking-wider font-heading">429 Blocked</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
                {state.rejectedRequests}
              </span>
              <span className="text-xs text-gray-300 block mt-1">Rate limited</span>
            </div>
          </div>

          {/* Card 4: Rejection Rate % */}
          <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-bold uppercase tracking-wider font-heading">Drop Rate</span>
              <Percent className="w-4 h-4" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">{rejectionRate}%</span>
              <span className="text-xs text-gray-300 block mt-1">Rejection ratio</span>
            </div>
          </div>
        </div>

        {/* Live Traffic Stream Graph Box */}
        <div className="glass-panel p-4 flex flex-col justify-between flex-grow min-h-220px">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white-10">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1-5 font-heading">
              <Activity className="w-3-5 h-3-5 text-cyan-400" /> Real-Time Traffic Stream Graph
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500-10 px-2 py-0-5 rounded border border-cyan-500-20">
              Live Window ({recentHistory.length} pts)
            </span>
          </div>

          {/* SVG Graph / Active State */}
          <div className="h-36 w-full relative flex items-end pt-2 bg-black-60 rounded-xl p-3 border border-white-10 overflow-hidden">
            {recentHistory.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2 text-gray-300">
                <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-300 font-semibold">
                  Live Traffic Monitor Active
                </span>
                <span className="text-xs text-gray-300 max-w-xs">
                  Turn on Traffic Generator slider or click "Send Single Request" to see real-time graph points!
                </span>
              </div>
            ) : (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(16, 185, 129, 0.25)" strokeDasharray="2,2" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(244, 63, 94, 0.25)" strokeDasharray="2,2" strokeWidth="0.5" />

                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={areaD} fill="url(#areaGradient)" />
                <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />

                {recentHistory.map((item, idx) => {
                  const x = (idx / Math.max(1, recentHistory.length - 1)) * 100;
                  const isAllowed = item.status === 'allowed';
                  const y = isAllowed ? 25 : 75;
                  return (
                    <g key={item.id + idx}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="2.5"
                        className={isAllowed ? 'fill-emerald-400' : 'fill-rose-500'}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-gray-300 mt-2 px-1">
            <span className="text-emerald-400 font-semibold">● 200 OK (Allowed)</span>
            <span className="text-rose-400 font-semibold">● 429 Blocked (Limited)</span>
          </div>
        </div>
      </div>

      {/* Live HTTP Telemetry Stream Table (Right 7 Cols - FULL HEIGHT SCROLLABLE) */}
      <div className="lg:col-span-7 glass-panel p-6 flex flex-col relative h-full min-h-420px">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-white-10 gap-3">
          <div className="flex items-center gap-2.5">
            <ListFilter className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                Live HTTP Request Telemetry Stream
              </h3>
              <span className="text-xs text-gray-300 font-mono">
                Full-height real-time log inspector ({filteredLogs.length} displayed)
              </span>
            </div>
          </div>

          {/* Filter Tabs with Dynamic Hover & Active CSS */}
          <div className="flex items-center gap-2">
            <div className="flex bg-black-80 p-1.5 rounded-xl border border-white-20 text-xs font-mono gap-1.5 shadow-inner">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3-5 py-1-5 rounded-lg transition-all cursor-pointer transform hover:scale-105 font-bold ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white shadow-lg border border-blue-400 glow-blue'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                All ({state.logs.length})
              </button>

              <button
                onClick={() => setFilterStatus('allowed')}
                className={`px-3-5 py-1-5 rounded-lg transition-all cursor-pointer transform hover:scale-105 font-bold ${
                  filterStatus === 'allowed'
                    ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400 glow-emerald'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                200 OK
              </button>

              <button
                onClick={() => setFilterStatus('rejected')}
                className={`px-3-5 py-1-5 rounded-lg transition-all cursor-pointer transform hover:scale-105 font-bold ${
                  filterStatus === 'rejected'
                    ? 'bg-rose-600 text-white shadow-lg border border-rose-400 glow-rose'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                429 Blocked
              </button>
            </div>

            <button
              onClick={onClearLogs}
              className="btn-secondary text-xs px-3-5 py-2 hover:text-rose-400 hover:border-rose-500-40 transition-all transform hover:scale-105 font-mono shadow-md"
              title="Clear telemetry logs"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Clear
            </button>
          </div>
        </div>

        {/* FULL HEIGHT Scrollable Log Table Container */}
        <div className="overflow-y-auto flex-grow rounded-2xl border border-white-10 bg-black-70 shadow-inner h-96 min-h-350px">
          {filteredLogs.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 text-gray-300 italic font-mono gap-2">
              <Activity className="w-8 h-8 text-blue-400 animate-pulse" />
              <span>No matching HTTP telemetry entries.</span>
              <span className="text-xs text-gray-400">Click "Send Single Request" or turn on Traffic Generator slider!</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-black-90 z-10 shadow-md">
                <tr className="text-xs uppercase font-mono text-white border-b border-white-20 bg-slate-900">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Endpoint</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Gatekeeper Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white-10 text-xs font-mono">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-blue-600-20 transition-all cursor-pointer group"
                  >
                    <td className="py-3 px-4 text-gray-300 group-hover:text-white">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour12: false,
                        minute: '2-digit',
                        second: '2-digit',
                        fractionalSecondDigits: 3,
                      })}
                    </td>
                    <td className="py-3 px-4 text-blue-300 font-semibold">{log.clientIp}</td>
                    <td className="py-3 px-4 text-white font-bold">{log.endpoint}</td>
                    <td className="py-3 px-4">
                      {log.status === 'allowed' ? (
                        <span className="badge badge-emerald text-xs font-bold">200 OK</span>
                      ) : (
                        <span className="badge badge-rose text-xs font-bold">429 TOO MANY</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-amber-300 font-medium group-hover:text-white">
                      {log.reason || 'Token consumed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Inspector Drawer for Selected Log */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-85 backdrop-blur-md">
            <div className="glass-panel p-6 max-w-md w-full border-blue-500-40 relative glow-blue shadow-2xl">
              <button
                onClick={() => setSelectedLog(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <Info className="w-6 h-6 text-blue-400" />
                <h3 className="text-base font-bold text-white font-heading">HTTP Request Inspector</h3>
              </div>

              <div className="space-y-2.5 text-xs font-mono bg-black-60 p-4 rounded-xl border border-white-10 shadow-inner">
                <div className="flex justify-between border-b border-white-10 pb-1.5">
                  <span className="text-gray-400">Request ID:</span>
                  <span className="text-white font-bold">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between border-b border-white-10 pb-1.5">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="text-white">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
                <div className="flex justify-between border-b border-white-10 pb-1.5">
                  <span className="text-gray-400">Client IP:</span>
                  <span className="text-white">{selectedLog.clientIp}</span>
                </div>
                <div className="flex justify-between border-b border-white-10 pb-1.5">
                  <span className="text-gray-400">Endpoint:</span>
                  <span className="text-blue-300 font-bold">{selectedLog.endpoint}</span>
                </div>
                <div className="flex justify-between border-b border-white-10 pb-1.5">
                  <span className="text-gray-400">HTTP Status:</span>
                  <span className={selectedLog.status === 'allowed' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {selectedLog.status === 'allowed' ? '200 OK' : '429 Too Many Requests'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gatekeeper Note:</span>
                  <span className="text-amber-300 font-medium">{selectedLog.reason || 'Token consumed'}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="btn-primary w-full mt-5 justify-center py-2.5"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
