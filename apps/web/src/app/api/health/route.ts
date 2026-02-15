import { NextResponse } from 'next/server';
import { db, sql } from '@expp/db';
import Redis from 'ioredis';

/**
 * Health check endpoint for Docker HEALTHCHECK and monitoring
 * Verifies database and Redis connectivity
 * Returns 200 OK if all services are healthy, 503 if any service is down
 */
export async function GET() {
  try {
    // Check database connection with simple query
    await db.execute(sql`SELECT 1`);

    // Check Redis connection with PING
    const redis = new Redis(process.env.REDIS_URL!);
    await redis.ping();
    await redis.quit();

    return NextResponse.json(
      {
        status: 'healthy',
        service: 'expp-web',
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health Check] Service unhealthy:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'expp-web',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
