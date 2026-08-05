import React, { useState } from 'react';
import { soundFx } from '../../../utils/audio';
import { MessageSquare } from 'lucide-react';

export interface QueueMessage {
  id: string;
  topic: string;
  payload: string;
  status: 'PENDING' | 'CONSUMED' | 'DEAD_LETTER';
  retries: number;
}

export const MessageQueuesModule: React.FC = () => {
  const [messages, setMessages] = useState<QueueMessage[]>([
    { id: 'msg-101', topic: 'user.events', payload: '{ event: "USER_SIGNED_UP", userId: 991 }', status: 'PENDING', retries: 0 },
    { id: 'msg-102', topic: 'order.checkout', payload: '{ event: "PAYMENT_COMPLETED", orderId: 504 }', status: 'PENDING', retries: 0 },
    { id: 'msg-103', topic: 'email.notifications', payload: '{ event: "SEND_WELCOME_MAIL", email: "a@x.com" }', status: 'PENDING', retries: 0 },
  ]);

  const [dlqMessages, setDlqMessages] = useState<QueueMessage[]>([]);
  const [consumedCount, setConsumedCount] = useState(42);
  const [customPayloadInput, setCustomPayloadInput] = useState('');

  const handlePublish = () => {
    const payload = customPayloadInput || `{ event: "ORDER_CREATED", id: ${Math.floor(Math.random() * 9000) + 1000} }`;
    const newMsg: QueueMessage = {
      id: `msg-${Math.floor(Math.random() * 900) + 100}`,
      topic: 'order.events',
      payload,
      status: 'PENDING',
      retries: 0,
    };
    setMessages((prev) => [...prev, newMsg]);
    setCustomPayloadInput('');
    soundFx.playSuccess();
  };

  const handleConsumeNext = () => {
    const pendingMsg = messages.find((m) => m.status === 'PENDING');
    if (!pendingMsg) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === pendingMsg.id ? { ...m, status: 'CONSUMED' } : m))
    );
    setConsumedCount((c) => c + 1);
    soundFx.playSuccess();
  };

  const handleFailAndRetry = (msgId: string) => {
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === msgId);
      if (!msg) return prev;

      if (msg.retries >= 2) {
        // Move to DLQ
        setDlqMessages((dlq) => [{ ...msg, status: 'DEAD_LETTER' }, ...dlq]);
        soundFx.playBlocked();
        return prev.filter((m) => m.id !== msgId);
      } else {
        soundFx.playBlocked();
        return prev.map((m) => (m.id === msgId ? { ...m, retries: m.retries + 1 } : m));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-violet-500/30 bg-slate-950/85 shadow-2xl">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 border-b border-violet-500/20 pb-5">
          <div>
            <h3 className="text-xl font-extrabold text-white font-heading flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/50 text-violet-300 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <MessageSquare className="w-5 h-5 text-violet-300" />
              </div>
              <span className="bg-gradient-to-r from-white via-violet-100 to-violet-400 bg-clip-text text-transparent">
                Message Queue & Event Streaming Simulator (Kafka / RabbitMQ)
              </span>
            </h3>
            <p className="text-xs text-slate-300 font-mono mt-1">
              Test Producer event publishing, Consumer worker polling, At-Least-Once delivery retries, and Dead Letter Queue (DLQ) routing.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-violet-500/30 text-emerald-300 font-bold">
              Acked: {consumedCount}
            </span>
            <span className="bg-slate-900 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 font-bold">
              DLQ: {dlqMessages.length}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-violet-500/40 mb-6 shadow-2xl space-y-4">
          <div className="text-xs font-mono text-violet-300 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Producer Event Dispatcher</span>
            <span className="text-[11px] text-slate-400 font-normal">Active Partition: 0</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Event Payload (e.g. { event: 'USER_BUY', total: 499 })"
              value={customPayloadInput}
              onChange={(e) => setCustomPayloadInput(e.target.value)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-white flex-1 focus:outline-none focus:border-violet-400 transition-colors"
            />
            <button onClick={handlePublish} className="btn-primary text-xs py-2.5 px-6 font-bold cursor-pointer whitespace-nowrap">
              Publish Event
            </button>
            <button onClick={handleConsumeNext} className="btn-secondary text-xs text-emerald-300 bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 py-2.5 px-6 font-bold cursor-pointer whitespace-nowrap">
              Consume Next
            </button>
          </div>
        </div>

        {/* Queues Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Buffer Queue */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-950/90 border border-violet-500/40 shadow-2xl space-y-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="text-slate-200 font-bold font-heading text-base border-b border-slate-800/80 pb-4 mb-4 flex items-center justify-between">
                <span className="text-violet-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-400" /> Topic Queue Buffer ({messages.length} Messages)
                </span>
                <span className="text-[10px] text-violet-300 bg-violet-500/15 px-3 py-1 rounded-full border border-violet-500/40 font-bold uppercase tracking-wider">
                  Pub/Sub Partition 0
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {messages.length === 0 ? (
                  <div className="text-slate-500 italic p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800/60">
                    Queue buffer is currently empty. Click "Publish Event" above.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="p-3.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-300 font-bold text-xs">{m.id}</span>
                          <span className="text-slate-400 text-[11px] font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {m.topic}
                          </span>
                          {m.status === 'CONSUMED' && (
                            <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/40 font-extrabold uppercase">
                              ACKED ⚡
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 text-[11px] font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 truncate" title={m.payload}>
                          {m.payload}
                        </div>
                      </div>

                      {m.status === 'PENDING' && (
                        <button
                          onClick={() => handleFailAndRetry(m.id)}
                          className="text-[10px] text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/35 px-3 py-1.5 rounded-lg border border-rose-500/40 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto font-bold"
                        >
                          Simulate Fail ({m.retries}/3)
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dead Letter Queue DLQ */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/90 border border-rose-500/40 shadow-2xl space-y-4 font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="text-slate-200 font-bold font-heading text-base border-b border-slate-800/80 pb-4 mb-4 flex items-center justify-between">
                <span className="text-rose-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" /> Dead Letter Queue (DLQ)
                </span>
                <span className="text-[10px] text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/40 font-bold uppercase tracking-wider">
                  Poison Pills
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {dlqMessages.length === 0 ? (
                  <div className="text-slate-500 italic p-6 text-center bg-slate-900/50 rounded-xl border border-slate-800/60">
                    DLQ is currently clean. Unacknowledged events after 3 retry failures will route here automatically.
                  </div>
                ) : (
                  dlqMessages.map((m) => (
                    <div key={m.id} className="p-3.5 bg-rose-950/30 rounded-xl border border-rose-500/40 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-rose-300 font-bold">{m.id}</span>
                        <span className="text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-400/40 font-bold">
                          3/3 Retries Failed
                        </span>
                      </div>
                      <div className="text-slate-200 text-[11px] font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800/60 truncate" title={m.payload}>
                        {m.payload}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
