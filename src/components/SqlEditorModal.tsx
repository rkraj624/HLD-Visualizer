import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Play, Table2, ChevronRight, ChevronDown,
  Trophy, Lock, Check, HelpCircle, Sparkles, ListOrdered
} from 'lucide-react';
import sqlQuestionsData from '../data/sqlQuestions.json';

interface Column { name: string; type: string; key?: 'PK' | 'FK' | 'IDX' }
interface Table { name: string; columns: Column[] }
interface QueryResult {
  columns: string[];
  rows: (string | number)[][];
  totalRows: number;
  execMs: number;
  query: string;
  message?: string;
}

interface Question {
  id: number;
  level: number;
  levelTitle: string;
  question: string;
  hint: string;
  expectedQuery: string;
  solution: string;
  xp: number;
}

const QUESTIONS: Question[] = sqlQuestionsData;

const SCHEMA: Table[] = [
  {
    name: 'emp', columns: [
      { name: 'empno',    type: 'INTEGER',     key: 'PK' },
      { name: 'ename',    type: 'VARCHAR(64)'           },
      { name: 'job',      type: 'VARCHAR(64)', key: 'IDX' },
      { name: 'mgr',      type: 'INTEGER',     key: 'FK' },
      { name: 'hiredate', type: 'DATE'                  },
      { name: 'sal',      type: 'DECIMAL(10,2)'        },
      { name: 'comm',     type: 'DECIMAL(10,2)'        },
      { name: 'deptno',   type: 'INTEGER',     key: 'FK' },
    ],
  },
  {
    name: 'dept', columns: [
      { name: 'deptno',   type: 'INTEGER',     key: 'PK' },
      { name: 'dname',    type: 'VARCHAR(64)'           },
      { name: 'loc',      type: 'VARCHAR(64)'           },
    ],
  },
];

type RowObj = Record<string, any>;

const INITIAL_DB: Record<string, RowObj[]> = {
  emp: [
    { empno: 7369, ename: 'SMITH',  job: 'CLERK',     mgr: 7902, hiredate: '1980-12-17', sal: 800,  comm: null, deptno: 20 },
    { empno: 7499, ename: 'ALLEN',  job: 'SALESMAN',  mgr: 7698, hiredate: '1981-02-20', sal: 1600, comm: 300,  deptno: 30 },
    { empno: 7521, ename: 'WARD',   job: 'SALESMAN',  mgr: 7698, hiredate: '1981-02-22', sal: 1250, comm: 500,  deptno: 30 },
    { empno: 7566, ename: 'JONES',  job: 'MANAGER',   mgr: 7839, hiredate: '1981-04-02', sal: 2975, comm: null, deptno: 20 },
    { empno: 7654, ename: 'MARTIN', job: 'SALESMAN',  mgr: 7698, hiredate: '1981-09-28', sal: 1250, comm: 1400, deptno: 30 },
    { empno: 7698, ename: 'BLAKE',  job: 'MANAGER',   mgr: 7839, hiredate: '1981-05-01', sal: 2850, comm: null, deptno: 30 },
    { empno: 7782, ename: 'CLARK',  job: 'MANAGER',   mgr: 7839, hiredate: '1981-06-09', sal: 2450, comm: null, deptno: 10 },
    { empno: 7788, ename: 'SCOTT',  job: 'ANALYST',   mgr: 7566, hiredate: '1982-12-09', sal: 3000, comm: null, deptno: 20 },
    { empno: 7839, ename: 'KING',   job: 'PRESIDENT', mgr: null, hiredate: '1981-11-17', sal: 5000, comm: null, deptno: 10 },
    { empno: 7844, ename: 'TURNER', job: 'SALESMAN',  mgr: 7698, hiredate: '1981-09-08', sal: 1500, comm: 0,    deptno: 30 },
    { empno: 7876, ename: 'ADAMS',  job: 'CLERK',     mgr: 7788, hiredate: '1983-01-12', sal: 1100, comm: null, deptno: 20 },
    { empno: 7900, ename: 'JAMES',  job: 'CLERK',     mgr: 7698, hiredate: '1981-12-03', sal: 950,  comm: null, deptno: 30 },
    { empno: 7902, ename: 'FORD',   job: 'ANALYST',   mgr: 7566, hiredate: '1981-12-03', sal: 3000, comm: null, deptno: 20 },
    { empno: 7934, ename: 'MILLER', job: 'CLERK',     mgr: 7782, hiredate: '1982-01-23', sal: 1300, comm: null, deptno: 10 },
  ],
  dept: [
    { deptno: 10, dname: 'ACCOUNTING', loc: 'NEW YORK' },
    { deptno: 20, dname: 'RESEARCH',   loc: 'DALLAS'   },
    { deptno: 30, dname: 'SALES',      loc: 'CHICAGO'  },
    { deptno: 40, dname: 'OPERATIONS', loc: 'BOSTON'   },
  ],
};

function executeRealSql(rawSql: string, db: Record<string, RowObj[]>): { updatedDb: Record<string, RowObj[]>; result: QueryResult } {
  const startTime = performance.now();
  const sql = rawSql.trim();
  const upperSql = sql.toUpperCase();

  if (upperSql.startsWith('SELECT')) {
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const primaryTable = fromMatch ? fromMatch[1].toLowerCase() : 'emp';
    const dataset = db[primaryTable] || db['emp'] || [];

    let columns: string[] = [];
    const selectColsMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
    if (selectColsMatch && selectColsMatch[1].trim() !== '*') {
      columns = selectColsMatch[1].split(',').map(c => c.trim().split(/\s+AS\s+/i)[0].split('.').pop()!);
    } else if (dataset.length > 0) {
      columns = Object.keys(dataset[0]);
    } else {
      columns = ['empno', 'ename', 'job', 'sal', 'deptno'];
    }

    const rows = dataset.map(r => columns.map(col => r[col] !== undefined ? r[col] : 'NULL'));
    const execMs = Number((performance.now() - startTime).toFixed(2));

    return {
      updatedDb: db,
      result: { query: sql, execMs, totalRows: rows.length, columns, rows }
    };
  }

  const execMs = Number((performance.now() - startTime).toFixed(2));
  return {
    updatedDb: db,
    result: { query: sql, execMs, totalRows: 1, columns: ['status'], rows: [['Query Executed']] }
  };
}

interface SqlEditorModalProps {
  onClose: () => void;
}

export const SqlEditorModal: React.FC<SqlEditorModalProps> = ({ onClose }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(() => {
    const saved = localStorage.getItem('sql_game_progress_idx');
    return saved ? Math.min(Number(saved), QUESTIONS.length - 1) : 0;
  });

  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('sql_game_completed_set');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [userXp, setUserXp] = useState<number>(() => {
    const saved = localStorage.getItem('sql_game_xp');
    return saved ? Number(saved) : 0;
  });

  const [db, setDb]                   = useState<Record<string, RowObj[]>>(INITIAL_DB);
  const [sql, setSql]                 = useState('');
  const [result, setResult]           = useState<QueryResult | null>(null);
  const [running, setRunning]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [showHint, setShowHint]       = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'questions' | 'schema'>('questions');
  const [expandedTables, setExpanded] = useState<Set<string>>(new Set(['emp', 'dept']));
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef                = useRef<HTMLDivElement>(null);

  const currentQ = QUESTIONS[currentQuestionIdx];

  // Sync editor SQL when question changes
  useEffect(() => {
    setSql('');
    setResult(null);
    setError(null);
    setShowHint(false);
    setIsSuccess(false);
  }, [currentQuestionIdx]);

  // Save progress
  useEffect(() => {
    localStorage.setItem('sql_game_progress_idx', String(currentQuestionIdx));
    localStorage.setItem('sql_game_completed_set', JSON.stringify(Array.from(completedQuestions)));
    localStorage.setItem('sql_game_xp', String(userXp));
  }, [currentQuestionIdx, completedQuestions, userXp]);

  const normalizeSql = (s: string) => s.replace(/;$/, '').trim().toLowerCase().replace(/\s+/g, ' ');

  const [expectedResult, setExpectedResult] = useState<QueryResult | null>(null);

  // Compute expected result output whenever question changes
  useEffect(() => {
    try {
      const { result: expRes } = executeRealSql(currentQ.expectedQuery, db);
      setExpectedResult(expRes);
    } catch {
      setExpectedResult(null);
    }
  }, [currentQ, db]);

  // Execute user query to test & preview output table
  const handleExecuteQuery = useCallback(() => {
    if (!sql.trim()) return;
    setRunning(true);
    setError(null);

    setTimeout(() => {
      try {
        const { updatedDb, result: res } = executeRealSql(sql, db);
        setDb(updatedDb);
        setResult(res);
      } catch (err: any) {
        setError(err?.message || 'SQL Execution Error');
      }
      setRunning(false);
    }, 150);
  }, [sql, db]);

  // Submit Answer to validate correctness and advance level
  const handleSubmitAnswer = useCallback(() => {
    if (!sql.trim()) return;
    setRunning(true);
    setError(null);

    setTimeout(() => {
      try {
        const { updatedDb, result: res } = executeRealSql(sql, db);
        setDb(updatedDb);
        setResult(res);

        const normUser = normalizeSql(sql);
        const normExpected = normalizeSql(currentQ.expectedQuery);

        const isExactMatch = normUser.includes(normExpected) || normExpected.includes(normUser);
        const isKeywordMatch = currentQ.expectedQuery.split(' ').every(k => normUser.includes(k.toLowerCase()));

        if (isExactMatch || isKeywordMatch) {
          setIsSuccess(true);
          if (!completedQuestions.has(currentQ.id)) {
            setCompletedQuestions(prev => new Set(prev).add(currentQ.id));
            setUserXp(prev => prev + currentQ.xp);
          }
        } else {
          setError('Your query output or logic does not match the expected answer. Check Expected Result tab!');
        }
      } catch (err: any) {
        setError(err?.message || 'SQL Execution Error');
      }
      setRunning(false);
    }, 200);
  }, [sql, db, currentQ, completedQuestions]);

  const handleNextQuestion = () => {
    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  // Autocomplete Suggestions List (Keywords, Tables, Columns)
  const AUTOCOMPLETE_DICTIONARY = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING',
    'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'DISTINCT',
    'COUNT(*)', 'SUM()', 'AVG()', 'MAX()', 'MIN()', 'ASC', 'DESC', 'AND', 'OR', 'NOT',
    'LIKE', 'BETWEEN', 'IN', 'IS NULL', 'IS NOT NULL',
    'emp', 'dept', 'empno', 'ename', 'job', 'mgr', 'hiredate', 'sal', 'comm', 'deptno', 'dname', 'loc'
  ];

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);

  // Extract current word at cursor to calculate suggestions
  const updateSuggestions = (currentText: string, cursorIndex: number) => {
    const textBeforeCursor = currentText.slice(0, cursorIndex);
    const words = textBeforeCursor.split(/[\s,();]+/);
    const lastWord = words[words.length - 1];

    if (lastWord && lastWord.length >= 1) {
      const matches = AUTOCOMPLETE_DICTIONARY.filter(item =>
        item.toLowerCase().startsWith(lastWord.toLowerCase()) && item.toLowerCase() !== lastWord.toLowerCase()
      );
      setSuggestions(matches.slice(0, 6));
      setSelectedSuggestionIdx(0);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const textBefore = sql.slice(0, cursor);
    const textAfter = sql.slice(cursor);
    const words = textBefore.split(/([\s,();]+)/);
    
    // Replace current incomplete word with selected suggestion
    words[words.length - 1] = suggestion + ' ';
    const nextSql = words.join('') + textAfter;
    setSql(nextSql);
    setSuggestions([]);

    requestAnimationFrame(() => {
      const nextCursorPos = words.join('').length;
      ta.selectionStart = ta.selectionEnd = nextCursorPos;
      ta.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Navigate and select suggestions
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleExecuteQuery(); }
    if (e.key === 'Tab' && suggestions.length === 0) {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const next = sql.slice(0, start) + '  ' + sql.slice(end);
      setSql(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
    }
  };

  const toggleTable = (name: string) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });

  const lines = sql.split('\n');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2,6,23,0.96)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── TOP HEADER BAR ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56,
        background: 'rgba(5,10,25,0.98)', borderBottom: '1px solid rgba(51,65,85,0.6)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(245,158,11,0.3)'
          }}>
            <Trophy size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>SQL Mastery Challenge</span>
              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', fontSize: 10, padding: '2px 8px', borderRadius: 999 }}>
                {currentQ.levelTitle}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: 10 }}>Select any unlocked question from the sidebar</div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* XP Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 14px', borderRadius: 999, color: '#34d399', fontSize: 11, fontWeight: 700 }}>
            <Sparkles size={13} /> {userXp} XP
          </div>

          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
            Solved: <span style={{ color: '#34d399' }}>{completedQuestions.size}</span> / {QUESTIONS.length}
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(51,65,85,0.6)' }} />

          <button onClick={onClose} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '6px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR: QUESTIONS & SCHEMA ── */}
        <div style={{ width: 320, flexShrink: 0, background: 'rgba(5,10,25,0.98)', borderRight: '1px solid rgba(30,41,59,0.8)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          {/* Sidebar Tab Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.8)' }}>
            <button
              onClick={() => setActiveSidebarTab('questions')}
              style={{
                flex: 1, padding: '10px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: activeSidebarTab === 'questions' ? 'rgba(30,41,59,0.9)' : 'transparent',
                color: activeSidebarTab === 'questions' ? '#38bdf8' : '#64748b',
                borderBottom: activeSidebarTab === 'questions' ? '2px solid #38bdf8' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <ListOrdered size={14} /> Questions ({QUESTIONS.length})
            </button>

            <button
              onClick={() => setActiveSidebarTab('schema')}
              style={{
                flex: 1, padding: '10px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: activeSidebarTab === 'schema' ? 'rgba(30,41,59,0.9)' : 'transparent',
                color: activeSidebarTab === 'schema' ? '#38bdf8' : '#64748b',
                borderBottom: activeSidebarTab === 'schema' ? '2px solid #38bdf8' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <Table2 size={14} /> DB Schema
            </button>
          </div>

          {/* Sidebar Content Area */}
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            
            {/* 1. Questions Tab List */}
            {activeSidebarTab === 'questions' && (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
                {QUESTIONS.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIdx;
                  const isDone = completedQuestions.has(q.id);
                  const isLocked = idx > 0 && !completedQuestions.has(QUESTIONS[idx - 1].id) && !isDone && !isCurrent;

                  return (
                    <div
                      key={q.id}
                      onClick={() => !isLocked && setCurrentQuestionIdx(idx)}
                      style={{
                        padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        background: isCurrent ? 'rgba(6,182,212,0.15)' : isDone ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.6)',
                        border: isCurrent ? '1px solid rgba(6,182,212,0.5)' : isDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(30,41,59,0.6)',
                        opacity: isLocked ? 0.45 : 1,
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                        background: isCurrent ? '#06b6d4' : isDone ? '#10b981' : isLocked ? 'rgba(30,41,59,0.8)' : 'rgba(51,65,85,0.8)',
                        color: isCurrent || isDone ? '#fff' : '#94a3b8',
                      }}>
                        {isDone ? <Check size={12} /> : isLocked ? <Lock size={10} /> : q.id}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ color: isCurrent ? '#67e8f9' : isDone ? '#a7f3d0' : '#e2e8f0', fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
                          {q.id}. {q.question}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: '#64748b' }}>
                          <span>{q.levelTitle.split(':')[0]}</span>
                          <span style={{ color: '#f59e0b' }}>+{q.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. DB Schema Tab */}
            {activeSidebarTab === 'schema' && (
              <div style={{ padding: '6px 0' }}>
                {SCHEMA.map((table) => (
                  <div key={table.name}>
                    <div onClick={() => toggleTable(table.name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid rgba(30,41,59,0.4)' }}>
                      {expandedTables.has(table.name) ? <ChevronDown size={11} color="#64748b" /> : <ChevronRight size={11} color="#64748b" />}
                      <Table2 size={12} color="#06b6d4" />
                      <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1, fontWeight: 700 }}>{table.name}</span>
                      <span style={{ color: '#34d399', fontSize: 9 }}>{db[table.name]?.length ?? 0} rows</span>
                    </div>
                    {expandedTables.has(table.name) && (
                      <div style={{ background: 'rgba(2,6,23,0.5)', padding: '4px 0' }}>
                        {table.columns.map((col) => (
                          <div key={col.name} onClick={() => {
                            const ta = textareaRef.current;
                            if (ta) { const pos = ta.selectionStart; setSql((s) => s.slice(0, pos) + col.name + s.slice(pos)); }
                          }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px 4px 32px', cursor: 'pointer' }}>
                            <span style={{ color: '#94a3b8', fontSize: 11, flex: 1 }}>{col.name}</span>
                            <span style={{ color: '#475569', fontSize: 9 }}>{col.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── MAIN WORKSPACE: ACTIVE QUESTION CARD & EDITOR ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ACTIVE QUESTION PANEL */}
          <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(51,65,85,0.6)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Active Question {currentQ.id} of {QUESTIONS.length}</span>
                <span>•</span>
                <span style={{ color: '#f59e0b' }}>+{currentQ.xp} XP</span>
              </div>
              <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>
                {currentQ.question}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowHint(!showHint)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(71,85,105,0.8)', color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <HelpCircle size={13} /> {showHint ? 'Hide Hint' : 'Hint'}
              </button>

              <button
                onClick={() => setSql(currentQ.solution)}
                style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(51,65,85,0.6)', color: '#64748b', fontSize: 11, cursor: 'pointer' }}
              >
                Reveal Solution
              </button>
            </div>
          </div>

          {showHint && (
            <div style={{ background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.3)', padding: '8px 24px', color: '#fef08a', fontSize: 12 }}>
              💡 <strong>Hint:</strong> {currentQ.hint}
            </div>
          )}

          {/* Code Editor */}
          <div style={{ flex: result || error || isSuccess ? '0 0 45%' : 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
            <div ref={lineNumbersRef} style={{ width: 44, flexShrink: 0, paddingTop: 16, background: 'rgba(5,10,25,0.95)', borderRight: '1px solid rgba(30,41,59,0.5)', textAlign: 'right', paddingRight: 10, userSelect: 'none', overflowY: 'hidden' }}>
              {lines.map((_, i) => (
                <div key={i} style={{ color: '#1e3a5f', fontSize: 12, lineHeight: '22px', height: 22 }}>{i + 1}</div>
              ))}
            </div>

            <div style={{ flex: 1, position: 'relative', background: '#050a19' }}>
              <textarea
                ref={textareaRef}
                value={sql}
                placeholder="Type your SQL query solution here..."
                onChange={(e) => {
                  const val = e.target.value;
                  setSql(val);
                  setResult(null);
                  setError(null);
                  setIsSuccess(false);
                  updateSuggestions(val, e.target.selectionStart);
                }}
                onClick={(e) => updateSuggestions(sql, (e.target as HTMLTextAreaElement).selectionStart)}
                onKeyUp={(e) => updateSuggestions(sql, (e.target as HTMLTextAreaElement).selectionStart)}
                onKeyDown={onKeyDown}
                onScroll={(e) => { if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop; }}
                spellCheck={false}
                style={{ width: '100%', height: '100%', margin: 0, padding: '16px', fontSize: 13, lineHeight: '22px', fontFamily: "'JetBrains Mono', monospace", background: '#050a19', border: 'none', outline: 'none', resize: 'none', color: '#67e8f9', caretColor: '#38bdf8', overflowY: 'hidden', overflowX: 'auto' }}
              />

              {/* Floating Autocomplete Suggestion Popover */}
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 40,
                    left: 20,
                    zIndex: 100,
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(6,182,212,0.2)',
                    padding: '4px 0',
                    minWidth: 160,
                  }}
                >
                  <div style={{ padding: '4px 10px', fontSize: 9, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid rgba(30,41,59,0.8)', fontWeight: 700 }}>
                    Suggestions (Tab / Enter)
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={item}
                      onClick={() => applySuggestion(item)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: idx === selectedSuggestionIdx ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                        color: idx === selectedSuggestionIdx ? '#38bdf8' : '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{item}</span>
                      <span style={{ fontSize: 9, color: '#64748b', marginLeft: 8 }}>
                        {item.toUpperCase() === item ? 'Keyword' : 'Column/Table'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ padding: '10px 16px', background: 'rgba(15,23,42,0.95)', borderTop: '1px solid rgba(51,65,85,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#64748b', fontSize: 11 }}>Press <kbd style={{ background: 'rgba(30,41,59,0.8)', padding: '1px 6px', borderRadius: 4, color: '#94a3b8' }}>⌘ Enter</kbd> to test your query output</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleExecuteQuery}
                disabled={running}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Play size={13} fill="#38bdf8" /> Execute Query
              </button>

              <button
                onClick={handleSubmitAnswer}
                disabled={running}
                style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(to right,#059669,#0891b2)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 12px rgba(16,185,129,0.3)' }}
              >
                <Check size={14} /> Submit Result
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div style={{ background: 'rgba(16,185,129,0.15)', borderTop: '1px solid rgba(16,185,129,0.4)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ color: '#34d399', fontWeight: 800, fontSize: 14 }}>Challenge Solved! +{currentQ.xp} XP</div>
                  <div style={{ color: '#a7f3d0', fontSize: 11 }}>Great job! You have unlocked the next question in the sidebar.</div>
                </div>
              </div>

              {currentQuestionIdx < QUESTIONS.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(to right,#10b981,#059669)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}
                >
                  Next Question →
                </button>
              ) : (
                <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: 13 }}>🎉 All Questions Completed!</div>
              )}
            </div>
          )}

          {/* Output Results / Comparison Table */}
          {(result || expectedResult) && !isSuccess && (
            <div className="custom-scrollbar" style={{ flex: 1, overflow: 'auto', background: 'rgba(5,10,25,0.98)', borderTop: '1px solid rgba(30,41,59,0.8)' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,41,59,0.8)', background: 'rgba(15,23,42,0.9)' }}>
                <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#38bdf8', borderBottom: '2px solid #38bdf8' }}>
                  Your Output ({result ? `${result.totalRows} rows` : 'Not Executed'})
                </div>
                <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                  Expected Result ({expectedResult ? `${expectedResult.totalRows} rows` : 'N/A'})
                </div>
              </div>

              {result ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'rgba(15,23,42,0.98)' }}>
                      {result.columns.map((c) => <th key={c} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', borderBottom: '1px solid rgba(30,41,59,0.8)' }}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid rgba(15,23,42,0.8)' }}>
                        {row.map((cell, ci) => <td key={ci} style={{ padding: '7px 12px', color: '#e2e8f0' }}>{String(cell)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 20, color: '#64748b', fontSize: 11, textAlign: 'center' }}>
                  Click <strong>Execute Query</strong> to preview your result output before submitting!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.25);
          border-radius: 4px;
          border: 1px solid rgba(56, 189, 248, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.5);
        }
      `}</style>
    </div>
  );
};
