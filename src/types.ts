export type AlgorithmType = 
  | 'token-bucket' 
  | 'leaky-bucket' 
  | 'fixed-window' 
  | 'sliding-window-log' 
  | 'sliding-window-counter';

export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  burstSupport: boolean;
  distributedSupport: 'High' | 'Medium' | 'Low';
  accentColor: string;
  bgGlow: string;
}

export interface RequestItem {
  id: string;
  timestamp: number;
  status: 'allowed' | 'rejected' | 'queued';
  clientIp: string;
  endpoint: string;
  latencyMs: number;
  reason?: string;
}

export interface SimulationConfig {
  capacity: number;         // Max tokens / Queue size / Max requests per window
  refillRate: number;       // Tokens added per second / Leak rate per second
  windowMs: number;         // Time window for fixed/sliding windows (in ms)
  trafficRate: number;      // Auto requests per second
  trafficPattern: 'steady' | 'spike' | 'wave' | 'ddos';
  simSpeed: number;         // 0.5x, 1x, 2x, 5x
  isPaused: boolean;
}

export interface SimulationState {
  // Token Bucket
  tokens: number;
  lastRefillTime: number;
  
  // Leaky Bucket
  queue: Array<{ id: string; timestamp: number }>;
  
  // Fixed Window
  currentWindowStart: number;
  windowRequestCount: number;
  
  // Sliding Window Log
  requestLogs: number[]; // Timestamps
  
  // Sliding Window Counter
  prevWindowCount: number;
  currWindowCount: number;
  currWindowStart: number;
  
  // Metrics
  totalRequests: number;
  allowedRequests: number;
  rejectedRequests: number;
  recentRps: number;
  history: Array<{ time: number; allowed: number; rejected: number; capacityPct: number }>;
  logs: RequestItem[];
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  algorithm: AlgorithmType;
  config: Partial<SimulationConfig>;
}
