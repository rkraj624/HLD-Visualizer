import type { AlgorithmType, SimulationConfig, SimulationState } from '../types';

export interface CheckResult {
  allowed: boolean;
  newState: Partial<SimulationState>;
  reason?: string;
}

export function evaluateRateLimit(
  algorithm: AlgorithmType,
  state: SimulationState,
  config: SimulationConfig,
  now: number = Date.now(),
  idGenerator: () => string = () => Math.random().toString(36).substring(7)
): CheckResult {
  switch (algorithm) {
    case 'token-bucket':
      return evaluateTokenBucket(state, config, now);
    case 'leaky-bucket':
      return evaluateLeakyBucket(state, config, now, idGenerator);
    case 'fixed-window':
      return evaluateFixedWindow(state, config, now);
    case 'sliding-window-log':
      return evaluateSlidingWindowLog(state, config, now);
    case 'sliding-window-counter':
      return evaluateSlidingWindowCounter(state, config, now);
    default:
      return { allowed: true, newState: {} };
  }
}

// 1. Token Bucket
function evaluateTokenBucket(
  state: SimulationState,
  config: SimulationConfig,
  now: number
): CheckResult {
  const lastRefill = state.lastRefillTime || now;
  const timeElapsedSec = (now - lastRefill) / 1000;
  
  // Calculate tokens refilled
  const tokensToAdd = timeElapsedSec * config.refillRate;
  const newTokens = Math.min(config.capacity, state.tokens + tokensToAdd);

  if (newTokens >= 1) {
    return {
      allowed: true,
      newState: {
        tokens: newTokens - 1,
        lastRefillTime: now,
      },
    };
  } else {
    return {
      allowed: false,
      reason: `No tokens available (${newTokens.toFixed(1)} / ${config.capacity})`,
      newState: {
        tokens: newTokens,
        lastRefillTime: now,
      },
    };
  }
}

// 2. Leaky Bucket
function evaluateLeakyBucket(
  state: SimulationState,
  config: SimulationConfig,
  now: number,
  idGenerator: () => string
): CheckResult {
  // Queue size is capacity
  const queue = [...state.queue];

  if (queue.length < config.capacity) {
    queue.push({ id: idGenerator(), timestamp: now });
    return {
      allowed: true,
      newState: { queue },
    };
  } else {
    return {
      allowed: false,
      reason: `Leaky bucket buffer full (${queue.length}/${config.capacity})`,
      newState: { queue },
    };
  }
}

// Tick leaky bucket leak process
export function processLeakyBucketLeak(
  state: SimulationState,
  config: SimulationConfig,
  deltaSec: number
): Partial<SimulationState> {
  if (state.queue.length === 0) return {};
  
  // Number of items leaked in deltaSec
  const leakCount = Math.floor(deltaSec * config.refillRate);
  if (leakCount <= 0) return {};

  const newQueue = state.queue.slice(leakCount);
  return { queue: newQueue };
}

// 3. Fixed Window Counter
function evaluateFixedWindow(
  state: SimulationState,
  config: SimulationConfig,
  now: number
): CheckResult {
  let windowStart = state.currentWindowStart || now;
  let count = state.windowRequestCount || 0;

  // Check if window has expired
  if (now - windowStart >= config.windowMs) {
    windowStart = now;
    count = 0;
  }

  if (count < config.capacity) {
    return {
      allowed: true,
      newState: {
        currentWindowStart: windowStart,
        windowRequestCount: count + 1,
      },
    };
  } else {
    const timeLeftMs = Math.ceil(config.windowMs - (now - windowStart));
    return {
      allowed: false,
      reason: `Limit ${config.capacity} reached. Window resets in ${(timeLeftMs / 1000).toFixed(1)}s`,
      newState: {
        currentWindowStart: windowStart,
        windowRequestCount: count,
      },
    };
  }
}

// 4. Sliding Window Log
function evaluateSlidingWindowLog(
  state: SimulationState,
  config: SimulationConfig,
  now: number
): CheckResult {
  const windowStart = now - config.windowMs;
  // Prune logs older than windowStart
  const validLogs = state.requestLogs.filter((ts) => ts >= windowStart);

  if (validLogs.length < config.capacity) {
    return {
      allowed: true,
      newState: {
        requestLogs: [...validLogs, now],
      },
    };
  } else {
    const oldestInWindow = validLogs[0];
    const retryInMs = Math.max(0, oldestInWindow + config.windowMs - now);
    return {
      allowed: false,
      reason: `Sliding window log full (${validLogs.length}/${config.capacity}). Oldest timestamp expires in ${(retryInMs / 1000).toFixed(1)}s`,
      newState: {
        requestLogs: validLogs,
      },
    };
  }
}

// 5. Sliding Window Counter
function evaluateSlidingWindowCounter(
  state: SimulationState,
  config: SimulationConfig,
  now: number
): CheckResult {
  let currStart = state.currWindowStart || now;
  let prevCount = state.prevWindowCount || 0;
  let currCount = state.currWindowCount || 0;

  // If current window is older than 2 full windows, reset both
  const timeElapsed = now - currStart;
  if (timeElapsed >= config.windowMs * 2) {
    currStart = now;
    prevCount = 0;
    currCount = 0;
  } else if (timeElapsed >= config.windowMs) {
    // Rotate window
    prevCount = currCount;
    currCount = 0;
    currStart = currStart + config.windowMs;
  }

  // Weight of previous window
  const timeIntoCurrWindow = Math.max(0, now - currStart);
  const weight = Math.max(0, 1 - timeIntoCurrWindow / config.windowMs);
  const estimatedCount = prevCount * weight + currCount;

  if (estimatedCount < config.capacity) {
    return {
      allowed: true,
      newState: {
        currWindowStart: currStart,
        prevWindowCount: prevCount,
        currWindowCount: currCount + 1,
      },
    };
  } else {
    return {
      allowed: false,
      reason: `Estimated current count ${estimatedCount.toFixed(1)} exceeds limit of ${config.capacity}`,
      newState: {
        currWindowStart: currStart,
        prevWindowCount: prevCount,
        currWindowCount: currCount,
      },
    };
  }
}
