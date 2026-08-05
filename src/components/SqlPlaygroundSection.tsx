import React, { useState } from 'react';
import { Database, CheckCircle2, Terminal } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface SqlPlaygroundSectionProps {
  onNavigateToSharding: () => void;
}

const SQL_CONCEPTS = [
  {
    keyword: 'SELECT',
    color: '#06b6d4',
    desc: 'Query rows from a table or across joined tables.',
    example: "SELECT * FROM users WHERE country = 'IN';",
  },
  {
    keyword: 'INSERT',
    color: '#a855f7',
    desc: 'Write new records into your database tables.',
    example: "INSERT INTO orders (user_id, total) VALUES ('u91', 299);",
  },
  {
    keyword: 'GROUP BY',
    color: '#f59e0b',
    desc: 'Aggregate rows into summaries (counts, sums, averages).',
    example: "SELECT region, COUNT(*) FROM users GROUP BY region;",
  },
  {
    keyword: 'JOIN',
    color: '#10b981',
    desc: 'Combine related data from multiple tables together.',
    example: "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id;",
  },
];

const PRESET_QUERIES = [
  "SELECT * FROM users WHERE status = 'ACTIVE';",
  "INSERT INTO orders (user_id, amount) VALUES ('usr_991', 499.00);",
  "SELECT shard_id, COUNT(*) FROM user_records GROUP BY shard_id;",
];

export const SqlPlaygroundSection: React.FC<SqlPlaygroundSectionProps> = ({ onNavigateToSharding }) => {
  const [activeQuery, setActiveQuery] = useState(PRESET_QUERIES[0]);
  const [result, setResult] = useState<string | null>(null);

  const handleRun = () => {
    soundFx.playSuccess();
    setResult('Query executed across 4 PostgreSQL shards — 200 OK (2.8ms) — 3 rows returned');
  };

  return (
    <section style={{ background: '#020617', width: '100%' }}>

      {/* Subtle divider glow between the two sections */}
      <div style={{
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.3), rgba(168,85,247,0.3), transparent)',
      }} />

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#6ee7b7', fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
          }}>
            <Database size={13} /> Hands-on SQL Playground
          </div>
          <h2 style={{ color: '#fff', fontSize: 36, fontWeight: 800, lineHeight: 1.2, margin: '0 0 12px' }}>
            Learn SQL by Doing,{' '}
            <span style={{ background: 'linear-gradient(to right,#34d399,#22d3ee,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Not Just Reading
            </span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
            SQL powers every production database. Write and run real queries below — and see how they get routed across horizontally sharded PostgreSQL clusters.
          </p>
        </div>

        {/* ── SQL Concept Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {SQL_CONCEPTS.map((concept) => (
            <div
              key={concept.keyword}
              onClick={() => { setActiveQuery(concept.example); setResult(null); }}
              style={{
                background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.8)',
                borderRadius: 16, padding: 20, cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.15s',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(100,116,139,0.9)'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(51,65,85,0.8)'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
            >
              <div style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 8,
                fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                color: concept.color, background: `${concept.color}20`, border: `1px solid ${concept.color}50`,
              }}>
                {concept.keyword}
              </div>
              <p style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{concept.desc}</p>
              <code style={{
                display: 'block', fontSize: 10, fontFamily: 'monospace', padding: '6px 8px',
                borderRadius: 8, background: `${concept.color}10`, color: `${concept.color}cc`,
                borderLeft: `2px solid ${concept.color}50`, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}>
                {concept.example}
              </code>
              <p style={{ color: '#475569', fontSize: 10, margin: 0, fontFamily: 'monospace' }}>Click to load →</p>
            </div>
          ))}
        </div>

        {/* ── Live SQL Console ── */}
        <div style={{
          background: 'rgba(5,10,25,0.95)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20, padding: 32, boxShadow: '0 0 60px rgba(16,185,129,0.05)',
          display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'monospace',
        }}>
          {/* Console title bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontWeight: 700, fontSize: 12 }}>
              <Terminal size={15} /> Live SQL Console — PostgreSQL Sharded Cluster
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(234,179,8,0.8)', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,197,94,0.8)', display: 'inline-block' }} />
            </div>
          </div>

          {/* Preset query chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_QUERIES.map((q, i) => (
              <button key={i} onClick={() => { setActiveQuery(q); setResult(null); }}
                style={{
                  fontSize: 10, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(30,41,59,0.9)', color: '#67e8f9',
                  border: '1px solid rgba(51,65,85,0.8)', fontFamily: 'monospace',
                  maxWidth: 260, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(51,65,85,0.9)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30,41,59,0.9)'; }}
              >{q}</button>
            ))}
          </div>

          {/* Query editor row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={activeQuery}
              onChange={(e) => { setActiveQuery(e.target.value); setResult(null); }}
              placeholder="Write any SQL query..."
              style={{
                flex: 1, minWidth: 200,
                background: '#020617', border: '1px solid rgba(51,65,85,0.9)',
                borderRadius: 12, padding: '12px 16px',
                fontSize: 12, color: '#67e8f9', fontFamily: 'monospace',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = '#34d399'; }}
              onBlur={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(51,65,85,0.9)'; }}
            />
            <button onClick={handleRun}
              style={{
                padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(to right,#059669,#0891b2)', color: '#fff',
                fontWeight: 700, fontSize: 12, border: '1px solid rgba(52,211,153,0.4)',
                fontFamily: 'monospace', whiteSpace: 'nowrap',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              Run Query ⚡
            </button>
          </div>

          {/* Result panel */}
          {result ? (
            <div style={{ background: 'rgba(6,78,59,0.25)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontWeight: 700, fontSize: 12, borderBottom: '1px solid rgba(30,41,59,0.8)', paddingBottom: 10 }}>
                <CheckCircle2 size={15} /> Execution Result
              </div>
              <p style={{ color: '#cbd5e1', fontSize: 11, margin: 0 }}>✅ {result}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    {['record_id', 'user_key', 'routed_shard', 'partition_hash'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['#rec_91042', 'usr_991',   'Shard-1 (US-West)',  'Hash % 4 = 1'],
                    ['#rec_11820', 'usr_88401', 'Shard-3 (AP-South)', 'Hash % 4 = 3'],
                    ['#rec_50031', 'usr_2219',  'Shard-0 (US-East)',  'Hash % 4 = 0'],
                  ].map(([id, key, shard, hash]) => (
                    <tr key={id} style={{ borderBottom: '1px solid rgba(15,23,42,0.8)' }}>
                      <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{id}</td>
                      <td style={{ padding: '6px 8px', color: '#67e8f9', fontWeight: 700 }}>{key}</td>
                      <td style={{ padding: '6px 8px', color: '#6ee7b7' }}>{shard}</td>
                      <td style={{ padding: '6px 8px', color: '#f9a8d4' }}>{hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: 20, borderRadius: 12, background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(30,41,59,0.8)', textAlign: 'center',
              color: '#475569', fontSize: 11,
            }}>
              Run a query above to see live sharded database execution results
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={onNavigateToSharding}
            style={{
              padding: '16px 32px', borderRadius: 16, cursor: 'pointer',
              background: 'linear-gradient(to right,#059669,#0891b2,#2563eb)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            <Database size={18} />
            Launch Full DB Sharding & SQL Simulator
          </button>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 10, fontFamily: 'monospace' }}>
            Includes Hash Sharding, Range Partitioning & Read Replica controls
          </p>
        </div>

      </div>
    </section>
  );
};
