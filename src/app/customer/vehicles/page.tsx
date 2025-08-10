"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { api } from '@/lib/api';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';

type Vehicle = { id: string; make: string; model: string; year?: number; colour?: string; size_tier?: string };

export default function MyVehiclesPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [form, setForm] = React.useState({ make: '', model: '', year: '', colour: '', size_tier: 'M' });
  const [customerId, setCustomerId] = React.useState<string>('');
  React.useEffect(() => {
    (async () => {
      const list = await api<{ ok: boolean; customers: Array<{ id: string }> }>(`/api/customers`);
      const me = list.customers?.[0];
      if (!me) return;
      setCustomerId(me.id);
      const vs = await api<{ ok: boolean; vehicles: Vehicle[] }>(`/api/customers/${me.id}/vehicles`);
      setVehicles(vs.vehicles || []);
    })();
  }, []);
  async function create() {
    if (!customerId) return;
    await fetch(`/api/customers/${customerId}/vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const vs = await api<{ ok: boolean; vehicles: Vehicle[] }>(`/api/customers/${customerId}/vehicles`);
    setVehicles(vs.vehicles || []);
    setForm({ make: '', model: '', year: '', colour: '', size_tier: 'M' });
  }
  return (
    <DashboardShell role="customer" tenantName="DetailFlow">
      <div className="grid gap-4">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">My Vehicles</h1>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 grid gap-2 max-w-xl">
          <div className="font-medium">Add Vehicle</div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            <Input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <Input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <Input placeholder="Colour" value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
          </div>
          <div className="flex justify-end"><Button onClick={create}>Save</Button></div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          {vehicles.length === 0 ? (
            <div className="text-[var(--color-text-muted)]">No vehicles yet.</div>
          ) : (
            <Table>
              <THead>
                <TR><TH>Make</TH><TH>Model</TH><TH>Year</TH><TH>Colour</TH><TH>Size</TH></TR>
              </THead>
              <TBody>
                {vehicles.map((v) => (
                  <TR key={v.id}><TD>{v.make}</TD><TD>{v.model}</TD><TD>{v.year ?? '—'}</TD><TD>{v.colour ?? '—'}</TD><TD>{v.size_tier ?? '—'}</TD></TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}


