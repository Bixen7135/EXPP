import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standard success response builder
 */
export function buildSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Standard error response builder
 */
export function buildErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  const response: { success: false; error: string; details?: unknown } = {
    success: false,
    error: message,
  };

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Handle API errors with appropriate status codes and messages
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`API Error in ${context}:`, error);

  // Zod validation error
  if (error instanceof z.ZodError) {
    return buildErrorResponse('Invalid input', 400, error.issues);
  }

  // Standard Error instance
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('not authenticated')) {
      return buildErrorResponse('Authentication required', 401);
    }

    if (error.message.includes('Unauthorized') || error.message.includes('not own')) {
      return buildErrorResponse(error.message, 403);
    }

    if (error.message.includes('not found')) {
      return buildErrorResponse(error.message, 404);
    }

    // Generic error with message
    return buildErrorResponse(error.message, 400);
  }

  // Unknown error type
  return buildErrorResponse(`Failed to ${context}`, 500);
}

/**
 * Validate pagination parameters from URL search params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function validatePagination(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse array query parameter (e.g., ?type=multiple&type=single)
 */
export function parseArrayParam(
  searchParams: URLSearchParams,
  key: string
): string[] | undefined {
  const values = searchParams.getAll(key);
  return values.length > 0 ? values : undefined;
}

/**
 * Parse boolean query parameter
 */
export function parseBooleanParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: boolean
): boolean | undefined {
  const value = searchParams.get(key);

  if (value === null) {
    return defaultValue;
  }

  return value === 'true' || value === '1';
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}
