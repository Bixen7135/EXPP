import { NextRequest } from 'next/server';
import { db, profiles, eq } from '@expp/db';
import { getUserId } from '@/lib/auth-helpers';
import { buildSuccessResponse, buildErrorResponse, handleApiError } from '@/lib/api-helpers';
import { saveAvatar, deleteAvatar, validateAvatarFile } from '@/lib/avatar-storage';

/**
 * POST /api/profile/avatar
 * Upload avatar and update profile
 *
 * @body file - Avatar image file (multipart/form-data)
 * @returns Updated profile with new avatar URL
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getUserId();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return buildErrorResponse('No file uploaded', 400);
    }

    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      return buildErrorResponse(validation.error || 'Invalid file', 400);
    }

    // Get current profile to check for existing avatar
    const currentProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!currentProfile) {
      return buildErrorResponse('Profile not found', 404);
    }

    // Delete old avatar if exists
    if (currentProfile.avatarUrl) {
      await deleteAvatar(currentProfile.avatarUrl);
    }

    // Save new avatar
    const avatarUrl = await saveAvatar(userId, file);

    // Update profile with new avatar URL
    const updatedProfile = await db
      .update(profiles)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning()
      .then((rows) => rows[0]);

    return buildSuccessResponse({
      profile: updatedProfile,
      avatarUrl,
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/profile/avatar');
  }
}
