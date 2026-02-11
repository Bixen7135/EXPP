import { NextRequest, NextResponse } from 'next/server';
import { db, taskSheets, eq, desc, count, and, inArray } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import {
  buildSuccessResponse,
  handleApiError,
  buildPaginationMeta,
} from '@/lib/api-helpers';
import {
  createSheetSchema,
  deleteSheetSchema,
  listSheetsQuerySchema,
} from '@/lib/schemas/sheet-schemas';

/**
 * GET /api/sheets
 * List user's task sheets with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = listSheetsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      isTemplate: searchParams.get('isTemplate') || undefined,
      tags: searchParams.get('tags') || undefined,
    });

    const offset = (query.page - 1) * query.limit;

    // Build WHERE conditions
    const conditions = [eq(taskSheets.userId, userId)];

    // Filter by isTemplate
    if (query.isTemplate !== undefined) {
      const isTemplate = query.isTemplate === 'true';
      conditions.push(eq(taskSheets.isTemplate, isTemplate));
    }

    // Get total count
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(taskSheets)
      .where(and(...conditions));

    // Get paginated sheets
    const sheets = await db
      .select()
      .from(taskSheets)
      .where(and(...conditions))
      .orderBy(desc(taskSheets.createdAt))
      .limit(query.limit)
      .offset(offset);

    // Filter by tags in memory if tags filter is provided
    let filteredSheets = sheets;
    if (query.tags) {
      const tagArray = query.tags.split(',').map((t) => t.trim()).filter(Boolean);
      filteredSheets = sheets.filter((sheet) =>
        sheet.tags?.some((tag) => tagArray.includes(tag))
      );
    }

    return buildSuccessResponse({
      sheets: filteredSheets,
      pagination: buildPaginationMeta(query.page, query.limit, Number(totalCount)),
    });
  } catch (error) {
    return handleApiError(error, 'fetch sheets');
  }
}

/**
 * POST /api/sheets
 * Create a new task sheet
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate input
    const data = createSheetSchema.parse(body);

    // Create sheet
    const [sheet] = await db
      .insert(taskSheets)
      .values({
        userId,
        title: data.title,
        description: data.description || null,
        tasks: data.tasks,
        tags: data.tags,
        isTemplate: data.isTemplate,
      })
      .returning();

    return buildSuccessResponse({ sheet }, 201);
  } catch (error) {
    return handleApiError(error, 'create sheet');
  }
}

/**
 * DELETE /api/sheets
 * Delete multiple sheets (ownership verified)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate input
    const { sheetIds } = deleteSheetSchema.parse(body);

    // Verify ownership of all sheets
    const ownedSheets = await db
      .select({ id: taskSheets.id })
      .from(taskSheets)
      .where(and(inArray(taskSheets.id, sheetIds), eq(taskSheets.userId, userId)));

    if (ownedSheets.length !== sheetIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not own all specified sheets',
          },
        },
        { status: 403 }
      );
    }

    // Delete sheets
    await db.delete(taskSheets).where(inArray(taskSheets.id, sheetIds));

    return buildSuccessResponse({ deletedCount: sheetIds.length });
  } catch (error) {
    return handleApiError(error, 'delete sheets');
  }
}
