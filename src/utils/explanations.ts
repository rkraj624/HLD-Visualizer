import type { AlgorithmType } from '../types';

export interface AlgorithmExplanation {
  id: AlgorithmType;
  title: string;
  analogy: string;
  simpleSummary: string;
  formula: string;
  steps: Array<{ step: number; title: string; desc: string }>;
  pros: string[];
  cons: string[];
  useCases: string[];
}

export const EXPLANATIONS: Record<AlgorithmType, AlgorithmExplanation> = {
  'token-bucket': {
    id: 'token-bucket',
    title: 'Token Bucket Algorithm',
    analogy: '🎮 Arcade Machine Token Dispenser',
    simpleSummary: 'Imagine a bucket holding tokens. A machine drops new tokens into the bucket at a steady speed (e.g., 3 tokens/sec) up to a max limit. Every incoming request must pay 1 token to pass. If tokens are available, the request passes immediately. If empty, the request is rejected.',
    formula: 'Tokens_new = Min(Capacity, Tokens_old + (Time_elapsed × Refill_Rate))',
    steps: [
      {
        step: 1,
        title: 'Incoming Request',
        desc: 'A client sends an HTTP request to an API endpoint.',
      },
      {
        step: 2,
        title: 'Lazy Token Refill',
        desc: 'The engine calculates how much time passed since last request and adds (Time × RefillRate) tokens up to Capacity.',
      },
      {
        step: 3,
        title: 'Token Deduction Check',
        desc: 'If Current Tokens >= 1, subtract 1 token and allow request (HTTP 200 OK).',
      },
      {
        step: 4,
        title: 'Rejection Handling',
        desc: 'If Current Tokens < 1, reject request immediately with HTTP 429 Too Many Requests.',
      },
    ],
    pros: [
      'Allows sudden short traffic bursts up to full bucket capacity.',
      'Extremely memory efficient (only 2 numbers stored: current tokens & last timestamp).',
      'Very fast O(1) time complexity.',
    ],
    cons: [
      'Can allow burst traffic to temporarily stress downstream servers.',
      'Requires careful tuning of both Capacity and Refill Rate.',
    ],
    useCases: [
      'Stripe & GitHub Public APIs (allowing short burst user requests).',
      'AWS API Gateway & NGINX Rate Limiter.',
    ],
  },
  'leaky-bucket': {
    id: 'leaky-bucket',
    title: 'Leaky Bucket Algorithm',
    analogy: '☕ Coffee Funnel Leaking at Constant Speed',
    simpleSummary: 'Imagine a funnel with a tiny hole at the bottom. Requests fill up the funnel (a FIFO queue). The funnel leaks requests out from the bottom to the server at a perfectly smooth, constant rate. If the funnel gets full, new incoming requests overflow and get dropped.',
    formula: 'Leaked_Items = Delta_Time × Leak_Rate | Queue_Max = Capacity',
    steps: [
      {
        step: 1,
        title: 'Request Enters Buffer',
        desc: 'Incoming HTTP request arrives and checks if the FIFO queue buffer has space.',
      },
      {
        step: 2,
        title: 'Queue Capacity Evaluation',
        desc: 'If Queue Length < Max Capacity, the request is appended to the back of the queue.',
      },
      {
        step: 3,
        title: 'Constant Rate Drain',
        desc: 'A background worker process processes requests from the front of the queue at a fixed rate (e.g. 4 req/sec).',
      },
      {
        step: 4,
        title: 'Overflow Rejection',
        desc: 'If the queue buffer is 100% full, new incoming requests are immediately dropped (HTTP 429).',
      },
    ],
    pros: [
      'Guarantees smooth, constant output traffic rate regardless of bursty input.',
      'Protects fragile downstream servers and databases from load spikes.',
    ],
    cons: [
      'Adds latency because requests wait inside the queue before execution.',
      'Bursts are delayed or rejected rather than processed immediately.',
    ],
    useCases: [
      'E-commerce Payment & Checkout Processing (preventing database overload).',
      'Network Packet Traffic Shaping (e.g., VoIP, video streaming).',
    ],
  },
  'fixed-window': {
    id: 'fixed-window',
    title: 'Fixed Window Counter Algorithm',
    analogy: '⏱️ Hourly Bus Ticket Quota (Reset on the Dot)',
    simpleSummary: 'Time is divided into fixed time windows (e.g., 00:00 to 00:01). A simple counter increments for each request. When the window ends (e.g., 00:01:00 hits), the counter instantly resets back to zero.',
    formula: 'Count = Count + 1 if (Now - Window_Start < Window_Ms) else Reset Count = 1',
    steps: [
      {
        step: 1,
        title: 'Identify Current Window',
        desc: 'Determine current time window slice (e.g. Current Minute 12:05).',
      },
      {
        step: 2,
        title: 'Check Window Expiration',
        desc: 'If time exceeded window duration, reset counter to 0 and start new window.',
      },
      {
        step: 3,
        title: 'Compare Counter against Limit',
        desc: 'If Counter < Max Limit, increment counter by 1 and allow request.',
      },
      {
        step: 4,
        title: 'Block Excess Requests',
        desc: 'If Counter >= Max Limit, reject all remaining requests until window resets.',
      },
    ],
    pros: [
      'Simplest algorithm to implement in Redis (using INCR and EXPIRE).',
      'O(1) time complexity and ultra-low memory usage.',
    ],
    cons: [
      'Boundary Spike Vulnerability: User can send full quota at 00:59 and another full quota at 01:01, allowing 2x limit in a short burst!',
    ],
    useCases: [
      'Auth & Login Brute Force Protection (5 failed logins per 5 minutes).',
      'Simple Web Crawling & Scraping Rate Limits.',
    ],
  },
  'sliding-window-log': {
    id: 'sliding-window-log',
    title: 'Sliding Window Log Algorithm',
    analogy: '🛡️ Wristband Bouncer Checking Exact Time Stamps',
    simpleSummary: 'Instead of fixed hourly blocks, the engine keeps a log of exact timestamps for every single request in memory. When a new request arrives, it discards timestamps older than (Now - WindowDuration) and counts how many valid logs remain.',
    formula: 'Prune timestamps < (Now - Window_Ms) | Valid_Logs_Count < Limit',
    steps: [
      {
        step: 1,
        title: 'Log Retrieval',
        desc: 'Fetch sorted set of timestamps for the client IP / User ID.',
      },
      {
        step: 2,
        title: 'Prune Expired Entries',
        desc: 'Remove all timestamps older than (Current Time - Window Duration).',
      },
      {
        step: 3,
        title: 'Evaluate Exact Log Count',
        desc: 'Count remaining valid timestamps in the rolling window.',
      },
      {
        step: 4,
        title: 'Append Timestamp or Reject',
        desc: 'If count < Limit, add current timestamp to log and allow request. Otherwise reject.',
      },
    ],
    pros: [
      '100% Mathematically Exact precision: No boundary spike vulnerability!',
      'Smooth sliding window evaluation.',
    ],
    cons: [
      'High Memory Usage: Stores a timestamp entry for every single request.',
      'Slower performance O(log N) due to set pruning.',
    ],
    useCases: [
      'Financial Transactions & High-Security Microservices.',
      'Strict Anti-Fraud & Single-Use Coupon Code Redemption.',
    ],
  },
  'sliding-window-counter': {
    id: 'sliding-window-counter',
    title: 'Sliding Window Counter Algorithm',
    analogy: '📊 Weighted Blend of Past Window + Current Window',
    simpleSummary: 'Combines the low memory of Fixed Window with the accuracy of Sliding Log. It estimates current traffic by taking the Previous Window request count weighted by the overlap percentage + Current Window request count.',
    formula: 'Estimated_Count = (Prev_Count × (1 - Overlap_Pct)) + Curr_Count',
    steps: [
      {
        step: 1,
        title: 'Calculate Window Overlap',
        desc: 'Determine how far into the current window we are (e.g. 30% into current minute means 70% overlap with previous minute).',
      },
      {
        step: 2,
        title: 'Weighted Estimation Formula',
        desc: 'Calculate Estimated Count = (PrevCount × 70%) + CurrCount.',
      },
      {
        step: 3,
        title: 'Capacity Decision',
        desc: 'If Estimated Count < Limit, increment CurrCount by 1 and allow request.',
      },
      {
        step: 4,
        title: 'Window Rotation',
        desc: 'When current window finishes, set PrevCount = CurrCount and reset CurrCount = 0.',
      },
    ],
    pros: [
      'Smooths out boundary spikes without storing individual request logs.',
      'Super memory efficient O(1) (only 2 counter numbers needed).',
      'Industry standard approach used by Cloudflare.',
    ],
    cons: [
      'Minor mathematical approximation error (~5% variance assuming uniform traffic distribution).',
    ],
    useCases: [
      'Cloudflare Edge Rate Limiting.',
      'High-Scale Microservices & Distributed Web Gateways.',
    ],
  },
};
