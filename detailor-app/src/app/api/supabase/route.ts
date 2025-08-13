import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseClient } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const client = getSupabaseClient();
    return createSuccessResponse({ clientCreated: Boolean(client) });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/supabase' }, 500);
  }
}


