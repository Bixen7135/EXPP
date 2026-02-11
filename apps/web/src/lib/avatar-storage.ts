import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads/avatars';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Save avatar file to local storage
 *
 * @param userId - User identifier
 * @param file - File to upload
 * @returns Public URL path for the avatar
 */
export async function saveAvatar(userId: string, file: File): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error(
      `File too large. Maximum size: ${Math.round(MAX_SIZE / 1024 / 1024)}MB`
    );
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${userId}-${Date.now()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  try {
    // Ensure directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file
    await writeFile(filepath, buffer);

    // Return public URL
    return `/uploads/avatars/${filename}`;
  } catch (error) {
    console.error('Failed to save avatar:', error);
    throw new Error('Failed to upload avatar');
  }
}

/**
 * Delete avatar file from storage
 *
 * @param avatarUrl - Public URL or filename of avatar to delete
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const filename = avatarUrl.split('/').pop();
    if (!filename) {
      return;
    }

    const filepath = join(UPLOAD_DIR, filename);

    // Delete file (ignore if doesn't exist)
    await unlink(filepath).catch(() => {
      // File doesn't exist, ignore error
    });
  } catch (error) {
    console.error('Failed to delete avatar:', error);
    // Don't throw - deletion failures shouldn't block operations
  }
}

/**
 * Get absolute file path from avatar URL
 *
 * @param avatarUrl - Public URL of avatar
 * @returns Absolute file path
 */
export function getAvatarPath(avatarUrl: string): string {
  const filename = avatarUrl.split('/').pop();
  if (!filename) {
    throw new Error('Invalid avatar URL');
  }
  return join(UPLOAD_DIR, filename);
}

/**
 * Validate avatar file before upload
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(MAX_SIZE / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}
