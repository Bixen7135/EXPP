import { NextRequest, NextResponse } from 'next/server';
import { db, profiles, eq } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, buildErrorResponse, handleApiError } from '@/lib/api-helpers';
import { updateProfileSchema } from '@/lib/schemas/profile-schemas';

/**
 * GET /api/profile
 * Get current user's profile
 *
 * @returns Profile data
 */
export async function GET() {
  try {
    // Get authenticated user ID
    const userId = await getUserId();

    // Fetch profile
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!profile) {
      return buildErrorResponse('Profile not found', 404);
    }

    return buildSuccessResponse(profile);
  } catch (error) {
    return handleApiError(error, 'GET /api/profile');
  }
}

/**
 * PUT /api/profile
 * Update current user's profile
 *
 * @body firstName - First name (optional)
 * @body lastName - Last name (optional)
 * @body avatarUrl - Avatar URL (optional)
 * @body preferences - User preferences JSON (optional)
 * @returns Updated profile
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getUserId();

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Check if there's anything to update
    if (Object.keys(validatedData).length === 0) {
      return buildErrorResponse('No fields to update', 400);
    }

    // Update profile
    const updatedProfile = await db
      .update(profiles)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning()
      .then((rows) => rows[0]);

    if (!updatedProfile) {
      return buildErrorResponse('Profile not found', 404);
    }

    return buildSuccessResponse(updatedProfile);
  } catch (error) {
    return handleApiError(error, 'PUT /api/profile');
  }
}
