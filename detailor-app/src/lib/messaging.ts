import { Resend } from 'resend';
import { getSupabaseAdmin } from './supabaseAdmin';

export type SendEmailParams = {
  tenantId: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateKey?: string;
  bookingId?: string;
  customerId?: string;
  idempotencyKey?: string;
};

export async function sendTenantEmail(params: SendEmailParams) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error('Missing RESEND_API_KEY');
  const resend = new Resend(resendKey);

  const from = process.env.RESEND_FROM || 'Detailor <no-reply@detailor.demo>';

  // Insert message ledger row (queued)
  const admin = getSupabaseAdmin();
  const { data: msg } = await admin
    .from('messages')
    .insert({
      tenant_id: params.tenantId,
      booking_id: params.bookingId,
      customer_id: params.customerId,
      channel: 'email',
      direction: 'outbound',
      status: 'queued',
      template_key: params.templateKey,
      to_email: params.to,
      subject: params.subject,
      body: params.html || params.text || '',
      idempotency_key: params.idempotencyKey,
    })
    .select('*')
    .single();

  // Send via Resend
  let providerId: string | undefined;
  try {
    const payload: {
      from: string;
      to: string;
      subject: string;
      html?: string;
      text?: string;
    } = { from, to: params.to, subject: params.subject };
    if (params.html) payload.html = params.html;
    if (!params.html && params.text) payload.text = params.text;

    const resp = (await resend.emails.send(payload as unknown as never)) as unknown as {
      id?: string;
      data?: { id?: string };
    };
    const respAny = resp;
    providerId = respAny?.data?.id || respAny?.id;
    await admin.from('messages').update({ status: 'sent', provider_id: providerId }).eq('id', msg?.id);
  } catch (e) {
    await admin.from('messages').update({ status: 'failed', error_reason: (e as Error).message }).eq('id', msg?.id);
    throw e;
  }
  return { ok: true, messageId: msg?.id, providerId } as const;
}


