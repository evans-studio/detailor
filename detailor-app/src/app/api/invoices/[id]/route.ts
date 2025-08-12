import { NextResponse } from 'next/server';
import React from 'react';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    // Staff/Admin by tenant
    if (['staff','admin'].includes(profile.role)) {
      const { data, error } = await admin.from('invoices').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
      if (error) throw error;
      const url = new URL(req.url);
      const format = url.searchParams.get('format');
      if (format === 'pdf') {
        const html = renderInvoiceHtml(data as Record<string, unknown>);
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      return NextResponse.json({ ok: true, invoice: data });
    }
    // Customer self scope via booking join
    const { data: selfCust } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();
    if (!selfCust) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { data, error } = await admin
      .from('invoices')
      .select('*, bookings!inner(customer_id)')
      .eq('id', id)
      .eq('bookings.customer_id', selfCust.id)
      .single();
    if (error) throw error;
    // Strip join
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bookings, ...rest } = data as unknown as { bookings?: unknown } & Record<string, unknown>;
    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    if (format === 'pdf') {
      const html = renderInvoiceHtml(rest as Record<string, unknown>);
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return NextResponse.json({ ok: true, invoice: rest });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

function renderInvoiceHtml(inv: Record<string, unknown>) {
  const num = inv['number'] as string;
  const created = inv['created_at'] as string;
  const total = Number(inv['total'] ?? 0).toFixed(2);
  const paid = Number(inv['paid_amount'] ?? 0).toFixed(2);
  const balance = Number((inv as { balance?: number }).balance ?? Math.max(0, Number(inv['total'] || 0) - Number(inv['paid_amount'] || 0))).toFixed(2);
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice ${num}</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px;color:#111}
    .card{border:1px solid #e5e7eb;border-radius:12px;padding:16px}
    .muted{color:#6b7280}
    .row{display:flex;justify-content:space-between;margin:6px 0}
    h1{font-size:20px;margin:0 0 8px 0}
    </style></head><body>
    <div class="card">
      <h1>Invoice ${num}</h1>
      <div class="muted">Created ${new Date(created).toLocaleString()}</div>
      <div class="row"><div>Total</div><div>£${total}</div></div>
      <div class="row"><div>Paid</div><div>£${paid}</div></div>
      <div class="row"><div>Balance</div><div>£${balance}</div></div>
    </div>
  </body></html>`;
}


