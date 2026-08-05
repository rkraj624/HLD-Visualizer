import React, { useState } from 'react';
import { Database, CheckCircle2, Terminal } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { SqlEditorModal } from './SqlEditorModal';

interface SqlPlaygroundSectionProps {
  onNavigateToSharding: () => void;
}

const SQL_CONCEPTS = [
  {
    keyword: 'SELECT',
    color: '#06b6d4',
    desc: 'Query rows from a table or filter records with conditions.',
    example: "SELECT * FROM users WHERE status = 'ACTIVE';",
  },
  {
    keyword: 'INSERT',
    color: '#a855f7',
    desc: 'Write and store new records in your database tables.',
    example: "INSERT INTO orders (user_id, amount) VALUES (101, 299.00);",
  },
  {
    keyword: 'GROUP BY',
    color: '#f59e0b',
    desc: 'Aggregate data rows into summary stats (COUNT, SUM, AVG).',
    example: "SELECT status, COUNT(*) FROM orders GROUP BY status;",
  },
  {
    keyword: 'JOIN',
    color: '#10b981',
    desc: 'Relate and combine records across multiple tables.',
    example: "SELECT u.username, o.amount FROM users u JOIN orders o ON u.id = o.user_id;",
  },
];

const PRESET_QUERIES = [
  "SELECT id, username, email, status FROM users WHERE status = 'ACTIVE';",
  "INSERT INTO orders (user_id, amount, status) VALUES (101, 149.50, 'COMPLETED');",
  "SELECT status, COUNT(*) AS count, SUM(amount) AS total FROM orders GROUP BY status;",
];

export const SqlPlaygroundSection: React.FC<SqlPlaygroundSectionProps> = ({ onNavigateToSharding: _onNavigateToSharding }) => {
  const [activeQuery, setActiveQuery] = useState(PRESET_QUERIES[0]);
  const [result, setResult] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRun = () => {
    soundFx.playSuccess();
    setResult('Query executed successfully — 200 OK (1.8ms) — 5 rows returned');
  };

  return (
    <section style={{ background: '#020617', width: '100%' }}>
      {/* Divider */}
      <div style={{
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(6,182,212,0.3), rgba(168,85,247,0.3), transparent)',
      }} />

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>

        {/* Header */}
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
            SQL powers data retrieval in modern systems. Write and run queries directly in your browser to master database fundamentals.
          </p>
        </div>

        {/* Concept Cards */}
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

        {/* Live SQL Console */}
        <div style={{
          background: 'rgba(5,10,25,0.95)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 20, padding: 32, boxShadow: '0 0 60px rgba(16,185,129,0.05)',
          display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'monospace',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontWeight: 700, fontSize: 12 }}>
              <Terminal size={15} /> Live SQL Console
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(234,179,8,0.8)', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(34,197,94,0.8)', display: 'inline-block' }} />
            </div>
          </div>

          {/* Preset chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_QUERIES.map((q, i) => (
              <button key={i} onClick={() => { setActiveQuery(q); setResult(null); }}
                style={{
                  fontSize: 10, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(30,41,59,0.9)', color: '#67e8f9',
                  border: '1px solid rgba(51,65,85,0.8)', fontFamily: 'monospace',
                  maxWidth: 280, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}
              >{q}</button>
            ))}
          </div>

          {/* Query input */}
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
                outline: 'none',
              }}
            />
            <button onClick={handleRun}
              style={{
                padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(to right,#059669,#0891b2)', color: '#fff',
                fontWeight: 700, fontSize: 12, border: '1px solid rgba(52,211,153,0.4)',
                fontFamily: 'monospace', whiteSpace: 'nowrap',
              }}
            >
              Run Query ⚡
            </button>
          </div>

          {/* Result */}
          {result ? (
            <div style={{ background: 'rgba(6,78,59,0.25)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6ee7b7', fontWeight: 700, fontSize: 12, borderBottom: '1px solid rgba(30,41,59,0.8)', paddingBottom: 10 }}>
                <CheckCircle2 size={15} /> Execution Result
              </div>
              <p style={{ color: '#cbd5e1', fontSize: 11, margin: 0 }}>✅ {result}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead>
                  <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(30,41,59,0.8)' }}>
                    {['id', 'username', 'email', 'country', 'status'].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [101, 'alice_w', 'alice@example.com', 'US', 'ACTIVE'],
                    [102, 'bob_k',   'bob@example.com',   'IN', 'ACTIVE'],
                    [103, 'carol_m', 'carol@example.com', 'GB', 'ACTIVE'],
                  ].map(([id, key, email, country, status]) => (
                    <tr key={id as number} style={{ borderBottom: '1px solid rgba(15,23,42,0.8)' }}>
                      <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{id}</td>
                      <td style={{ padding: '6px 8px', color: '#67e8f9', fontWeight: 700 }}>{key}</td>
                      <td style={{ padding: '6px 8px', color: '#e2e8f0' }}>{email}</td>
                      <td style={{ padding: '6px 8px', color: '#6ee7b7' }}>{country}</td>
                      <td style={{ padding: '6px 8px', color: '#f9a8d4' }}>{status}</td>
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
              Run a query above to see execution results
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setIsModalOpen(true)}
            style={{
              padding: '16px 32px', borderRadius: 16, cursor: 'pointer',
              background: 'linear-gradient(to right,#059669,#0891b2,#2563eb)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.2)',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <Database size={18} />
            Open Full SQL Studio
          </button>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 10, fontFamily: 'monospace' }}>
            Full SQL query editor with interactive database schema & query results
          </p>
        </div>

      </div>

      {isModalOpen && (
        <SqlEditorModal onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
};
