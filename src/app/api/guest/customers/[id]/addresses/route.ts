export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  address_line1: z.string().min(1),
  address_line2: z.string().optional(),
  city: z.string().min(1),
  postcode: z.string().min(1),
  label: z.string().optional(),
});

// Guest address creation endpoint
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const params = await context.params;
    const customerId = params.id;

    // Verify the customer exists and get tenant context
    const { data: customer } = await admin
      .from('customers')
      .select('id, tenant_id')
      .eq('id', customerId)
      .single();
    
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create address for the customer
    const { data, error } = await admin
      .from('addresses')
      .insert({
        tenant_id: customer.tenant_id,
        customer_id: customerId,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        postcode: payload.postcode,
        label: payload.label,
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return NextResponse.json({ ok: true, address: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}