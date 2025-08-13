import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can upload logo', undefined, 403);
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'No file', { field: 'file' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);
    const path = `logos/${profile.tenant_id}.png`;
    const { error: upErr } = await admin.storage.from('public').upload(path, bytes, { upsert: true, contentType: file.type || 'image/png' });
    if (upErr) throw upErr;
    const { data: pub } = admin.storage.from('public').getPublicUrl(path);
    // Save to brand_settings.logo_url
    await admin
      .from('tenants')
      .update({ brand_settings: { logo_url: pub.publicUrl } })
      .eq('id', profile.tenant_id);
    return createSuccessResponse({ url: pub.publicUrl });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/website/logo' }, 400);
  }
}


