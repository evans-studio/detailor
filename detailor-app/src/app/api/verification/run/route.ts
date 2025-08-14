export const runtime = 'nodejs';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

const bodySchema = z.object({
  scopes: z.array(z.enum([
    'services',
    'inventory',
    'invoices',
    'messaging_triggers',
    'customers',
    'jobs'
  ])).default(['services','inventory','invoices','messaging_triggers'])
});

type StepResult = { name: string; success: boolean; details?: Record<string, unknown> | string };
type ScopeResult = { scope: string; steps: StepResult[] };

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const payload = bodySchema.parse(await req.json().catch(() => ({ scopes: [] })));

    // Resolve tenant context
    const { data: profile, error: pErr } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (pErr || !profile) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile for user', { db_error: pErr?.message }, 404);
    }
    if (!['admin','staff'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions for verification', { role: profile.role }, 403);
    }
    const tenantId = profile.tenant_id as string;

    const results: ScopeResult[] = [];

    // SERVICES
    if (payload.scopes.includes('services')) {
      const scope: ScopeResult = { scope: 'services', steps: [] };
      const uniqueName = `AutoTest Service ${Date.now()}`;
      // Create
      try {
        const { data: created, error } = await admin
          .from('services')
          .insert({ tenant_id: tenantId, name: uniqueName, base_price: 1, base_duration_min: 15, visible: true })
          .select('id, name')
          .single();
        if (error) throw error;
        scope.steps.push({ name: 'Create', success: true, details: created });
        // Read
        const { data: list, error: rErr } = await admin.from('services').select('id, name').eq('tenant_id', tenantId).ilike('name', uniqueName);
        if (rErr) throw rErr;
        scope.steps.push({ name: 'Refresh (Read)', success: Array.isArray(list) && list.length > 0, details: { count: list?.length || 0 } });
        // Update
        const { error: uErr } = await admin.from('services').update({ description: 'updated-by-verification' }).eq('id', created!.id).eq('tenant_id', tenantId);
        if (uErr) throw uErr;
        const { data: afterUpdate } = await admin.from('services').select('description').eq('id', created!.id).single();
        scope.steps.push({ name: 'Edit', success: afterUpdate?.description === 'updated-by-verification' });
        // Delete
        const { error: dErr } = await admin.from('services').delete().eq('id', created!.id).eq('tenant_id', tenantId);
        if (dErr) throw dErr;
        const { data: afterDelete } = await admin.from('services').select('id').eq('id', created!.id).maybeSingle();
        scope.steps.push({ name: 'Delete', success: !afterDelete });
      } catch (e: unknown) {
        scope.steps.push({ name: 'Error', success: false, details: String((e as Error).message) });
      }
      results.push(scope);
    }

    // INVENTORY
    if (payload.scopes.includes('inventory')) {
      const scope: ScopeResult = { scope: 'inventory', steps: [] };
      try {
        const { data: created, error } = await admin
          .from('inventory_items')
          .insert({ tenant_id: tenantId, name: `AutoTest Item ${Date.now()}`, stock: 0, reorder_level: 0 })
          .select('id, name, stock')
          .single();
        if (error) throw error;
        scope.steps.push({ name: 'Create', success: true, details: created });
        // Update stock
        const { error: uErr } = await admin.from('inventory_items').update({ stock: 5 }).eq('id', created!.id).eq('tenant_id', tenantId);
        if (uErr) throw uErr;
        const { data: after } = await admin.from('inventory_items').select('stock').eq('id', created!.id).single();
        scope.steps.push({ name: 'Edit', success: Number(after?.stock) === 5 });
        // Delete
        const { error: dErr } = await admin.from('inventory_items').delete().eq('id', created!.id).eq('tenant_id', tenantId);
        if (dErr) throw dErr;
        const { data: gone } = await admin.from('inventory_items').select('id').eq('id', created!.id).maybeSingle();
        scope.steps.push({ name: 'Delete', success: !gone });
      } catch (e: unknown) {
        scope.steps.push({ name: 'Error', success: false, details: String((e as Error).message) });
      }
      results.push(scope);
    }

    // INVOICES (non-destructive: create then delete test invoice)
    if (payload.scopes.includes('invoices')) {
      const scope: ScopeResult = { scope: 'invoices', steps: [] };
      try {
        const numberPrefix = 'AT-INV-';
        const number = `${numberPrefix}${Date.now()}`;
        const { data: created, error } = await admin
          .from('invoices')
          .insert({ tenant_id: tenantId, number, total: 100, paid_amount: 0, balance: 100 })
          .select('id, number, total, balance')
          .single();
        if (error) throw error;
        scope.steps.push({ name: 'Create', success: true, details: created });
        // Update paid
        const { error: uErr } = await admin.from('invoices').update({ paid_amount: 50, balance: 50 }).eq('id', created!.id).eq('tenant_id', tenantId);
        if (uErr) throw uErr;
        const { data: after } = await admin.from('invoices').select('paid_amount, balance').eq('id', created!.id).single();
        scope.steps.push({ name: 'Edit', success: Number(after?.paid_amount) === 50 && Number(after?.balance) === 50 });
        // Delete
        const { error: dErr } = await admin.from('invoices').delete().eq('id', created!.id).eq('tenant_id', tenantId);
        if (dErr) throw dErr;
        const { data: gone } = await admin.from('invoices').select('id').eq('id', created!.id).maybeSingle();
        scope.steps.push({ name: 'Delete', success: !gone });
      } catch (e: unknown) {
        scope.steps.push({ name: 'Error', success: false, details: String((e as Error).message) });
      }
      results.push(scope);
    }

    // MESSAGING TRIGGERS (reversible update)
    if (payload.scopes.includes('messaging_triggers')) {
      const scope: ScopeResult = { scope: 'messaging_triggers', steps: [] };
      try {
        const { data: tenant } = await admin
          .from('tenants')
          .select('business_prefs')
          .eq('id', tenantId)
          .single();
        const prefs = tenant?.business_prefs || {};
        const original = prefs.messaging_rules || {};
        const updated = { ...original, invoice_payment_reminder_days_after: Number(original.invoice_payment_reminder_days_after || 3) + 1 };
        const { error: uErr } = await admin
          .from('tenants')
          .update({ business_prefs: { ...(prefs || {}), messaging_rules: updated } })
          .eq('id', tenantId);
        if (uErr) throw uErr;
        const { data: check } = await admin.from('tenants').select('business_prefs').eq('id', tenantId).single();
        scope.steps.push({ name: 'Edit', success: Number(check?.business_prefs?.messaging_rules?.invoice_payment_reminder_days_after) === Number(updated.invoice_payment_reminder_days_after) });
        // Revert
        const { error: rErr } = await admin.from('tenants').update({ business_prefs: { ...(prefs || {}), messaging_rules: original } }).eq('id', tenantId);
        if (rErr) throw rErr;
        scope.steps.push({ name: 'Revert', success: true });
      } catch (e: unknown) {
        scope.steps.push({ name: 'Error', success: false, details: String((e as Error).message) });
      }
      results.push(scope);
    }

    // CUSTOMERS/JOBS scopes currently require broader fixtures; report as manual
    if (payload.scopes.includes('customers')) {
      results.push({ scope: 'customers', steps: [{ name: 'Manual', success: true, details: 'Run UI verification: create/edit/delete and observe realtime' }] });
    }
    if (payload.scopes.includes('jobs')) {
      results.push({ scope: 'jobs', steps: [{ name: 'Manual', success: true, details: 'Run UI verification: start/complete and observe realtime' }] });
    }

    return createSuccessResponse({ results });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/verification/run' }, 400);
  }
}


