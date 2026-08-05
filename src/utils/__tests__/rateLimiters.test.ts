import { describe, it, expect } from 'vitest';
import { evaluateRateLimit, processLeakyBucketLeak } from '../rateLimiters';
import type { SimulationConfig, SimulationState } from '../../types';

const defaultConfig: SimulationConfig = {
  capacity: 5,
  refillRate: 2,
  windowMs: 1000,
  trafficRate: 5,
  trafficPattern: 'steady',
  simSpeed: 1,
  isPaused: false,
};

const defaultState: SimulationState = {
  tokens: 5,
  lastRefillTime: 1000,
  queue: [],
  currentWindowStart: 1000,
  windowRequestCount: 0,
  requestLogs: [],
  prevWindowCount: 0,
  currWindowCount: 0,
  currWindowStart: 1000,
  totalRequests: 0,
  allowedRequests: 0,
  rejectedRequests: 0,
  recentRps: 0,
  history: [],
  logs: [],
};

describe('Rate Limiter Characterization Tests', () => {
  describe('Token Bucket Algorithm', () => {
    it('allows request when tokens are available and updates state', () => {
      const result = evaluateRateLimit('token-bucket', defaultState, defaultConfig, 1000);
      expect(result.allowed).toBe(true);
      expect(result.newState.tokens).toBe(4);
      expect(result.newState.lastRefillTime).toBe(1000);
    });

    it('refills tokens based on elapsed time up to capacity', () => {
      const depletedState: SimulationState = {
        ...defaultState,
        tokens: 0,
        lastRefillTime: 1000,
      };
      const result = evaluateRateLimit('token-bucket', depletedState, defaultConfig, 2500);
      expect(result.allowed).toBe(true);
      expect(result.newState.tokens).toBe(2);
    });

    it('rejects request when tokens are depleted', () => {
      const emptyState: SimulationState = {
        ...defaultState,
        tokens: 0.5,
        lastRefillTime: 1000,
      };
      const result = evaluateRateLimit('token-bucket', emptyState, defaultConfig, 1000);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No tokens available');
    });
  });

  describe('Leaky Bucket Algorithm', () => {
    it('enqueues request when capacity is not reached', () => {
      const result = evaluateRateLimit('leaky-bucket', defaultState, defaultConfig, 1000);
      expect(result.allowed).toBe(true);
      expect(result.newState.queue?.length).toBe(1);
    });

    it('rejects request when bucket buffer is full', () => {
      const fullState: SimulationState = {
        ...defaultState,
        queue: [
          { id: '1', timestamp: 1000 },
          { id: '2', timestamp: 1000 },
          { id: '3', timestamp: 1000 },
          { id: '4', timestamp: 1000 },
          { id: '5', timestamp: 1000 },
        ],
      };
      const result = evaluateRateLimit('leaky-bucket', fullState, defaultConfig, 1000);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('buffer full');
    });

    it('leaks items based on refillRate and deltaSec', () => {
      const queuedState: SimulationState = {
        ...defaultState,
        queue: [
          { id: '1', timestamp: 1000 },
          { id: '2', timestamp: 1000 },
          { id: '3', timestamp: 1000 },
        ],
      };
      const leakResult = processLeakyBucketLeak(queuedState, defaultConfig, 1);
      expect(leakResult.queue?.length).toBe(1);
      expect(leakResult.queue?.[0].id).toBe('3');
    });
  });

  describe('Fixed Window Counter Algorithm', () => {
    it('allows request within window limit', () => {
      const result = evaluateRateLimit('fixed-window', defaultState, defaultConfig, 1200);
      expect(result.allowed).toBe(true);
      expect(result.newState.windowRequestCount).toBe(1);
    });

    it('resets counter when new window begins', () => {
      const stateEndWindow: SimulationState = {
        ...defaultState,
        currentWindowStart: 1000,
        windowRequestCount: 5,
      };
      const result = evaluateRateLimit('fixed-window', stateEndWindow, defaultConfig, 2100);
      expect(result.allowed).toBe(true);
      expect(result.newState.windowRequestCount).toBe(1);
      expect(result.newState.currentWindowStart).toBe(2100);
    });

    it('rejects when window capacity is reached', () => {
      const fullState: SimulationState = {
        ...defaultState,
        currentWindowStart: 1000,
        windowRequestCount: 5,
      };
      const result = evaluateRateLimit('fixed-window', fullState, defaultConfig, 1200);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limit 5 reached');
    });
  });

  describe('Sliding Window Log Algorithm', () => {
    it('prunes expired timestamps and allows request', () => {
      const stateWithLogs: SimulationState = {
        ...defaultState,
        requestLogs: [200, 400, 1100, 1200],
      };
      const result = evaluateRateLimit('sliding-window-log', stateWithLogs, defaultConfig, 1500);
      expect(result.allowed).toBe(true);
      expect(result.newState.requestLogs).toEqual([1100, 1200, 1500]);
    });

    it('rejects when log count in current window reaches capacity', () => {
      const fullLogsState: SimulationState = {
        ...defaultState,
        requestLogs: [1100, 1200, 1300, 1400, 1450],
      };
      const result = evaluateRateLimit('sliding-window-log', fullLogsState, defaultConfig, 1500);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Sliding window log full');
    });
  });

  describe('Sliding Window Counter Algorithm', () => {
    it('calculates weighted estimate and allows request', () => {
      const counterState: SimulationState = {
        ...defaultState,
        currWindowStart: 1000,
        prevWindowCount: 4,
        currWindowCount: 1,
      };
      const result = evaluateRateLimit('sliding-window-counter', counterState, defaultConfig, 1500);
      expect(result.allowed).toBe(true);
      expect(result.newState.currWindowCount).toBe(2);
    });

    it('rotates window when current window elapsed', () => {
      const counterState: SimulationState = {
        ...defaultState,
        currWindowStart: 1000,
        prevWindowCount: 2,
        currWindowCount: 4,
      };
      const result = evaluateRateLimit('sliding-window-counter', counterState, defaultConfig, 2200);
      expect(result.allowed).toBe(true);
      expect(result.newState.prevWindowCount).toBe(4);
      expect(result.newState.currWindowStart).toBe(2000);
    });

    it('rejects when estimated count exceeds capacity', () => {
      const fullCounterState: SimulationState = {
        ...defaultState,
        currWindowStart: 1000,
        prevWindowCount: 5,
        currWindowCount: 4,
      };
      const result = evaluateRateLimit('sliding-window-counter', fullCounterState, defaultConfig, 1200);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds limit');
    });
  });
});
