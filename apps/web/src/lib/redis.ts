import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

/**
 * Get Redis client instance
 * Creates a singleton connection to Redis server
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY errors
          return true;
        }
        return false;
      },
    });

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis client connected');
    });

    redis.on('ready', () => {
      console.log('Redis client ready');
    });
  }

  return redis;
}

/**
 * Close Redis connection
 * Should be called on application shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// Export redis instance for direct use
export { redis };
