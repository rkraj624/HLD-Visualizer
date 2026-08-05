import { useState, useEffect, useRef, useCallback } from 'react';
import type { AlgorithmType, SimulationConfig, SimulationState, RequestItem } from './types';
import { PRESET_SCENARIOS } from './utils/constants';
import { evaluateRateLimit, processLeakyBucketLeak } from './utils/rateLimiters';
import { soundFx } from './utils/audio';
import { Header } from './components/Header';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EducationalGuide } from './components/EducationalGuide';
import { ControlsPanel } from './components/ControlsPanel';
import { MetricsDashboard } from './components/MetricsDashboard';
import { CodeSnippets } from './components/CodeSnippets';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { WalkingGuide } from './components/WalkingGuide';
import { Sidebar } from './components/Sidebar';
import { TopicModuleViewer } from './components/TopicModuleViewer';
import { Award, Flame, X } from 'lucide-react';

const INITIAL_CONFIG: SimulationConfig = {
  capacity: 10,
  refillRate: 3,
  windowMs: 2000,
  trafficRate: 2,
  trafficPattern: 'steady',
  simSpeed: 1,
  isPaused: false,
};

interface BenchmarkReport {
  total: number;
  allowed: number;
  blocked: number;
  dropRate: string;
  score: string;
}

export function App() {
  const [activeTopicId, setActiveTopicId] = useState<string>('rate-limiting');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('token-bucket');
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);

  const [state, setState] = useState<SimulationState>({
    tokens: 10,
    lastRefillTime: Date.now(),
    queue: [],
    currentWindowStart: Date.now(),
    windowRequestCount: 0,
    requestLogs: [],
    prevWindowCount: 0,
    currWindowCount: 0,
    currWindowStart: Date.now(),
    totalRequests: 0,
    allowedRequests: 0,
    rejectedRequests: 0,
    recentRps: 0,
    history: [],
    logs: [],
  });

  const [stressReport, setStressReport] = useState<BenchmarkReport | null>(null);
  const [isStressRunning, setIsStressRunning] = useState(false);

  // Walking Guide Tour — per-topic tracking
  const getTourSeenKey = (topicId: string) => `tour-seen:${topicId}`;
  const [showTour, setShowTour] = useState(() => {
    // Auto-show on initial load only if rate-limiting tour hasn't been seen
    return !localStorage.getItem(getTourSeenKey('rate-limiting'));
  });

  // Auto-show the tour when switching to a topic the user hasn't seen yet
  const handleSelectTopic = (topicId: string) => {
    setActiveTopicId(topicId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Only auto-trigger if this topic has a dedicated tour and hasn't been seen
    const TOPICS_WITH_TOURS = ['rate-limiting', 'load-balancing', 'caching', 'consistent-hashing'];
    if (TOPICS_WITH_TOURS.includes(topicId) && !localStorage.getItem(getTourSeenKey(topicId))) {
      setShowTour(true);
    }
  };

  // Mark tour as seen for the current active topic
  const handleCloseTour = () => {
    localStorage.setItem(getTourSeenKey(activeTopicId), 'true');
    setShowTour(false);
  };

  const lastTickTimeRef = useRef<number>(Date.now());
  const lastAutoRequestTimeRef = useRef<number>(Date.now());

  // Process a single request
  const handleIncomingRequest = useCallback(
    () => {
      const now = Date.now();
      const ip = `192.168.1.${Math.floor(Math.random() * 250) + 1}`;
      const endpoints = ['/api/v1/checkout', '/api/v1/auth/login', '/api/v1/user/profile', '/api/v1/search'];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

      setState((prevState) => {
        const result = evaluateRateLimit(algorithm, prevState, config, now);
        const isAllowed = result.allowed;

        if (isAllowed) {
          soundFx.playSuccess();
        } else {
          soundFx.playBlocked();
        }

        const newLogItem: RequestItem = {
          id: Math.random().toString(36).substring(7),
          timestamp: now,
          status: isAllowed ? 'allowed' : 'rejected',
          clientIp: ip,
          endpoint,
          latencyMs: Math.floor(Math.random() * 15) + 5,
          reason: isAllowed ? 'Token consumed' : result.reason || 'Rate limit exceeded',
        };

        return {
          ...prevState,
          ...result.newState,
          totalRequests: prevState.totalRequests + 1,
          allowedRequests: prevState.allowedRequests + (isAllowed ? 1 : 0),
          rejectedRequests: prevState.rejectedRequests + (isAllowed ? 0 : 1),
          logs: [newLogItem, ...prevState.logs].slice(0, 50),
        };
      });
    },
    [algorithm, config]
  );

  // Trigger burst requests
  const handleTriggerBurst = (count: number) => {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        handleIncomingRequest();
      }, i * 70);
    }
  };

  // Run 5-Second Stress Test Benchmark
  const handleRunStressTest = () => {
    if (isStressRunning) return;
    setIsStressRunning(true);

    const startTotal = state.totalRequests;
    const startAllowed = state.allowedRequests;
    const startRejected = state.rejectedRequests;

    const oldTraffic = config.trafficRate;
    setConfig((prev) => ({ ...prev, trafficRate: 25, trafficPattern: 'ddos' }));

    setTimeout(() => {
      setConfig((prev) => ({ ...prev, trafficRate: oldTraffic, trafficPattern: 'steady' }));
      setIsStressRunning(false);

      setState((curr) => {
        const deltaTotal = curr.totalRequests - startTotal;
        const deltaAllowed = curr.allowedRequests - startAllowed;
        const deltaBlocked = curr.rejectedRequests - startRejected;
        const dropPct = deltaTotal > 0 ? ((deltaBlocked / deltaTotal) * 100).toFixed(1) : '0.0';

        let score = 'A+ (Optimal Protection)';
        if (Number(dropPct) < 20) score = 'B (High Throughput)';
        if (Number(dropPct) > 70) score = 'A (Strict Throttle)';

        setStressReport({
          total: deltaTotal,
          allowed: deltaAllowed,
          blocked: deltaBlocked,
          dropRate: dropPct,
          score,
        });

        return curr;
      });
    }, 4000);
  };

  // Reset State
  const handleReset = () => {
    const now = Date.now();
    setState({
      tokens: config.capacity,
      lastRefillTime: now,
      queue: [],
      currentWindowStart: now,
      windowRequestCount: 0,
      requestLogs: [],
      prevWindowCount: 0,
      currWindowCount: 0,
      currWindowStart: now,
      totalRequests: 0,
      allowedRequests: 0,
      rejectedRequests: 0,
      recentRps: 0,
      history: [],
      logs: [],
    });
  };

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (preset) {
      setAlgorithm(preset.algorithm);
      setConfig((prev) => ({
        ...prev,
        ...preset.config,
        isPaused: false,
      }));
      handleReset();
    }
  };

  // Main Simulation Loop Tick
  useEffect(() => {
    if (config.isPaused || activeTopicId !== 'rate-limiting') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = ((now - lastTickTimeRef.current) / 1000) * config.simSpeed;
      lastTickTimeRef.current = now;

      // 1. Refill / Leak Background Ticks
      setState((prev) => {
        let updated = { ...prev };

        if (algorithm === 'token-bucket') {
          const addedTokens = deltaSec * config.refillRate;
          updated.tokens = Math.min(config.capacity, prev.tokens + addedTokens);
        }

        if (algorithm === 'leaky-bucket') {
          const leakResult = processLeakyBucketLeak(prev, config, deltaSec);
          if (leakResult.queue) {
            updated.queue = leakResult.queue;
          }
        }

        return updated;
      });

      // 2. Automatic Traffic Generator
      if (config.trafficRate > 0) {
        let currentTargetInterval = 1000 / config.trafficRate;

        if (config.trafficPattern === 'spike') {
          if (Math.sin(now / 500) > 0.7) {
            currentTargetInterval /= 3;
          }
        } else if (config.trafficPattern === 'wave') {
          const waveFactor = 1 + Math.sin(now / 1000);
          currentTargetInterval = currentTargetInterval / Math.max(0.2, waveFactor);
        } else if (config.trafficPattern === 'ddos') {
          currentTargetInterval /= 4;
        }

        if (now - lastAutoRequestTimeRef.current >= currentTargetInterval / config.simSpeed) {
          lastAutoRequestTimeRef.current = now;
          handleIncomingRequest();
        }
      }
    }, 100 / config.simSpeed);

    return () => clearInterval(interval);
  }, [config, algorithm, activeTopicId, handleIncomingRequest]);

  return (
    <div className="min-h-screen font-sans">
      {/* Walking Guide Tour */}
      <WalkingGuide isOpen={showTour} onClose={handleCloseTour} activeTopicId={activeTopicId} />

      {/* HLD Topics Navigation Sidebar */}
      <Sidebar
        activeTopicId={activeTopicId}
        onSelectTopic={handleSelectTopic}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Container Area with Responsive Left Margin */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-80' : 'lg:pl-20'}`}>
        <div className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6">
          {/* Header */}
          <Header
            activeTopicId={activeTopicId}
            config={config}
            onChangeConfig={(newCfg) => setConfig((prev) => ({ ...prev, ...newCfg }))}
            onReset={handleReset}
            onTriggerBurst={handleTriggerBurst}
            onSelectPreset={handleSelectPreset}
            onRunStressTest={handleRunStressTest}
            onStartTour={() => {
              localStorage.removeItem(getTourSeenKey(activeTopicId));
              setShowTour(true);
            }}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          {/* TOPIC ROUTING */}
          {activeTopicId === 'rate-limiting' ? (
            <>
              {/* Algorithm Selector Tabs */}
              <AlgorithmSelector selected={algorithm} onSelect={(algo) => { setAlgorithm(algo); handleReset(); }} />

              {/* Main Flow Canvas Visualizer */}
              <VisualizerCanvas
                algorithm={algorithm}
                state={state}
                config={config}
                recentLogs={state.logs}
              />

              {/* Interactive Educational Breakdown & Analogy Stepper */}
              <EducationalGuide algorithm={algorithm} />

              {/* Dynamic Controls Tuner */}
              <ControlsPanel
                algorithm={algorithm}
                config={config}
                onChangeConfig={(newCfg) => setConfig((prev) => ({ ...prev, ...newCfg }))}
                onSendSingleRequest={() => handleIncomingRequest()}
              />

              {/* Telemetry Dashboard & Sparkline */}
              <MetricsDashboard state={state} onClearLogs={() => setState((p) => ({ ...p, logs: [] }))} />

              {/* Production Implementation Snippets */}
              <CodeSnippets algorithm={algorithm} />

              {/* Architecture Comparison Matrix */}
              <ComparisonMatrix
                selectedAlgorithm={algorithm}
                onSelectAlgorithm={(algo) => { setAlgorithm(algo); handleReset(); }}
              />
            </>
          ) : (
            <TopicModuleViewer topicId={activeTopicId} />
          )}
        </div>
      </div>

      {/* Stress Test Modal Report Card */}
      {stressReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black-85 backdrop-blur-md">
          <div className="glass-panel p-6 max-w-md w-full border-rose-500-50 glow-rose relative text-center">
            <button
              onClick={() => setStressReport(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-500-20 border border-rose-500-40 flex items-center justify-center mx-auto mb-3">
              <Flame className="w-7 h-7 text-rose-400" />
            </div>

            <h3 className="text-xl font-bold text-white font-heading mb-1">
              Load Test Benchmark Report
            </h3>
            <p className="text-xs text-gray-300 mb-4 font-mono">
              Evaluated under peak traffic simulation (25 RPS)
            </p>

            <div className="grid grid-cols-2 gap-3 bg-black-60 p-4 rounded-xl border border-white-10 text-left font-mono text-xs mb-4">
              <div>
                <span className="text-gray-400 block text-xs uppercase">Burst Requests:</span>
                <span className="text-white text-lg font-bold">{stressReport.total}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Passed 200:</span>
                <span className="text-emerald-400 text-lg font-bold">{stressReport.allowed}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Blocked 429:</span>
                <span className="text-rose-400 text-lg font-bold">{stressReport.blocked}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs uppercase">Drop Ratio:</span>
                <span className="text-amber-400 text-lg font-bold">{stressReport.dropRate}%</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 bg-blue-950-40 rounded-xl border border-blue-500-30 text-blue-300 text-xs font-mono mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Rating: <strong>{stressReport.score}</strong></span>
            </div>

            <button
              onClick={() => setStressReport(null)}
              className="btn-primary w-full justify-center py-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
