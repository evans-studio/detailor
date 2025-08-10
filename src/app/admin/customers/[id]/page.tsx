"use client";
import * as React from 'react';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
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
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [vehOpen, setVehOpen] = React.useState(false);
  const [addrOpen, setAddrOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const list = await api<{ ok: boolean; customers: Customer[] }>(`/api/customers`);
      setCustomer(list.customers.find((c) => c.id === id) || null);
      const vs = await api<{ ok: boolean; vehicles: Vehicle[] }>(`/api/customers/${id}/vehicles`);
      setVehicles(vs.vehicles || []);
      const as = await api<{ ok: boolean; addresses: Address[] }>(`/api/customers/${id}/addresses`);
      setAddresses(as.addresses || []);
      const bs = await api<{ ok: boolean; bookings: (Booking & { customer_id?: string })[] }>(`/api/bookings`);
      setBookings((bs.bookings || []).filter((b) => b.customer_id === id).slice(0, 10));
    })();
  }, [id]);

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
              <div>Email: {customer.email || '—'}</div>
              <div>Phone: {customer.phone || '—'}</div>
              <div>Status: {(customer.flags && typeof customer.flags === 'object' && (customer.flags as Record<string, unknown>)['inactive']) ? 'Inactive' : 'Active'}</div>
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
            const vs = await api<{ ok: boolean; vehicles: Vehicle[] }>(`/api/customers/${id}/vehicles`);
            setVehicles(vs.vehicles || []);
          }} />
          <EntityAddressDrawer open={addrOpen} onOpenChange={setAddrOpen} customerId={id} onCreated={async () => {
            const as = await api<{ ok: boolean; addresses: Address[] }>(`/api/customers/${id}/addresses`);
            setAddresses(as.addresses || []);
          }} />
        </div>
      )}
      </RoleGuard>
    </DashboardShell>
  );
}


