import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helpers';
import { exportRequestSchema } from '@/lib/schemas/export-schemas';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-helpers';

/**
 * POST /api/export
 *
 * Export content to PDF or DOCX format via export-worker service
 *
 * Rate limit: 5 requests per minute per user
 *
 * @body {
 *   content: string - Markdown content to export (max 1MB)
 *   format: 'pdf' | 'docx' - Export format (default: 'pdf')
 *   filename: string - Optional filename (default: 'export')
 * }
 *
 * @returns Binary file (PDF or DOCX) with Content-Disposition header
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const userId = await getUserId();

    // 2. Apply rate limiting: 5 requests per minute per user
    const rateLimitResult = await checkRateLimit(userId, 'export', 5, 60);

    // Add rate limit headers
    const headers = new Headers({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
    });

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfter || 60;
      headers.set('Retry-After', retryAfter.toString());

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        },
        { status: 429, headers }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validatedData = exportRequestSchema.parse(body);

    // 4. Check if export worker is configured
    const exportWorkerUrl = process.env.EXPORT_WORKER_URL;
    if (!exportWorkerUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Export service is not configured',
        },
        { status: 500, headers }
      );
    }

    // 5. Determine endpoint based on format
    const endpoint = validatedData.format === 'pdf' ? '/export/pdf' : '/export/docx';
    const fullUrl = `${exportWorkerUrl}${endpoint}`;

    // 6. Forward request to export-worker
    const workerResponse = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: validatedData.content,
        format: 'markdown',
      }),
    });

    // 7. Handle worker errors
    if (!workerResponse.ok) {
      const errorData = await workerResponse.json().catch(() => ({}));

      // Map worker errors to appropriate status codes
      if (workerResponse.status === 501) {
        return NextResponse.json(
          {
            success: false,
            error: 'DOCX export is not yet implemented',
          },
          { status: 501, headers }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate export',
          details: errorData.message || errorData.error,
        },
        { status: 502, headers }
      );
    }

    // 8. Get the binary content from worker
    const fileBuffer = await workerResponse.arrayBuffer();

    // 9. Determine content type and file extension
    const contentType = validatedData.format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const extension = validatedData.format;
    const filename = `${validatedData.filename}.${extension}`;

    // 10. Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Export API');
  }
}
