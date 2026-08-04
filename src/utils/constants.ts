import type { AlgorithmInfo, ScenarioPreset } from '../types';

export const ALGORITHMS: Record<string, AlgorithmInfo> = {
  'token-bucket': {
    id: 'token-bucket',
    name: 'Token Bucket',
    shortName: 'Token Bucket',
    tagline: 'Ideal for bursting APIs with steady refill rate',
    description: 'Tokens are added to a bucket at a constant rate up to maximum capacity. Each request requires 1 token. Allows burst traffic up to capacity.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    burstSupport: true,
    distributedSupport: 'High',
    accentColor: '#3b82f6', // Bright Blue
    bgGlow: 'rgba(59, 130, 246, 0.15)',
  },
  'leaky-bucket': {
    id: 'leaky-bucket',
    name: 'Leaky Bucket',
    shortName: 'Leaky Bucket',
    tagline: 'Smooths out traffic bursts into a steady output stream',
    description: 'Requests enter a FIFO queue (the bucket) and leak out at a constant fixed processing rate. Overflowing requests are immediately rejected.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(N) queue',
    burstSupport: false,
    distributedSupport: 'Medium',
    accentColor: '#06b6d4', // Cyan
    bgGlow: 'rgba(6, 182, 212, 0.15)',
  },
  'fixed-window': {
    id: 'fixed-window',
    name: 'Fixed Window Counter',
    shortName: 'Fixed Window',
    tagline: 'Simple window count with potential reset-boundary spikes',
    description: 'Divides time into fixed windows (e.g. 1 min). A counter increments per request. Resets at every window boundary. Can allow 2x limit at boundaries.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    burstSupport: true,
    distributedSupport: 'High',
    accentColor: '#f59e0b', // Amber/Yellow
    bgGlow: 'rgba(245, 158, 11, 0.15)',
  },
  'sliding-window-log': {
    id: 'sliding-window-log',
    name: 'Sliding Window Log',
    shortName: 'Sliding Log',
    tagline: 'Exact precision by keeping timestamp logs of every request',
    description: 'Stores timestamp of every incoming request in a sorted set (e.g. Redis Sorted Set). Rejects if logs in [t - window, t] exceed capacity.',
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(N) high memory',
    burstSupport: true,
    distributedSupport: 'Medium',
    accentColor: '#ec4899', // Pink / Magenta
    bgGlow: 'rgba(236, 72, 153, 0.15)',
  },
  'sliding-window-counter': {
    id: 'sliding-window-counter',
    name: 'Sliding Window Counter',
    shortName: 'Sliding Counter',
    tagline: 'Combines memory efficiency with smooth window estimation',
    description: 'Calculates approximate request count by combining previous window count weighted by overlapping percentage + current window count.',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(1)',
    burstSupport: true,
    distributedSupport: 'High',
    accentColor: '#10b981', // Emerald Green
    bgGlow: 'rgba(16, 185, 129, 0.15)',
  },
};

export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'api-gateway',
    name: '🌐 Standard API Gateway',
    description: 'Token bucket with 10 token capacity and 3 tokens/sec refill for general web API endpoints.',
    algorithm: 'token-bucket',
    config: {
      capacity: 10,
      refillRate: 3,
      windowMs: 1000,
      trafficRate: 2,
      trafficPattern: 'steady',
    },
  },
  {
    id: 'payment-checkout',
    name: '💳 Payment Gateway Shield',
    description: 'Strict sliding window log (5 req / 5s) to prevent double charge or fraud attempts.',
    algorithm: 'sliding-window-log',
    config: {
      capacity: 5,
      refillRate: 1,
      windowMs: 5000,
      trafficRate: 2,
      trafficPattern: 'spike',
    },
  },
  {
    id: 'ddos-mitigation',
    name: '🛡️ Smooth DDoS Drainer',
    description: 'Leaky bucket with queue size 15 leaking at 4 req/sec to prevent downstream server crash.',
    algorithm: 'leaky-bucket',
    config: {
      capacity: 15,
      refillRate: 4,
      windowMs: 1000,
      trafficRate: 10,
      trafficPattern: 'ddos',
    },
  },
  {
    id: 'login-brute-force',
    name: '🔐 Auth & Login Rate Limit',
    description: 'Fixed window counter (5 attempts per window) preventing automated brute-force attacks.',
    algorithm: 'fixed-window',
    config: {
      capacity: 5,
      refillRate: 1,
      windowMs: 4000,
      trafficRate: 3,
      trafficPattern: 'spike',
    },
  },
];
