import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { Radio, ShieldCheck } from 'lucide-react';

export interface ServiceInstance {
  id: string;
  name: string;
  ip: string;
  port: number;
  health: 'HEALTHY' | 'UNHEALTHY';
  lastHeartbeatSecAgo: number;
}

export const ServiceDiscoveryModule: React.FC = () => {
  const [instances, setInstances] = useState<ServiceInstance[]>([
    { id: 'inst-1', name: 'Auth-Service-A', ip: '10.0.2.14', port: 8080, health: 'HEALTHY', lastHeartbeatSecAgo: 1 },
    { id: 'inst-2', name: 'Auth-Service-B', ip: '10.0.2.15', port: 8080, health: 'HEALTHY', lastHeartbeatSecAgo: 2 },
    { id: 'inst-3', name: 'Payment-Service-A', ip: '10.0.4.99', port: 9090, health: 'HEALTHY', lastHeartbeatSecAgo: 1 },
  ]);

  const [registryLog, setRegistryLog] = useState<string | null>(null);

  const handleRegister = () => {
    const nextIdx = instances.length + 1;
    const newInst: ServiceInstance = {
      id: `inst-${nextIdx}`,
      name: `Order-Service-${nextIdx}`,
      ip: `10.0.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 200)}`,
      port: 8000 + nextIdx,
      health: 'HEALTHY',
      lastHeartbeatSecAgo: 0,
    };
    setInstances((prev) => [...prev, newInst]);
    setRegistryLog(`Consul Peer Sync: Registered [${newInst.name}] at ${newInst.ip}:${newInst.port}`);
    soundFx.playSuccess();
  };

  const handleToggleHealth = (id: string) => {
    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === id
          ? {
              ...inst,
              health: inst.health === 'HEALTHY' ? 'UNHEALTHY' : 'HEALTHY',
              lastHeartbeatSecAgo: inst.health === 'HEALTHY' ? 15 : 0,
            }
          : inst
      )
    );
    soundFx.playBlocked();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-teal-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-teal-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Radio className="w-5 h-5 text-teal-300 animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-white via-teal-100 to-teal-400 bg-clip-text text-transparent">
                Service Discovery & Health Check Registry (Consul / Eureka)
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Test dynamic IP registration, peer heartbeat signals, and automatic deregistration on health check failure.
            </p>
          </div>

          <button onClick={handleRegister} className="btn-primary text-xs py-2 px-5 font-bold cursor-pointer">
            Register New Instance
          </button>
        </div>

        {registryLog && (
          <div className="mb-6 p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-300 text-xs font-mono flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>{registryLog}</span>
            </div>
            <span className="text-[10px] bg-teal-500/20 px-2 py-0.5 rounded border border-teal-400/40 font-bold uppercase">
              REGISTRY UPDATED ⚡
            </span>
          </div>
        )}

        {/* Registry Table */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/35 shadow-xl font-mono text-xs">
          <div className="text-teal-300 font-bold font-heading text-sm mb-3.5 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Dynamic Peer Registry Catalog</span>
            <span className="text-slate-400 text-xs font-normal">{instances.length} Registered Microservices</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-3">INSTANCE ID</th>
                  <th className="p-3">SERVICE NAME</th>
                  <th className="p-3">ENDPOINT (IP:PORT)</th>
                  <th className="p-3">LAST HEARTBEAT</th>
                  <th className="p-3 text-right">HEALTH STATUS</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((inst) => (
                  <tr key={inst.id} className="border-b border-slate-900 hover:bg-slate-900/60">
                    <td className="p-3 text-cyan-300 font-bold">{inst.id}</td>
                    <td className="p-3 text-white font-semibold">{inst.name}</td>
                    <td className="p-3 text-slate-300">{inst.ip}:{inst.port}</td>
                    <td className="p-3 text-amber-300">{inst.lastHeartbeatSecAgo}s ago</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleHealth(inst.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border cursor-pointer ${
                          inst.health === 'HEALTHY' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-rose-500/20 text-rose-300 border-rose-400'
                        }`}
                      >
                        {inst.health === 'HEALTHY' ? '🟢 HEALTHY' : '🔴 DOWN'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
