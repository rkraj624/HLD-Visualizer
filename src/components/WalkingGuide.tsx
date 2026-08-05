import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, Volume2, VolumeX,
  Sparkles, Zap, Sliders, Eye, BarChart3, Code2, BookOpen,
  GitCompareArrows, Play, SkipForward, Navigation, Mic, Server,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface WalkingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  activeTopicId?: string;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  narration: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position: 'center' | 'top' | 'bottom';
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Rate Limiter Visualizer',
    description:
      'This is an interactive system design learning platform that helps you understand the 5 core rate-limiting algorithms used in production distributed systems — visually, interactively, and with real code.',
    narration:
      'Welcome to the Rate Limiter Visualizer! This is an interactive system design learning platform. It helps you understand the five core rate limiting algorithms used in production distributed systems, visually, interactively, and with real code. Let me show you around.',
    icon: <Zap className="w-7 h-7" />,
    position: 'center',
    accentColor: '#3b82f6',
  },
  {
    id: 'purpose',
    title: 'Why Rate Limiting Matters',
    description:
      'Rate limiting is a critical technique in system design to protect servers from being overwhelmed. It controls how many requests a client can make in a given time window. Companies like Stripe, AWS, Cloudflare, and GitHub all use rate limiters to guard their APIs.',
    narration:
      'Rate limiting is a critical technique in system design. It protects servers from being overwhelmed by controlling how many requests a client can make. Companies like Stripe, AWS, Cloudflare, and GitHub all rely on rate limiters to guard their APIs.',
    icon: <Sparkles className="w-7 h-7" />,
    position: 'center',
    accentColor: '#f59e0b',
  },
  {
    id: 'algorithm-selector',
    title: 'Choose an Algorithm',
    description:
      'Pick from 5 algorithms: Token Bucket, Leaky Bucket, Fixed Window Counter, Sliding Window Log, and Sliding Window Counter. Each card shows time complexity, burst support, and a quick tagline.',
    narration:
      'Start by picking an algorithm. You can choose from Token Bucket, Leaky Bucket, Fixed Window Counter, Sliding Window Log, or Sliding Window Counter. Each card shows the time complexity and whether it supports burst traffic.',
    icon: <Navigation className="w-7 h-7" />,
    position: 'top',
    accentColor: '#06b6d4',
  },
  {
    id: 'visualizer',
    title: 'Real-Time Visual Engine',
    description:
      'Watch the algorithm work in real time! The center panel shows animated internals — token circles filling a bucket, queues draining, window counters ticking, timestamps sliding. Flying packets show requests flowing from client to server.',
    narration:
      'This is the Visual Engine, the heart of the app. Watch the algorithm work in real time. You will see animated token circles, queue drains, window counters, and flying data packets showing whether requests pass or get blocked.',
    icon: <Eye className="w-7 h-7" />,
    position: 'top',
    accentColor: '#a855f7',
  },
  {
    id: 'controls',
    title: 'Tune the Simulation',
    description:
      'Adjust capacity, refill rate, window size, and traffic rate with interactive sliders. Switch traffic patterns between Steady, Spike, Wave, and DDoS. Change simulation speed or manually inject requests.',
    narration:
      'Use the Controls Panel to tune the simulation. Adjust capacity, refill rate, window size, and traffic rate. You can switch between Steady, Spike, Wave, and DDoS traffic patterns, change the speed, or manually send request bursts.',
    icon: <Sliders className="w-7 h-7" />,
    position: 'top',
    accentColor: '#10b981',
  },
  {
    id: 'metrics',
    title: 'Live Metrics & Request Log',
    description:
      'Track total requests, allowed/rejected counts, drop rates, and live RPS. The sparkline chart shows traffic history, and the request log table lets you inspect every single request with its IP, endpoint, status, and reason.',
    narration:
      'The Metrics Dashboard shows live stats: total requests, pass and block counts, drop rate, and a traffic sparkline chart. The request log table lets you inspect every single request with its IP, endpoint, status, and rejection reason.',
    icon: <BarChart3 className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#ec4899',
  },
  {
    id: 'code-lab',
    title: 'Production Code Snippets',
    description:
      'Grab production-ready implementations in Python, Go, TypeScript, and Redis Lua for every algorithm. Copy-paste directly into your projects or study them for interview prep.',
    narration:
      'The Code Lab gives you production ready implementations in Python, Go, TypeScript, and Redis Lua, for every algorithm. You can copy them directly into your projects or study them for system design interviews.',
    icon: <Code2 className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#06b6d4',
  },
  {
    id: 'education',
    title: 'Educational Deep Dives',
    description:
      'Each algorithm has step-by-step explanations, real-world analogies, trade-off analysis (pros vs cons), use cases from companies like AWS and Cloudflare, and distributed systems deployment notes.',
    narration:
      'The Educational Guide gives you deep dives into each algorithm: step by step explanations, real world analogies, trade off analysis, use cases from companies like AWS and Cloudflare, and notes on distributed deployments.',
    icon: <BookOpen className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#f59e0b',
  },
  {
    id: 'comparison',
    title: 'Compare All Algorithms',
    description:
      'The Comparison Matrix puts all 5 algorithms side-by-side: time complexity, space complexity, burst support, boundary vulnerability, and distributed scalability. Click any row to switch to that algorithm instantly.',
    narration:
      'Finally, the Comparison Matrix puts all five algorithms side by side. Compare time and space complexity, burst support, boundary vulnerability, and distributed scalability. Click any row to switch algorithms instantly.',
    icon: <GitCompareArrows className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#10b981',
  },
  {
    id: 'finish',
    title: "You're All Set! 🎉",
    description:
      "Start exploring by selecting an algorithm and hitting Play. Experiment with different traffic patterns and speeds to see how each algorithm behaves under pressure. Have fun learning system design!",
    narration:
      "You are all set! Start exploring by selecting an algorithm and hitting Play. Experiment with different traffic patterns and speeds. Have fun learning system design! You can replay this tour anytime by clicking the Tour Guide button in the header.",
    icon: <Sparkles className="w-7 h-7" />,
    position: 'center',
    accentColor: '#3b82f6',
  },
];

const LOAD_BALANCER_TOUR_STEPS: TourStep[] = [
  {
    id: 'lb-welcome',
    title: 'Welcome to Load Balancer Routing Engine',
    description:
      'This interactive module visualizes how production Load Balancers (like Nginx, HAProxy, Envoy, and AWS ALB) route client traffic across backend server pools with failover and health checks.',
    narration:
      'Welcome to the Load Balancer Routing Engine! This interactive module visualizes how production load balancers like Nginx, HAProxy, Envoy, and AWS ALB route client traffic across backend server pools with failover and health checks.',
    icon: <Server className="w-7 h-7 text-cyan-400" />,
    position: 'center',
    accentColor: '#06b6d4',
  },
  {
    id: 'lb-algorithms',
    title: 'Select Routing Strategy',
    description:
      'Switch between 4 production routing algorithms: Round Robin, Weighted Round Robin, Least Connections, and IP Hash (Session Stickiness). Each strategy distributes load differently based on server capacity.',
    narration:
      'You can switch between four production routing algorithms: Round Robin, Weighted Round Robin, Least Connections, and IP Hash. Each strategy distributes load differently based on server capacity and session state.',
    icon: <Navigation className="w-7 h-7 text-blue-400" />,
    position: 'top',
    accentColor: '#3b82f6',
  },
  {
    id: 'lb-topology',
    title: '3-Tier Network Topology Canvas',
    description:
      'Observe traffic flowing from Client IP Sources ➔ Load Balancer Proxy ➔ Backend Server Nodes. Target servers light up with a glowing cyan border when chosen.',
    narration:
      'The 3 tier network topology canvas shows requests flowing from Client IP sources, through the Load Balancer Proxy, directly to backend server nodes. Target servers light up with a glowing cyan border when chosen.',
    icon: <Eye className="w-7 h-7 text-purple-400" />,
    position: 'center',
    accentColor: '#a855f7',
  },
  {
    id: 'lb-health-failover',
    title: 'Simulate Server Failover (🟢 HEALTHY vs 🔴 DOWN)',
    description:
      'Click the HEALTHY badge on any server node to simulate a node crash. Watch the load balancer instantly detect the failure, skip dead servers, and failover traffic to healthy nodes.',
    narration:
      'You can click the HEALTHY badge on any server node to simulate a node crash. Watch the load balancer instantly detect the failure, skip dead servers, and failover traffic to healthy nodes.',
    icon: <Sliders className="w-7 h-7 text-rose-400" />,
    position: 'center',
    accentColor: '#ef4444',
  },
  {
    id: 'lb-weight-cpu',
    title: 'Capacity Weights & CPU Load Gauges',
    description:
      'Adjust server capacity weights (+ / -) to route more traffic to high-spec nodes. Monitor live CPU load gauges and active connection bars.',
    narration:
      'Adjust server capacity weights to route more traffic to high spec nodes. You can also monitor live CPU load gauges and active connection bars.',
    icon: <Sliders className="w-7 h-7 text-emerald-400" />,
    position: 'bottom',
    accentColor: '#10b981',
  },
  {
    id: 'lb-analytics-logs',
    title: 'Traffic Share & Live Terminal Logs',
    description:
      'Analyze relative server traffic share percentages in the progress bar chart and inspect real-time routing decision logs in the terminal console.',
    narration:
      'Finally, analyze relative server traffic share percentages in the progress bar chart and inspect real time routing decision logs in the terminal console.',
    icon: <BarChart3 className="w-7 h-7 text-amber-400" />,
    position: 'bottom',
    accentColor: '#f59e0b',
  },
];

const CACHING_TOUR_STEPS: TourStep[] = [
  {
    id: 'cache-welcome',
    title: 'Welcome to Distributed Caching Simulator',
    description:
      'This module lets you explore three core caching strategies used in production systems: Cache-Aside, Write-Through, and Write-Back, along with LRU eviction and Redis cluster patterns.',
    narration:
      'Welcome to the Distributed Caching Simulator! Here you can explore three core caching strategies: Cache-Aside, Write-Through, and Write-Back. You will also see LRU eviction and Redis cluster patterns in action.',
    icon: <Zap className="w-7 h-7" />,
    position: 'center',
    accentColor: '#10b981',
  },
  {
    id: 'cache-strategies',
    title: 'Choose a Cache Strategy',
    description:
      'Switch between Cache-Aside (lazy loading), Write-Through (synchronous writes), and Write-Back (async writes). Each strategy makes different trade-offs between consistency, latency, and durability.',
    narration:
      'Start by selecting a caching strategy. Cache-Aside lazily loads data on miss. Write-Through writes to cache and DB synchronously. Write-Back writes to cache first and flushes to DB asynchronously for best write performance.',
    icon: <Sliders className="w-7 h-7" />,
    position: 'top',
    accentColor: '#06b6d4',
  },
  {
    id: 'cache-lookup',
    title: 'Simulate Cache Hits & Misses',
    description:
      'Trigger cache lookups and watch the system return a HIT (data found in cache) or a MISS (data fetched from the database and then stored in cache). Monitor how hit rate improves over time.',
    narration:
      'Trigger lookups to see cache hits and misses in real time. When a key is found in cache, it is a HIT. When it is not, the system fetches from the database and stores the result — a MISS. Watch your hit rate climb as the cache warms up.',
    icon: <Eye className="w-7 h-7" />,
    position: 'center',
    accentColor: '#a855f7',
  },
  {
    id: 'cache-store',
    title: 'Live Cache Store & TTL',
    description:
      'Inspect the in-memory cache store. Each entry shows its key, stored value, TTL (time-to-live in seconds), and hit count. Entries are evicted using LRU when the cache reaches capacity.',
    narration:
      'The live cache store shows every cached entry with its key, value, TTL in seconds, and how many times it has been hit. When capacity is reached, the least recently used item is evicted first.',
    icon: <BarChart3 className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#f59e0b',
  },
  {
    id: 'cache-finish',
    title: "You're All Set! 🎉",
    description:
      'Try switching between strategies and observe how hit rate, latency, and write behavior differ. Caching is one of the most impactful levers in system design — master it here!',
    narration:
      'You are all set! Switch between strategies to compare behaviors. Caching is one of the highest leverage patterns in system design. Explore away, and replay this tour anytime from the header.',
    icon: <Sparkles className="w-7 h-7" />,
    position: 'center',
    accentColor: '#10b981',
  },
];

const CONSISTENT_HASHING_TOUR_STEPS: TourStep[] = [
  {
    id: 'ch-welcome',
    title: 'Welcome to Consistent Hashing Ring',
    description:
      'This module visualizes the consistent hashing ring used by distributed databases like DynamoDB, Cassandra, and Redis Cluster to distribute keys across nodes with minimal remapping on topology changes.',
    narration:
      'Welcome to the Consistent Hashing Ring visualizer! This shows how databases like DynamoDB and Cassandra distribute keys across nodes using a hash ring, with minimal remapping when nodes are added or removed.',
    icon: <Zap className="w-7 h-7" />,
    position: 'center',
    accentColor: '#f59e0b',
  },
  {
    id: 'ch-ring',
    title: 'The Hash Ring',
    description:
      'Each node is placed on a circular ring based on its hash value. Keys are also hashed to positions on the ring and routed to the nearest clockwise node. This ensures balanced distribution with O(log N) lookups.',
    narration:
      'Each server node is placed on a circular ring using its hash value. When a key arrives, it is hashed to a position on the ring and routed to the nearest node in the clockwise direction. This gives you balanced distribution with minimal remapping.',
    icon: <Eye className="w-7 h-7" />,
    position: 'center',
    accentColor: '#a855f7',
  },
  {
    id: 'ch-vnodes',
    title: 'Virtual Nodes (VNodes)',
    description:
      'Each physical node gets multiple positions (virtual nodes) on the ring for better load distribution. Adding a node with 3 vnodes means only 1/N of keys are remapped — not all of them.',
    narration:
      'Virtual nodes give each physical node multiple positions on the ring. This dramatically improves load balance. When you add a new node, only a fraction of keys are remapped, not the entire keyspace.',
    icon: <Sliders className="w-7 h-7" />,
    position: 'top',
    accentColor: '#06b6d4',
  },
  {
    id: 'ch-add-node',
    title: 'Add / Remove Nodes',
    description:
      'Click "Add Node" to insert a new server into the ring. Watch how only a subset of key assignments change — this is the key advantage over simple modulo hashing, where all keys must be remapped.',
    narration:
      'Try adding a node to the ring. Notice how only the keys between the new node and its predecessor are remapped. Compare this to simple modulo hashing where adding one server reshuffles every single key.',
    icon: <BarChart3 className="w-7 h-7" />,
    position: 'bottom',
    accentColor: '#f59e0b',
  },
  {
    id: 'ch-finish',
    title: "You're All Set! 🎉",
    description:
      'Consistent hashing is a core concept behind every horizontally scalable distributed system. Add nodes, observe key remapping, and master the pattern used by DynamoDB, Cassandra, and Redis Cluster.',
    narration:
      'You are all set! Consistent hashing is the backbone of every horizontally scalable database. Experiment with adding and removing nodes to see exactly how key remapping works. You can replay this tour anytime.',
    icon: <Sparkles className="w-7 h-7" />,
    position: 'center',
    accentColor: '#f59e0b',
  },
];

// Map of topic IDs to their dedicated tour steps
const TOPIC_TOUR_MAP: Record<string, TourStep[]> = {
  'rate-limiting': TOUR_STEPS,
  'load-balancing': LOAD_BALANCER_TOUR_STEPS,
  'caching': CACHING_TOUR_STEPS,
  'consistent-hashing': CONSISTENT_HASHING_TOUR_STEPS,
};

// Helper to filter out legacy robotic voices and get clean English human voices
function getHumanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices() || [];
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const pool = enVoices.length > 0 ? enVoices : voices;

  const roboticNames = [
    'alex', 'fred', 'cellos', 'bells', 'boing', 'whisper', 'zarvox',
    'albert', 'bad news', 'bahh', 'pipe organ', 'good news', 'hysterical',
    'deranged', 'trinoids', 'junior', 'ralph', 'vicki', 'bruce'
  ];

  return pool.filter(
    (v) => !roboticNames.some((robot) => v.name.toLowerCase().includes(robot))
  );
}

// Rank & pick the best human sounding voice
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // 1. Natural / Enhanced / Neural / Premium / Online / Google voices
  const highQualityKeywords = ['natural', 'enhanced', 'neural', 'premium', 'online', 'google'];
  const highQuality = voices.find((v) =>
    highQualityKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (highQuality) return highQuality;

  // 2. Preferred warm human voice names
  const preferredNames = [
    'ava', 'samantha', 'allison', 'serena', 'susan', 'zoe',
    'karen', 'moira', 'victoria', 'fiona', 'tessa', 'oliver', 'kate'
  ];
  const preferred = voices.find((v) =>
    preferredNames.some((name) => v.name.toLowerCase().includes(name))
  );
  if (preferred) return preferred;

  // 3. Any clean local English voice
  return voices.find((v) => v.localService) || voices[0];
}

export const WalkingGuide: React.FC<WalkingGuideProps> = ({ isOpen, onClose, activeTopicId }) => {
  const steps = (activeTopicId && TOPIC_TOUR_MAP[activeTopicId]) ? TOPIC_TOUR_MAP[activeTopicId] : TOUR_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const step = steps[currentStep] || steps[0];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Preload and filter voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const hVoices = getHumanVoices();
        setAvailableVoices(hVoices);
        if (!selectedVoice && hVoices.length > 0) {
          setSelectedVoice(pickBestVoice(hVoices));
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  // Stop speech on close or unmount
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsNarrating(false);
  }, []);

  // Narrate current step
  const narrateStep = useCallback(
    (stepIndex: number) => {
      if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

      stopSpeech();

      const targetStep = steps[stepIndex] || steps[0];
      const utterance = new SpeechSynthesisUtterance(targetStep.narration);
      // Human conversational prosody settings
      utterance.rate = 0.92;   // Natural speaking pace (not rushed)
      utterance.pitch = 1.02;  // Warm intonation
      utterance.volume = 0.95;

      const voiceToUse = selectedVoice || pickBestVoice(availableVoices) || pickBestVoice(getHumanVoices());
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => setIsNarrating(true);
      utterance.onend = () => setIsNarrating(false);
      utterance.onerror = () => setIsNarrating(false);

      synthRef.current = utterance;

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 250);
    },
    // `steps` is included so switching topics always narrates the correct topic's text
    [audioEnabled, selectedVoice, availableVoices, stopSpeech, steps]
  );

  // Auto-narrate when step changes or when topic switches (narrateStep recreated)
  useEffect(() => {
    if (isOpen && audioEnabled) {
      narrateStep(currentStep);
    }
    return () => stopSpeech();
  }, [currentStep, isOpen, narrateStep]); // narrateStep dep ensures topic switch re-fires correct audio

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsTransitioning(false);
    } else {
      stopSpeech();
    }
  }, [isOpen, stopSpeech]);

  const goToStep = useCallback(
    (nextStep: number) => {
      if (nextStep < 0 || nextStep >= totalSteps) return;
      stopSpeech();
      soundFx.playTourChime();
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(nextStep);
        setIsTransitioning(false);
      }, 200);
    },
    [totalSteps, stopSpeech]
  );

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      goToStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  const handleSkip = () => {
    stopSpeech();
    onClose();
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stopSpeech();
    }
    setAudioEnabled(!audioEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center tour-backdrop">
      {/* Backdrop */}
      <div
        className="absolute inset-0 tour-backdrop-bg"
        onClick={handleSkip}
      />

      {/* Ambient glow */}
      <div
        className="absolute w-96 h-96 rounded-full pointer-events-none tour-ambient-glow"
        style={{
          backgroundColor: step.accentColor,
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(120px)',
          opacity: 0.25,
        }}
      />

      {/* Tour Card */}
      <div
        className={`relative z-10 w-full tour-card ${isTransitioning ? 'tour-card-exit' : 'tour-card-enter'}`}
        style={{ maxWidth: '540px', margin: '0 1rem' }}
      >
        <div
          className="glass-panel tour-card-inner"
          style={{
            borderColor: step.accentColor,
            boxShadow: `0 0 50px ${step.accentColor}33, 0 25px 60px -12px rgba(0, 0, 0, 0.8)`,
          }}
        >
          {/* Top Bar: Step counter + controls */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: `${step.accentColor}22`,
                  color: step.accentColor,
                  border: `1px solid ${step.accentColor}44`,
                }}
              >
                {currentStep + 1} / {totalSteps}
              </span>
              <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                Tour Guide
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Voice Selector */}
              {audioEnabled && availableVoices.length > 1 && (
                <div className="tour-voice-select-wrapper">
                  <Mic className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const v = availableVoices.find((voice) => voice.name === e.target.value);
                      if (v) {
                        setSelectedVoice(v);
                        if (isNarrating) {
                          stopSpeech();
                          setTimeout(() => narrateStep(currentStep), 100);
                        }
                      }
                    }}
                    className="tour-voice-select"
                    title="Select Voice"
                  >
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name.replace(/Google|Microsoft|Apple|Online|\(Natural\)/gi, '').trim() || v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Audio Toggle */}
              <button
                onClick={toggleAudio}
                className="tour-control-btn"
                style={{
                  color: audioEnabled ? step.accentColor : '#64748b',
                  borderColor: audioEnabled ? `${step.accentColor}44` : 'rgba(255,255,255,0.1)',
                  backgroundColor: audioEnabled ? `${step.accentColor}15` : 'transparent',
                }}
                title={audioEnabled ? 'Mute narration' : 'Enable narration'}
              >
                {audioEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="tour-control-btn"
                style={{ color: '#64748b', borderColor: 'rgba(255,255,255,0.1)' }}
                title="Skip tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-3">
            <div className="w-full h-1 rounded-full tour-progress-track">
              <div
                className="h-full rounded-full tour-progress-bar"
                style={{
                  width: `${progress}%`,
                  backgroundColor: step.accentColor,
                  boxShadow: `0 0 10px ${step.accentColor}66`,
                }}
              />
            </div>
          </div>

          {/* Icon + Content */}
          <div className="px-6 pt-5 pb-2">
            {/* Icon Circle */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="tour-icon-circle"
                style={{
                  backgroundColor: `${step.accentColor}18`,
                  borderColor: `${step.accentColor}44`,
                  color: step.accentColor,
                }}
              >
                {step.icon}
              </div>
              <div className="flex-grow">
                <h3
                  className="text-lg font-extrabold text-white font-heading tracking-tight"
                  style={{ lineHeight: '1.3' }}
                >
                  {step.title}
                </h3>
                {isNarrating && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="tour-audio-bars">
                      <span style={{ backgroundColor: step.accentColor }} />
                      <span style={{ backgroundColor: step.accentColor }} />
                      <span style={{ backgroundColor: step.accentColor }} />
                      <span style={{ backgroundColor: step.accentColor }} />
                    </div>
                    <span
                      className="text-xs font-mono"
                      style={{ color: step.accentColor }}
                    >
                      Speaking ({selectedVoice ? selectedVoice.name.split(' ')[0] : 'Natural'})...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              {step.description}
            </p>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className="tour-step-dot"
                style={{
                  backgroundColor:
                    idx === currentStep
                      ? step.accentColor
                      : idx < currentStep
                        ? `${step.accentColor}66`
                        : 'rgba(100, 116, 139, 0.4)',
                  width: idx === currentStep ? '1.5rem' : '0.5rem',
                  boxShadow: idx === currentStep ? `0 0 8px ${step.accentColor}88` : 'none',
                }}
                title={`Step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-6 pb-5 pt-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="tour-nav-btn"
              style={{
                opacity: currentStep === 0 ? 0.3 : 1,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-2">
              {audioEnabled && !isNarrating && (
                <button
                  onClick={() => narrateStep(currentStep)}
                  className="tour-replay-btn"
                  style={{
                    color: step.accentColor,
                    borderColor: `${step.accentColor}44`,
                  }}
                  title="Replay narration"
                >
                  <Play className="w-3 h-3" /> Replay
                </button>
              )}

              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="tour-next-btn"
                  style={{
                    background: `linear-gradient(135deg, ${step.accentColor}, ${step.accentColor}cc)`,
                    boxShadow: `0 4px 16px ${step.accentColor}55`,
                  }}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="tour-next-btn"
                  style={{
                    background: `linear-gradient(135deg, ${step.accentColor}, ${step.accentColor}cc)`,
                    boxShadow: `0 4px 16px ${step.accentColor}55`,
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Start Exploring
                </button>
              )}
            </div>
          </div>

          {/* Skip Footer */}
          {currentStep < totalSteps - 1 && (
            <div className="flex justify-center pb-4">
              <button
                onClick={handleSkip}
                className="tour-skip-btn"
                title="Skip onboarding tour"
              >
                <SkipForward className="w-3.5 h-3.5" /> Skip tour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
