import { NextRequest, NextResponse } from 'next/server';
import { db, taskSheets, sheetVersions, eq, and, desc, count } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import {
  buildSuccessResponse,
  handleApiError,
  buildPaginationMeta,
} from '@/lib/api-helpers';
import {
  createVersionSchema,
  listVersionsQuerySchema,
} from '@/lib/schemas/sheet-schemas';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/sheets/[id]/versions
 * List all versions of a sheet with pagination
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = listVersionsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    });

    const offset = (query.page - 1) * query.limit;

    // Check if sheet exists and user owns it
    const [sheet] = await db
      .select({ id: taskSheets.id })
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!sheet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sheet not found',
          },
        },
        { status: 404 }
      );
    }

    // Get total count of versions
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(sheetVersions)
      .where(eq(sheetVersions.sheetId, id));

    // Get paginated versions (newest first)
    const versions = await db
      .select()
      .from(sheetVersions)
      .where(eq(sheetVersions.sheetId, id))
      .orderBy(desc(sheetVersions.createdAt))
      .limit(query.limit)
      .offset(offset);

    return buildSuccessResponse({
      versions,
      pagination: buildPaginationMeta(query.page, query.limit, Number(totalCount)),
    });
  } catch (error) {
    return handleApiError(error, 'fetch sheet versions');
  }
}

/**
 * POST /api/sheets/[id]/versions
 * Create a new version of the sheet (snapshot current state)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserId();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const data = createVersionSchema.parse(body);

    // Check if sheet exists and user owns it
    const [sheet] = await db
      .select({ id: taskSheets.id })
      .from(taskSheets)
      .where(and(eq(taskSheets.id, id), eq(taskSheets.userId, userId)))
      .limit(1);

    if (!sheet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Sheet not found',
          },
        },
        { status: 404 }
      );
    }

    // Create new version
    const [version] = await db
      .insert(sheetVersions)
      .values({
        sheetId: id,
        userId,
        title: data.title,
        description: data.description || null,
        tasks: data.tasks,
      })
      .returning();

    return buildSuccessResponse({ version }, 201);
  } catch (error) {
    return handleApiError(error, 'create sheet version');
  }
}
