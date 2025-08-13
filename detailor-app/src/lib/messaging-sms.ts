import { getSupabaseAdmin } from './supabaseAdmin';

type SendSMSParams = {
  tenantId: string;
  to: string; // E.164
  body: string;
  templateKey?: string;
  bookingId?: string;
  customerId?: string;
  idempotencyKey?: string;
};

export async function sendTenantSMS(params: SendSMSParams) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!accountSid || !authToken || !from) throw new Error('Missing Twilio configuration');

  const admin = getSupabaseAdmin();
  const { data: msg } = await admin
    .from('messages')
    .insert({
      tenant_id: params.tenantId,
      booking_id: params.bookingId ?? null,
      customer_id: params.customerId ?? null,
      channel: 'sms',
      direction: 'outbound',
      status: 'queued',
      template_key: params.templateKey,
      to_phone: params.to,
      body: params.body,
      idempotency_key: params.idempotencyKey,
    })
    .select('*')
    .single();

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set('To', params.to);
  form.set('From', from);
  form.set('Body', params.body);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      await admin.from('messages').update({ status: 'failed', error_reason: json?.message || `HTTP ${resp.status}` }).eq('id', msg?.id);
      throw new Error(json?.message || 'Twilio send failed');
    }
    const providerId = json?.sid as string | undefined;
    await admin.from('messages').update({ status: 'sent', provider_id: providerId }).eq('id', msg?.id);
    return { ok: true, messageId: msg?.id, providerId } as const;
  } catch (e) {
    await admin.from('messages').update({ status: 'failed', error_reason: (e as Error).message }).eq('id', msg?.id);
    throw e;
  }
}


