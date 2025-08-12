"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';

type Address = { id: string; label?: string; address_line1: string; city?: string; postcode?: string; is_default?: boolean };

export default function MyAddressesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({ label: '', address_line1: '', city: '', postcode: '', is_default: false });
  const { data: customerId } = useQuery({
    queryKey: ['me-customer-id'],
    queryFn: async () => {
      const list = await api<{ ok: boolean; customers: Array<{ id: string }> }>(`/api/customers`);
      return list.customers?.[0]?.id as string;
    },
  });
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', customerId],
    enabled: Boolean(customerId),
    queryFn: async (): Promise<Address[]> => {
      const as = await api<{ ok: boolean; addresses: Address[] }>(`/api/customers/${customerId}/addresses`);
      return as.addresses || [];
    },
  });
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) return;
      await fetch(`/api/customers/${customerId}/addresses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    },
    onSuccess: async () => {
      setForm({ label: '', address_line1: '', city: '', postcode: '', is_default: false });
      await queryClient.invalidateQueries({ queryKey: ['addresses', customerId] });
    },
  });
  async function create() { await createMutation.mutateAsync(); }
  return (
    <DashboardShell role="customer" tenantName="Detailor">
      <div className="grid gap-4">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">My Addresses</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid gap-2 max-w-xl">
          <div className="font-medium">Add Address</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input placeholder="Address line 1" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Postcode" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
          </div>
          <div className="flex justify-end"><Button onClick={create}>Save</Button></div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {isLoading ? <div>Loading…</div> : addresses.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No addresses yet.</div>
          ) : (
            <Table>
              <THead>
                <TR><TH>Label</TH><TH>Address</TH><TH>City</TH><TH>Postcode</TH></TR>
              </THead>
              <TBody>
                {addresses.map((a) => (
                  <TR key={a.id}><TD>{a.label || '—'}</TD><TD>{a.address_line1}</TD><TD>{a.city || '—'}</TD><TD>{a.postcode || '—'}</TD></TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}


