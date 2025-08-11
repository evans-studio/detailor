"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/ui/table';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/ui/button';
import Link from 'next/link';
import { EntityCustomerDrawer } from '@/components/EntityCustomerDrawer';

type Customer = { id: string; name: string; email?: string; phone?: string; flags?: Record<string, unknown>; last_booking_at?: string };

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'all'|'active'|'inactive'>('all');
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', { q, status }],
    queryFn: async (): Promise<Customer[]> => {
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (status !== 'all') qs.set('status', status);
      const data = await api<{ ok: boolean; customers: Customer[] }>(`/api/customers${qs.toString() ? `?${qs.toString()}` : ''}`);
      return data.customers || [];
    },
  });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={['admin','staff']}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[var(--font-size-2xl)] font-semibold">Customers</h1>
        <div className="hidden md:flex gap-2">
          <Input placeholder="Search name/email/phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 260 }} />
          <Select options={[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} value={status} onValueChange={(v) => setStatus(v as 'all'|'active'|'inactive')} />
          <Button onClick={() => setCreateOpen(true)}>New</Button>
        </div>
        <div className="md:hidden flex gap-2"><Button onClick={() => setFiltersOpen(true)}>Filters</Button><Button onClick={() => setCreateOpen(true)}>New</Button></div>
      </div>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="grid gap-3">
          <div className="text-[var(--font-size-lg)] font-semibold">Filters</div>
          <Input placeholder="Search name/email/phone" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select options={[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} value={status} onValueChange={(v) => setStatus(v as 'all'|'active'|'inactive')} />
          <div className="flex justify-end"><Button onClick={() => setFiltersOpen(false)}>Apply</Button></div>
        </div>
      </Sheet>
      <Table>
        <THead>
          <TR><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>Last booking</TH><TH>Status</TH><TH></TH></TR>
        </THead>
        <TBody>
          {customers.map((c) => (
            <TR key={c.id}>
              <TD>{c.name}</TD>
              <TD>{c.email || '—'}</TD>
              <TD>{c.phone || '—'}</TD>
              <TD>{c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString() : '—'}</TD>
              <TD>{(c.flags && typeof c.flags === 'object' && (c.flags as Record<string, unknown>)['inactive']) ? 'Inactive' : 'Active'}</TD>
              <TD><Link href={`/admin/customers/${c.id}`}>View</Link></TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <EntityCustomerDrawer open={createOpen} onOpenChange={setCreateOpen} onCreated={async () => {
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
      }} />
      </RoleGuard>
    </DashboardShell>
  );
}


