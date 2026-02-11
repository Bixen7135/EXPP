import { NextRequest } from 'next/server';
import { db, tasks, eq, and, isNull, sql, desc, count } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, handleApiError, buildPaginationMeta } from '@/lib/api-helpers';
import { searchQuerySchema } from '@/lib/schemas/search-schemas';

/**
 * GET /api/search
 * Full-text search for tasks using PostgreSQL tsvector index
 * Query params: q, type?, difficulty?, topic?, page?, limit?
 */
export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const userId = await getUserId();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const { q, type, difficulty, topic, page, limit } = searchQuerySchema.parse(searchParams);

    // Build WHERE conditions
    const conditions = [
      eq(tasks.userId, userId),
      isNull(tasks.deletedAt), // Exclude soft-deleted tasks
      sql`text_tsv @@ plainto_tsquery('english', ${q})`, // Full-text search
    ];

    // Add optional filters
    if (type) {
      conditions.push(eq(tasks.type, type));
    }
    if (difficulty) {
      conditions.push(eq(tasks.difficulty, difficulty));
    }
    if (topic) {
      conditions.push(eq(tasks.topic, topic));
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Execute search query with pagination
    const results = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination metadata
    const [{ total }] = await db
      .select({ total: count() })
      .from(tasks)
      .where(and(...conditions));

    // Build response with pagination metadata
    const pagination = buildPaginationMeta(page, limit, Number(total));

    return buildSuccessResponse({
      tasks: results,
      pagination,
    });
  } catch (error) {
    return handleApiError(error, 'Search API');
  }
}
