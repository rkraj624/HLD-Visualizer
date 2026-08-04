import type { AlgorithmType } from '../types';

export const CODE_SNIPPETS: Record<AlgorithmType, {
  python: string;
  javascript: string;
  go: string;
  java: string;
}> = {
  'token-bucket': {
    python: `import time
import redis

class TokenBucketRateLimiter:
    def __init__(self, r: redis.Redis, capacity: int, refill_rate: float):
        self.r = r
        self.capacity = capacity
        self.refill_rate = refill_rate # tokens per second

    def allow_request(self, user_id: str) -> bool:
        key = f"rate_limit:{user_id}"
        now = time.time()
        
        # Lua script guarantees atomic refill and token deduction
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])

        local data = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(data[1])
        local last_refill = tonumber(data[2])

        if not tokens then
            tokens = capacity
            last_refill = now
        else
            local delta = math.max(0, now - last_refill)
            tokens = math.min(capacity, tokens + delta * refill_rate)
            last_refill = now
        end

        if tokens >= 1 then
            tokens = tokens - 1
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
            redis.call('EXPIRE', key, math.ceil(capacity / refill_rate))
            return 1
        else
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
            return 0
        end
        """
        result = self.r.eval(lua_script, 1, key, self.capacity, self.refill_rate, now)
        return result == 1
`,
    javascript: `import Redis from 'ioredis';

export class TokenBucketLimiter {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async checkLimit(userId: string, capacity: number, refillRate: number): Promise<boolean> {
    const key = \`tb:\${userId}\`;
    const now = Date.now() / 1000;

    const script = \`
      local key = KEYS[1]
      local cap = tonumber(ARGV[1])
      local fill = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])

      local tokens = tonumber(redis.call('HGET', key, 'tokens'))
      local last = tonumber(redis.call('HGET', key, 'last'))

      if not tokens then
        tokens = cap
        last = now
      else
        local delta = math.max(0, now - last)
        tokens = math.min(cap, tokens + delta * fill)
        last = now
      end

      if tokens >= 1 then
        tokens = tokens - 1
        redis.call('HSET', key, 'tokens', tokens, 'last', last)
        redis.call('EXPIRE', key, 60)
        return 1
      else
        return 0
      end
    \`;

    const res = await this.redis.eval(script, 1, key, capacity, refillRate, now);
    return res === 1;
  }
}
`,
    go: `package main

import (
	"context"
	"golang.org/x/time/rate"
	"net/http"
	"sync"
)

type Visitor struct {
	limiter *rate.Limiter
}

var visitors = make(map[string]*Visitor)
var mu sync.Mutex

func getVisitor(ip string, cap int, refillRate float64) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(rate.Limit(refillRate), cap)
		visitors[ip] = &Visitor{limiter}
		return limiter
	}
	return v.limiter
}

func RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		limiter := getVisitor(r.RemoteAddr, 10, 3.0)
		if !limiter.Allow() {
			http.Error(w, "429 Too Many Requests", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
`,
    java: `import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import java.time.Duration;

public class TokenBucketService {

    private final Bucket bucket;

    public TokenBucketService(long capacity, long refillTokens, Duration period) {
        Bandwidth limit = Bandwidth.classic(
            capacity, 
            Refill.greedy(refillTokens, period)
        );
        this.bucket = Bucket.builder()
            .addLimit(limit)
            .build();
    }

    public boolean tryConsume() {
        return this.bucket.tryConsume(1);
    }
}
`
  },
  'leaky-bucket': {
    python: `import time, queue, threading

class LeakyBucket:
    def __init__(self, capacity: int, leak_interval_sec: float):
        self.capacity = capacity
        self.leak_interval = leak_interval_sec
        self.queue = queue.Queue(maxsize=capacity)
        self.worker = threading.Thread(target=self._leak, daemon=True)
        self.worker.start()

    def allow_request(self, request_id: str) -> bool:
        try:
            self.queue.put_nowait(request_id)
            return True
        except queue.Full:
            return False # Overflow! Rejected

    def _leak(self):
        while True:
            req = self.queue.get()
            # Process request at constant rate
            time.sleep(self.leak_interval)
            self.queue.task_done()
`,
    javascript: `export class LeakyBucketLimiter {
  private capacity: number;
  private leakRatePerSec: number;
  private queue: Array<{ id: string; resolve: (v: boolean) => void }> = [];

  constructor(capacity: number, leakRatePerSec: number) {
    this.capacity = capacity;
    this.leakRatePerSec = leakRatePerSec;
    setInterval(() => this.leak(), 1000 / leakRatePerSec);
  }

  async handleRequest(reqId: string): Promise<boolean> {
    if (this.queue.length >= this.capacity) {
      return false; // Rejected (429)
    }
    return new Promise((resolve) => {
      this.queue.push({ id: reqId, resolve });
    });
  }

  private leak() {
    if (this.queue.length > 0) {
      const item = this.queue.shift();
      item?.resolve(true); // Request processed
    }
  }
}
`,
    go: `package main

import (
	"fmt"
	"time"
)

type LeakyBucket struct {
	capacity int
	leakRate time.Duration
	queue    chan string
}

func NewLeakyBucket(cap int, leakRate time.Duration) *LeakyBucket {
	lb := &LeakyBucket{
		capacity: cap,
		leakRate: leakRate,
		queue:    make(chan string, cap),
	}
	go lb.startLeaking()
	return lb
}

func (lb *LeakyBucket) Allow(reqID string) bool {
	select {
	case lb.queue <- reqID:
		return true
	default:
		return false // Queue is full, drop request
	}
}

func (lb *LeakyBucket) startLeaking() {
	ticker := time.NewTicker(lb.leakRate)
	for range ticker.C {
		select {
		case req := <-lb.queue:
			fmt.Println("Processing leaked request:", req)
		default:
		}
	}
}
`,
    java: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class LeakyBucket {
    private final ArrayBlockingQueue<String> queue;

    public LeakyBucket(int capacity, long leakIntervalMs) {
        this.queue = new ArrayBlockingQueue<>(capacity);
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(this::leak, 0, leakIntervalMs, TimeUnit.MILLISECONDS);
    }

    public boolean allowRequest(String reqId) {
        return queue.offer(reqId); // returns false if queue is full
    }

    private void leak() {
        String req = queue.poll();
        if (req != null) {
            // Process request at constant rate
        }
    }
}
`
  },
  'fixed-window': {
    python: `import time
import redis

def check_fixed_window(r: redis.Redis, user_id: str, limit: int, window_sec: int) -> bool:
    current_window = int(time.time()) // window_sec
    key = f"rate:{user_id}:{current_window}"
    
    # Increment counter atomically
    current_count = r.incr(key)
    if current_count == 1:
        r.expire(key, window_sec + 1)
        
    return current_count <= limit
`,
    javascript: `import Redis from 'ioredis';

async function isAllowedFixedWindow(
  redis: Redis,
  userId: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const currentWindow = Math.floor(Date.now() / 1000 / windowSec);
  const key = \`fw:\${userId}:\${currentWindow}\`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }

  return count <= limit;
}
`,
    go: `package main

import (
	"context"
	"fmt"
	"time"
	"github.com/redis/go-redis/v9"
)

func AllowFixedWindow(ctx context.Context, rdb *redis.Client, userID string, limit int64, windowSec int64) bool {
	window := time.Now().Unix() / windowSec
	key := fmt.Sprintf("fw:%s:%d", userID, window)

	count, err := rdb.Incr(ctx, key).Result()
	if err != nil {
		return false
	}
	if count == 1 {
		rdb.Expire(ctx, key, time.Duration(windowSec)*time.Second)
	}

	return count <= limit
}
`,
    java: `import redis.clients.jedis.Jedis;

public class FixedWindowRateLimiter {
    private final Jedis jedis;

    public FixedWindowRateLimiter(Jedis jedis) {
        this.jedis = jedis;
    }

    public boolean allow(String userId, int limit, int windowSeconds) {
        long currentWindow = System.currentTimeMillis() / 1000 / windowSeconds;
        String key = "fw:" + userId + ":" + currentWindow;

        long count = jedis.incr(key);
        if (count == 1) {
            jedis.expire(key, windowSeconds);
        }
        return count <= limit;
    }
}
`
  },
  'sliding-window-log': {
    python: `import time
import redis

def check_sliding_window_log(r: redis.Redis, user_id: str, limit: int, window_sec: int) -> bool:
    key = f"swl:{user_id}"
    now = time.time()
    clear_before = now - window_sec
    
    pipe = r.pipeline()
    # 1. Remove old timestamps outside current window
    pipe.zremrangebyscore(key, 0, clear_before)
    # 2. Count timestamps remaining in current window
    pipe.zcard(key)
    # 3. Add current timestamp
    pipe.zadd(key, {str(now): now})
    # 4. Set TTL
    pipe.expire(key, window_sec + 1)
    
    results = pipe.execute()
    count_before_add = results[1]
    
    if count_before_add >= limit:
        # Revert addition if rejected
        r.zrem(key, str(now))
        return False
    return True
`,
    javascript: `import Redis from 'ioredis';

async function isAllowedSlidingLog(
  redis: Redis,
  userId: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const key = \`swl:\${userId}\`;
  const now = Date.now();
  const windowStart = now - (windowSec * 1000);

  const lua = \`
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowStart = tonumber(ARGV[2])
    local limit = tonumber(ARGV[3])
    local windowSec = tonumber(ARGV[4])

    redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
    local currentCount = redis.call('ZCARD', key)

    if currentCount < limit then
      redis.call('ZADD', key, now, now)
      redis.call('EXPIRE', key, windowSec + 1)
      return 1
    else
      return 0
    end
  \`;

  const res = await redis.eval(lua, 1, key, now, windowStart, limit, windowSec);
  return res === 1;
}
`,
    go: `package main

import (
	"context"
	"strconv"
	"time"
	"github.com/redis/go-redis/v9"
)

func AllowSlidingWindowLog(ctx context.Context, rdb *redis.Client, userID string, limit int64, windowSec int64) bool {
	key := "swl:" + userID
	now := time.Now().UnixNano() / int64(time.Millisecond)
	windowStart := now - (windowSec * 1000)

	pipe := rdb.Pipeline()
	pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(windowStart, 10))
	countCmd := pipe.ZCard(ctx, key)
	pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: strconv.FormatInt(now, 10)})
	pipe.Expire(ctx, key, time.Duration(windowSec+1)*time.Second)

	_, err := pipe.Exec(ctx)
	if err != nil {
		return false
	}

	return countCmd.Val() < limit
}
`,
    java: `import redis.clients.jedis.Jedis;
import redis.clients.jedis.Transaction;

public class SlidingWindowLog {
    private final Jedis jedis;

    public SlidingWindowLog(Jedis jedis) {
        this.jedis = jedis;
    }

    public boolean allowRequest(String userId, int limit, int windowSeconds) {
        String key = "swl:" + userId;
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);

        Transaction tx = jedis.multi();
        tx.zremrangeByScore(key, 0, windowStart);
        tx.zcard(key);
        tx.zadd(key, now, String.valueOf(now));
        tx.expire(key, windowSeconds + 1);

        var results = tx.exec();
        long countBeforeAdd = (long) results.get(1);
        return countBeforeAdd < limit;
    }
}
`
  },
  'sliding-window-counter': {
    python: `import time
import redis

def check_sliding_window_counter(r: redis.Redis, user_id: str, limit: int, window_sec: int) -> bool:
    now = time.time()
    current_window = int(now // window_sec)
    prev_window = current_window - 1
    
    curr_key = f"swc:{user_id}:{current_window}"
    prev_key = f"swc:{user_id}:{prev_window}"
    
    curr_count = int(r.get(curr_key) or 0)
    prev_count = int(r.get(prev_key) or 0)
    
    # Calculate weight of previous window based on time elapsed in current window
    time_into_curr_window = now % window_sec
    weight = 1 - (time_into_curr_window / window_sec)
    
    estimated_count = prev_count * weight + curr_count
    
    if estimated_count < limit:
        r.incr(curr_key)
        r.expire(curr_key, window_sec * 2)
        return True
    return False
`,
    javascript: `import Redis from 'ioredis';

async function isAllowedSlidingCounter(
  redis: Redis,
  userId: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const now = Date.now() / 1000;
  const currentWindow = Math.floor(now / windowSec);
  const prevWindow = currentWindow - 1;

  const currKey = \`swc:\${userId}:\${currentWindow}\`;
  const prevKey = \`swc:\${userId}:\${prevWindow}\`;

  const [currCountStr, prevCountStr] = await redis.mget(currKey, prevKey);
  const currCount = parseInt(currCountStr || '0', 10);
  const prevCount = parseInt(prevCountStr || '0', 10);

  const timeIntoCurrWindow = now % windowSec;
  const weight = 1 - (timeIntoCurrWindow / windowSec);
  const estimatedCount = (prevCount * weight) + currCount;

  if (estimatedCount < limit) {
    await redis.incr(currKey);
    await redis.expire(currKey, windowSec * 2);
    return true;
  }
  return false;
}
`,
    go: `package main

import (
	"context"
	"fmt"
	"math"
	"time"
	"github.com/redis/go-redis/v9"
)

func AllowSlidingWindowCounter(ctx context.Context, rdb *redis.Client, userID string, limit float64, windowSec float64) bool {
	now := float64(time.Now().UnixNano()) / 1e9
	currWin := int64(now / windowSec)
	prevWin := currWin - 1

	currKey := fmt.Sprintf("swc:%s:%d", userID, currWin)
	prevKey := fmt.Sprintf("swc:%s:%d", userID, prevWin)

	vals, _ := rdb.MGet(ctx, currKey, prevKey).Result()
	currCount := parseVal(vals[0])
	prevCount := parseVal(vals[1])

	timeIntoCurr := math.Mod(now, windowSec)
	weight := 1.0 - (timeIntoCurr / windowSec)
	estimated := (prevCount * weight) + currCount

	if estimated < limit {
		rdb.Incr(ctx, currKey)
		rdb.Expire(ctx, currKey, time.Duration(windowSec*2)*time.Second)
		return true
	}
	return false
}

func parseVal(v interface{}) float64 {
	if v == nil { return 0 }
	var res float64
	fmt.Sscanf(fmt.Sprintf("%v", v), "%f", &res)
	return res
}
`,
    java: `import redis.clients.jedis.Jedis;

public class SlidingWindowCounter {
    private final Jedis jedis;

    public SlidingWindowCounter(Jedis jedis) {
        this.jedis = jedis;
    }

    public boolean allowRequest(String userId, double limit, double windowSec) {
        double now = System.currentTimeMillis() / 1000.0;
        long currentWindow = (long) (now / windowSec);
        long prevWindow = currentWindow - 1;

        String currKey = "swc:" + userId + ":" + currentWindow;
        String prevKey = "swc:" + userId + ":" + prevWindow;

        String currVal = jedis.get(currKey);
        String prevVal = jedis.get(prevKey);

        double currCount = currVal != null ? Double.parseDouble(currVal) : 0;
        double prevCount = prevVal != null ? Double.parseDouble(prevVal) : 0;

        double timeIntoCurrWindow = now % windowSec;
        double weight = 1.0 - (timeIntoCurrWindow / windowSec);
        double estimatedCount = (prevCount * weight) + currCount;

        if (estimatedCount < limit) {
            jedis.incr(currKey);
            jedis.expire(currKey, (int) windowSec * 2);
            return true;
        }
        return false;
    }
}
`
  }
};
