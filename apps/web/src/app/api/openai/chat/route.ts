import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getUserId } from '@/lib/auth-helpers';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildSuccessResponse, buildErrorResponse, handleApiError } from '@/lib/api-helpers';
import { openaiChatRequestSchema } from '@/lib/schemas/openai-schemas';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Rate limit configuration: 10 requests per minute
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60; // seconds

/**
 * POST /api/openai/chat
 * Proxy endpoint for OpenAI chat completions with rate limiting
 *
 * Rate limit: 10 requests per minute per user
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const userId = await getUserId();

    // 2. Rate limiting check
    const rateLimit = await checkRateLimit(
      userId,
      'openai-chat',
      RATE_LIMIT_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    // Add rate limit headers to response
    const headers = {
      'X-RateLimit-Limit': RATE_LIMIT_REQUESTS.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString(),
    };

    if (!rateLimit.allowed) {
      return NextResponse.json(
        buildErrorResponse('Rate limit exceeded. Please try again later.', 429),
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // 3. Check if OpenAI API key is configured
    if (!openai || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        buildErrorResponse(
          'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.',
          500
        ),
        { status: 500, headers }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = openaiChatRequestSchema.parse(body);

    // 5. Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: validatedData.model,
      messages: validatedData.messages,
      ...(validatedData.temperature !== undefined && { temperature: validatedData.temperature }),
      ...(validatedData.max_tokens !== undefined && { max_tokens: validatedData.max_tokens }),
    });

    // 6. Return successful response
    return NextResponse.json(buildSuccessResponse(completion), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    // Handle OpenAI-specific errors
    if (error?.status) {
      const statusCode = error.status;
      let message = 'OpenAI API error occurred';

      switch (statusCode) {
        case 401:
          message = 'Invalid OpenAI API key';
          break;
        case 429:
          message = 'OpenAI API rate limit exceeded';
          break;
        case 500:
        case 502:
        case 503:
          message = 'OpenAI API service error';
          break;
        default:
          message = error.message || message;
      }

      return NextResponse.json(buildErrorResponse(message, statusCode >= 500 ? 502 : statusCode), {
        status: statusCode >= 500 ? 502 : statusCode,
      });
    }

    // Handle all other errors
    return handleApiError(error, 'OpenAI chat completion');
  }
}
