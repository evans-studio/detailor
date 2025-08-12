import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function resolveTenantAndAuthorize(jobId: string, userId: string) {
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', userId).single();
  if (!profile) throw new Error('No profile');
  const { data: job } = await admin.from('jobs').select('tenant_id, staff_profile_id').eq('id', jobId).single();
  if (!job || job.tenant_id !== profile.tenant_id) throw new Error('Forbidden');
  if (profile.role === 'staff' && job.staff_profile_id !== profile.id) throw new Error('Forbidden');
  return { admin, tenantId: profile.tenant_id, isAdmin: profile.role === 'admin' };
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const { pathname } = new URL(req.url);
    const jobId = pathname.split('/').slice(-2)[0];
    const { admin, tenantId } = await resolveTenantAndAuthorize(jobId, user.id);
    // List evidence files
    await admin.storage.createBucket('evidence', { public: false }).catch(() => {});
    const list = await admin.storage.from('evidence').list(`${tenantId}/${jobId}`, { limit: 100 });
    const files = (list.data || []);
    const items: Array<{ name: string; url: string }> = [];
    for (const f of files) {
      const signed = await admin.storage.from('evidence').createSignedUrl(`${tenantId}/${jobId}/${f.name}`, 60 * 10);
      if (signed.data?.signedUrl) items.push({ name: f.name, url: signed.data.signedUrl });
    }
    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const { pathname } = new URL(req.url);
    const jobId = pathname.split('/').slice(-2)[0];
    const { admin, tenantId } = await resolveTenantAndAuthorize(jobId, user.id);
    const { data: tenant } = await admin.from('tenants').select('is_demo, feature_flags').eq('id', tenantId).single();
    if (tenant?.is_demo) return NextResponse.json({ ok: false, error: 'Uploads disabled in demo.' }, { status: 400 });

    const form = await req.formData();
    const files = form.getAll('files');
    await admin.storage.createBucket('evidence', { public: false }).catch(() => {});
    const uploaded: string[] = [];

    const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
    const storageGb = Number(ff.storage_gb ?? 1);
    const maxBytes = storageGb * 1024 * 1024 * 1024;
    const singleFileMax = 10 * 1024 * 1024; // 10MB per file limit

    for (const file of files) {
      if (!(file instanceof Blob)) continue;
      const size = (file as File).size || 0;
      if (size > singleFileMax) {
        return NextResponse.json({ ok: false, error: 'Each file must be ≤ 10MB. Please compress and retry.' }, { status: 400 });
      }
      const arr = await file.arrayBuffer();
      let buffer = Buffer.from(arr);
      // Attempt simple recompression if available (dynamic import to satisfy linter)
      if (buffer.length > 512 * 1024) {
        try {
          const sharpMod = await import('sharp');
          const sharp = sharpMod.default || (sharpMod as unknown as (input: Buffer) => any);
          if (sharp) {
            buffer = await (sharp as any)(buffer).rotate().jpeg({ quality: 80 }).toBuffer();
          }
        } catch {
          // no-op if sharp not installed
        }
      }
      if (buffer.length > maxBytes) {
        return NextResponse.json({ ok: false, error: 'Storage limit exceeded. Please upgrade your plan.' }, { status: 400 });
      }
      const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const path = `${tenantId}/${jobId}/${name}`;
      const contentType = (file as unknown as { type?: string }).type || 'image/jpeg';
      const res = await admin.storage.from('evidence').upload(path, buffer, { contentType, upsert: false });
      if (res.error) throw res.error;
      uploaded.push(name);
    }
    return NextResponse.json({ ok: true, uploaded });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


