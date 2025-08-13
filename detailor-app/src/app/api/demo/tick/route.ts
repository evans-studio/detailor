import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const admin = getSupabaseAdmin();
    const tradingName = 'Detailor Demo';
    const { data: tenant } = await admin.from('tenants').select('id').eq('trading_name', tradingName).single();
    if (!tenant) throw new Error('Demo tenant missing');

    // rotate a random booking status for demo tenant
    const { data: list } = await admin
      .from('bookings')
      .select('id, status')
      .eq('tenant_id', tenant.id)
      .limit(5);
    if (list && list.length) {
      for (const b of list) {
        const next = b.status === 'pending' ? 'confirmed' : b.status === 'confirmed' ? 'completed' : 'pending';
        await admin.from('bookings').update({ status: next }).eq('id', b.id).eq('tenant_id', tenant.id);
      }
    }
    return createSuccessResponse({});
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/demo/tick' }, 400);
  }
}


