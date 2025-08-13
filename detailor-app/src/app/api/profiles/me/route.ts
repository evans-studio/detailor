export const runtime = 'nodejs';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error || !profile) {
      return createErrorResponse(
        API_ERROR_CODES.RECORD_NOT_FOUND,
        'Profile not found',
        { hint: 'Ensure sb-access-token cookie is present and not expired' },
        401
      );
    }
    
    return createSuccessResponse(profile);
  } catch (error: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.UNAUTHORIZED,
      (error as Error).message,
      { hint: 'Ensure sb-access-token cookie is present and not expired' },
      401
    );
  }
}


