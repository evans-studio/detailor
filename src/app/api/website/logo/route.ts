import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) throw new Error('No file');
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
    return NextResponse.json({ ok: true, url: pub.publicUrl });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


