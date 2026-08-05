import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { ShieldAlert, ShieldCheck, Activity, Server } from 'lucide-react';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface RouteTarget {
  path: string;
  service: string;
  authenticated: boolean;
  rateLimitPerSec: number;
}

export const ApiGatewayModule: React.FC = () => {
  // Circuit Breaker State Machine
  const [circuitState, setCircuitState] = useState<CircuitBreakerState>('CLOSED');
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [failureThreshold] = useState(3);

  // JWT Auth verification toggle
  const [isAuthValid, setIsAuthValid] = useState<boolean>(true);

  // Logs & Stats
  const [logs, setLogs] = useState<Array<{ id: string; timestamp: string; path: string; status: number; message: string }>>([]);

  const routes: RouteTarget[] = [
    { path: '/api/v1/users', service: 'User Service', authenticated: true, rateLimitPerSec: 100 },
    { path: '/api/v1/orders', service: 'Order Service', authenticated: true, rateLimitPerSec: 50 },
    { path: '/api/v1/catalog', service: 'Catalog Service', authenticated: false, rateLimitPerSec: 500 },
  ];

  // Dispatch Request through API Gateway pipeline
  const handleDispatchRequest = (path: string, simulateBackendError = false) => {
    const timestamp = new Date().toLocaleTimeString();

    // Step 1: Circuit Breaker Check
    if (circuitState === 'OPEN') {
      soundFx.playBlocked();
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          timestamp,
          path,
          status: 503,
          message: '503 Service Unavailable: Circuit Breaker is OPEN (Short-Circuited)',
        },
        ...prev.slice(0, 20),
      ]);
      return;
    }

    // Step 2: JWT Auth Verification Check
    const targetRoute = routes.find((r) => r.path === path);
    if (targetRoute?.authenticated && !isAuthValid) {
      soundFx.playBlocked();
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          timestamp,
          path,
          status: 401,
          message: '401 Unauthorized: Invalid or missing JWT signature',
        },
        ...prev.slice(0, 20),
      ]);
      return;
    }

    // Step 3: Backend Upstream Call Simulation
    if (simulateBackendError) {
      soundFx.playBlocked();
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);

      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          timestamp,
          path,
          status: 500,
          message: `500 Internal Error (Failure ${newFailures}/${failureThreshold})`,
        },
        ...prev.slice(0, 20),
      ]);

      if (newFailures >= failureThreshold) {
        setCircuitState('OPEN');

        // Auto recovery to HALF_OPEN after 5s
        setTimeout(() => {
          setCircuitState('HALF_OPEN');
        }, 5000);
      }
    } else {
      soundFx.playSuccess();
      setLogs((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          timestamp,
          path,
          status: 200,
          message: `200 OK: Routed via Gateway -> ${targetRoute?.service}`,
        },
        ...prev.slice(0, 20),
      ]);

      if (circuitState === 'HALF_OPEN') {
        setCircuitState('CLOSED');
        setConsecutiveFailures(0);
      }
    }
  };

  const handleResetCircuit = () => {
    setCircuitState('CLOSED');
    setConsecutiveFailures(0);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-purple-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-purple-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ShieldAlert className="w-5 h-5 text-purple-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent">
                API Gateway & Circuit Breaker Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Simulate centralized request routing, JWT authentication validation, and Resilience4j-style circuit breaker state transitions.
            </p>
          </div>

          {/* Circuit Breaker Status Pill */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-purple-500/30 shadow-inner">
            <span className="text-xs font-mono text-slate-300 font-bold">Circuit State:</span>
            <span
              className={`px-3 py-1 text-xs font-mono font-extrabold rounded-xl border uppercase tracking-wider ${
                circuitState === 'CLOSED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : circuitState === 'OPEN'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400'
              }`}
            >
              {circuitState === 'CLOSED' && '🟢 CLOSED (Normal)'}
              {circuitState === 'OPEN' && '🔴 OPEN (Tripped)'}
              {circuitState === 'HALF_OPEN' && '🟡 HALF-OPEN (Probing)'}
            </span>
          </div>
        </div>

        {/* 3-Tier Pipeline Visualizer */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/35 mb-6 shadow-xl space-y-4">
          <div className="text-xs font-mono text-purple-200 font-bold uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> API Gateway Pipeline Architecture
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center font-mono text-xs">
            {/* Step 1: Client Request */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-400 text-[10px] block uppercase">1. Client Request</span>
              <div className="text-white font-bold truncate">HTTP GET /api/v1/...</div>
              <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 block">Incoming Payload</span>
            </div>

            {/* Step 2: Auth Verification */}
            <div className={`p-4 rounded-xl border text-center space-y-2 ${isAuthValid ? 'bg-slate-950 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/40'}`}>
              <span className="text-slate-400 text-[10px] block uppercase">2. JWT Auth Check</span>
              <div className="flex items-center justify-center gap-1 font-bold text-white">
                {isAuthValid ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
                {isAuthValid ? 'Valid Token' : 'Invalid Signature'}
              </div>
              <button
                onClick={() => setIsAuthValid(!isAuthValid)}
                className="text-[10px] text-purple-300 hover:text-white bg-purple-500/20 px-2.5 py-1 rounded border border-purple-400/30 cursor-pointer transition-all"
              >
                Toggle Auth: {isAuthValid ? 'Pass' : 'Reject 401'}
              </button>
            </div>

            {/* Step 3: Circuit Breaker */}
            <div className={`p-4 rounded-xl border text-center space-y-2 ${
              circuitState === 'CLOSED' ? 'bg-slate-950 border-emerald-500/30' : circuitState === 'OPEN' ? 'bg-rose-950/40 border-rose-400' : 'bg-amber-950/30 border-amber-400'
            }`}>
              <span className="text-slate-400 text-[10px] block uppercase">3. Circuit Breaker</span>
              <div className="font-bold text-white text-xs">{consecutiveFailures} / {failureThreshold} Failures</div>
              {circuitState === 'OPEN' && (
                <button
                  onClick={handleResetCircuit}
                  className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/40 cursor-pointer"
                >
                  Reset Circuit
                </button>
              )}
            </div>

            {/* Step 4: Upstream Microservice */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-400 text-[10px] block uppercase">4. Upstream Service</span>
              <div className="text-emerald-300 font-bold flex items-center justify-center gap-1">
                <Server className="w-4 h-4" /> Microservice Pool
              </div>
              <span className="text-[10px] text-slate-400 block">HTTP 200 OK</span>
            </div>
          </div>
        </div>

        {/* Route Action Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {routes.map((route) => (
            <div key={route.path} className="p-4 bg-slate-900/90 rounded-2xl border border-purple-500/35 flex flex-col justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-white font-bold">{route.path}</span>
                  <span className="text-[10px] text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">{route.service}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {route.authenticated ? '🔒 Requires JWT Bearer' : '🌐 Public Access'} • Max {route.rateLimitPerSec} RPS
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDispatchRequest(route.path, false)}
                  className="btn-primary text-xs flex-1 py-2 justify-center font-bold cursor-pointer"
                >
                  Route 200 OK
                </button>
                <button
                  onClick={() => handleDispatchRequest(route.path, true)}
                  className="btn-secondary text-xs text-rose-300 bg-rose-500/20 border-rose-500/50 hover:bg-rose-500/30 py-2 px-3 font-bold cursor-pointer"
                  title="Simulate upstream 500 server crash"
                >
                  Fail 500
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Terminal Routing & Error Logs */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/35 font-mono text-xs text-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Activity className="w-4 h-4 text-purple-400" /> Gateway Request Execution Logs ({logs.length})
            </div>
            {logs.length > 0 && (
              <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer">
                Clear Logs
              </button>
            )}
          </div>

          <div className="max-h-44 overflow-y-auto space-y-2 custom-scrollbar text-xs">
            {logs.length === 0 ? (
              <div className="text-slate-400 italic">No requests dispatched through gateway yet. Click "Route 200 OK" or "Fail 500" above.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">[{log.timestamp}]</span>
                  <span className="text-purple-300 font-bold">{log.path}</span>
                  <span className={`font-bold ml-auto ${log.status === 200 ? 'text-emerald-300' : log.status === 401 ? 'text-amber-300' : 'text-rose-400'}`}>
                    [{log.message}]
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
