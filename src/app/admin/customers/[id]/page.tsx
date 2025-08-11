"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoleGuard } from '@/components/RoleGuard';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import { Button } from '@/ui/button';
import { EntityVehicleDrawer } from '@/components/EntityVehicleDrawer';
import { EntityAddressDrawer } from '@/components/EntityAddressDrawer';

type Customer = { id: string; name: string; email?: string; phone?: string; flags?: Record<string, unknown> };
type Vehicle = { id: string; make: string; model: string; size_tier?: string };
type Address = { id: string; label?: string; address_line1: string; postcode?: string };
type Booking = { id: string; start_at: string; status: string; price_breakdown?: { total?: number } };

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async (): Promise<Customer | null> => {
      const res = await fetch(`/api/customers/${id}`);
      const json = await res.json();
      return json.customer || null;
    },
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ['customer-vehicles', id],
    queryFn: async (): Promise<Vehicle[]> => (await api<{ ok: boolean; vehicles: Vehicle[] }>(`/api/customers/${id}/vehicles`)).vehicles || [],
  });
  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses', id],
    queryFn: async (): Promise<Address[]> => (await api<{ ok: boolean; addresses: Address[] }>(`/api/customers/${id}/addresses`)).addresses || [],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['customer-bookings-preview', id],
    queryFn: async (): Promise<Booking[]> => {
      const bs = await api<{ ok: boolean; bookings: (Booking & { customer_id?: string })[] }>(`/api/bookings`);
      return (bs.bookings || []).filter((b) => (b as unknown as { customer_id?: string }).customer_id === id).slice(0, 10);
    },
  });
  const [vehOpen, setVehOpen] = React.useState(false);
  const [addrOpen, setAddrOpen] = React.useState(false);

  const updateProfile = useMutation({
    mutationFn: async (payload: Partial<Customer>) => {
      await fetch(`/api/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', id] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={['admin','staff']}>
      {!customer ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-4">
          <h1 className="text-[var(--font-size-2xl)] font-semibold">{customer.name}</h1>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Profile</div>
              <div className="grid gap-2">
                <div>Email: {customer.email || '—'}</div>
                <div>Phone: {customer.phone || '—'}</div>
                <div>Status: {(customer.flags && typeof customer.flags === 'object' && (customer.flags as Record<string, unknown>)['inactive']) ? 'Inactive' : 'Active'}</div>
                <div className="flex gap-2">
                  <button className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1" onClick={() => updateProfile.mutate({ flags: { ...(customer.flags||{}), inactive: !Boolean((customer.flags||{} as Record<string, unknown>)['inactive']) } as unknown as Record<string, unknown> })}>
                    {((customer.flags||{} as Record<string, unknown>)['inactive']) ? 'Mark Active' : 'Mark Inactive'}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="font-medium mb-2">Bookings (last 10)</div>
              {bookings.length === 0 ? (
                <div className="text-[var(--color-text-muted)]">No bookings</div>
              ) : (
                <Table>
                  <THead><TR><TH>When</TH><TH>Status</TH><TH>Total</TH></TR></THead>
                  <TBody>
                    {bookings.map((b) => (
                      <TR key={b.id}><TD>{new Date(b.start_at).toLocaleString()}</TD><TD>{b.status}</TD><TD>£{b.price_breakdown?.total ?? 0}</TD></TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Vehicles</div>
              <div className="mb-2"><Button onClick={() => setVehOpen(true)}>Add Vehicle</Button></div>
            {vehicles.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">None</div>
            ) : (
              <Table>
                <THead><TR><TH>Make</TH><TH>Model</TH><TH>Size</TH></TR></THead>
                <TBody>
                  {vehicles.map((v) => (<TR key={v.id}><TD>{v.make}</TD><TD>{v.model}</TD><TD>{v.size_tier || '—'}</TD></TR>))}
                </TBody>
              </Table>
            )}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="font-medium mb-2">Addresses</div>
            <div className="mb-2"><Button onClick={() => setAddrOpen(true)}>Add Address</Button></div>
            {addresses.length === 0 ? (
              <div className="text-[var(--color-text-muted)]">None</div>
            ) : (
              <Table>
                <THead><TR><TH>Label</TH><TH>Address</TH><TH>Postcode</TH></TR></THead>
                <TBody>
                  {addresses.map((a) => (<TR key={a.id}><TD>{a.label || '—'}</TD><TD>{a.address_line1}</TD><TD>{a.postcode || '—'}</TD></TR>))}
                </TBody>
              </Table>
            )}
          </div>
          <EntityVehicleDrawer open={vehOpen} onOpenChange={setVehOpen} customerId={id} onCreated={async () => {
            await queryClient.invalidateQueries({ queryKey: ['customer-vehicles', id] });
          }} />
          <EntityAddressDrawer open={addrOpen} onOpenChange={setAddrOpen} customerId={id} onCreated={async () => {
            await queryClient.invalidateQueries({ queryKey: ['customer-addresses', id] });
          }} />
        </div>
      )}
      </RoleGuard>
    </DashboardShell>
  );
}


