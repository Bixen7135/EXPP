import { getRedisClient } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit using Redis sliding window algorithm
 *
 * @param userId - User identifier
 * @param endpoint - Endpoint identifier (e.g., 'openai-chat', 'export')
 * @param limit - Maximum number of requests allowed
 * @param window - Time window in seconds
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = 10,
  window: number = 60
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `rate-limit:${endpoint}:${userId}`;
  const now = Date.now();
  const windowMs = window * 1000;
  const windowStart = now - windowMs;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    pipeline.zcard(key);

    // Add current request timestamp
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on key
    pipeline.expire(key, window);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline returned null');
    }

    // Extract count from pipeline results
    // results[1] is the zcard result: [error, count]
    const count = (results[1][1] as number) || 0;

    const allowed = count < limit;
    const remaining = Math.max(0, limit - count - 1);
    const reset = now + windowMs;

    if (!allowed) {
      // Get oldest request in window to calculate retry time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldest.length > 1 ? parseInt(oldest[1]) : now;
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      // Remove the request we just added since it's not allowed
      await redis.zrem(key, `${now}-${Math.random()}`);

      return {
        allowed: false,
        remaining: 0,
        reset,
        retryAfter: Math.max(1, retryAfter),
      };
    }

    return {
      allowed: true,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On Redis failure, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }
}

/**
 * Reset rate limit for a user and endpoint
 * Useful for testing or administrative purposes
 */
export async function resetRateLimit(
  userId: string,
  endpoint: string
): Promise<void> {
  const redis = getRedisClient();
  const key = `rate-limit:${endpoint}:${userId}`;
  await redis.del(key);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  userId: string,
  endpoint: string,
  limit: number = 10,
  window: number = 60
): Promise<Omit<RateLimitResult, 'allowed'>> {
  const redis = getRedisClient();
  const key = `rate-limit:${endpoint}:${userId}`;
  const now = Date.now();
  const windowMs = window * 1000;
  const windowStart = now - windowMs;

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(key);

    const remaining = Math.max(0, limit - count);
    const reset = now + windowMs;

    return {
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return {
      remaining: limit,
      reset: now + windowMs,
    };
  }
}
