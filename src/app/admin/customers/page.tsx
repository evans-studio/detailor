"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeAdminUpdates } from '@/lib/realtime';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Badge } from '@/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/ui/button';
import Link from 'next/link';
import { EntityCustomerDrawer } from '@/components/EntityCustomerDrawer';

type Customer = { 
  id: string; 
  name: string; 
  email?: string; 
  phone?: string; 
  flags?: Record<string, unknown>; 
  last_booking_at?: string;
  total_bookings?: number;
  total_spent?: number;
  preferred_services?: string[];
  vehicles?: Array<{ id: string; name: string; }>;
  addresses?: Array<{ id: string; address: string; }>;
};

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  
  // System Bible Pattern: Real-time admin updates
  useRealtimeAdminUpdates('detail-flow', true);
  const [activeTab, setActiveTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'all'|'active'|'inactive'>('all');
  const [segment, setSegment] = React.useState<'all'|'new'|'regular'|'vip'>('all');
  
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', { q, status, segment }],
    queryFn: async (): Promise<Customer[]> => {
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (status !== 'all') qs.set('status', status);
      if (segment !== 'all') qs.set('segment', segment);
      const data = await api<{ ok: boolean; customers: Customer[] }>(`/api/customers${qs.toString() ? `?${qs.toString()}` : ''}`);
      return data.customers || [];
    },
    refetchInterval: 60000, // Real-time updates
  });
  
  // System Bible Compliant: Customer segmentation
  const customerSegments = React.useMemo(() => {
    const active = customers.filter(c => !(c.flags?.inactive));
    const inactive = customers.filter(c => c.flags?.inactive);
    const newCustomers = customers.filter(c => (c.total_bookings || 0) <= 1);
    const regularCustomers = customers.filter(c => (c.total_bookings || 0) > 1 && (c.total_spent || 0) < 1000);
    const vipCustomers = customers.filter(c => (c.total_spent || 0) >= 1000);
    
    return {
      all: customers,
      active,
      inactive,
      new: newCustomers,
      regular: regularCustomers,
      vip: vipCustomers,
    };
  }, [customers]);
  
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  
  const getCustomerStatus = (customer: Customer) => {
    if (customer.flags?.inactive) return { label: 'Inactive', intent: 'default' as const };
    if ((customer.total_spent || 0) >= 1000) return { label: 'VIP', intent: 'success' as const };
    if ((customer.total_bookings || 0) <= 1) return { label: 'New', intent: 'info' as const };
    return { label: 'Active', intent: 'success' as const };
  };
  
  const CustomerCard = ({ customer }: { customer: Customer }) => {
    const status = getCustomerStatus(customer);
    return (
      <Card className="transition-colors hover:border-[var(--color-primary)]/30">
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-text)] mb-1">
                {customer.name}
              </div>
              <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] space-y-1">
                {customer.email && <div>{customer.email}</div>}
                {customer.phone && <div>{customer.phone}</div>}
              </div>
            </div>
            <Badge intent={status.intent}>{status.label}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3 text-[var(--font-size-sm)]">
            <div>
              <div className="text-[var(--color-text-muted)]">Bookings</div>
              <div className="font-medium text-[var(--color-text)]">{customer.total_bookings || 0}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)]">Total Spent</div>
              <div className="font-medium text-[var(--color-text)]">£{customer.total_spent || 0}</div>
            </div>
          </div>
          
          {customer.last_booking_at && (
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-3">
              Last booking: {new Date(customer.last_booking_at).toLocaleDateString()}
            </div>
          )}
          
          <div className="flex gap-2">
            <Link href={`/admin/customers/${customer.id}`}>
              <Button intent="ghost" size="sm">View Profile</Button>
            </Link>
            <Link href={`/book/new?customer_id=${customer.id}`}>
              <Button intent="primary" size="sm">Book Service</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };
  return (
    <DashboardShell role="admin" tenantName="DetailFlow">
      <RoleGuard allowed={['admin','staff']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[var(--font-size-2xl)] font-semibold text-[var(--color-text)] mb-2">Customer CRM</h1>
              <div className="text-[var(--color-text-muted)]">System Bible compliant customer relationship management</div>
            </div>
            <Button intent="primary" onClick={() => setCreateOpen(true)}>New Customer</Button>
          </div>

          {/* CRM Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)]">
                  {customerSegments.all.length}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">Total Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-success)]">
                  {customerSegments.active.length}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">Active Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-info)]">
                  {customerSegments.new.length}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">New Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-[var(--font-size-2xl)] font-bold text-[var(--color-primary)]">
                  {customerSegments.vip.length}
                </div>
                <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)]">VIP Customers</div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[var(--font-size-lg)]">Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  placeholder="Search name, email, phone..." 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                />
                <Select 
                  options={[
                    { label: 'All Status', value: 'all' }, 
                    { label: 'Active', value: 'active' }, 
                    { label: 'Inactive', value: 'inactive' }
                  ]} 
                  value={status} 
                  onValueChange={(v) => setStatus(v as typeof status)} 
                />
                <Select 
                  options={[
                    { label: 'All Segments', value: 'all' },
                    { label: 'New Customers', value: 'new' },
                    { label: 'Regular', value: 'regular' },
                    { label: 'VIP', value: 'vip' }
                  ]} 
                  value={segment} 
                  onValueChange={(v) => setSegment(v as typeof segment)} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Segments Tabs */}
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">
                All ({customerSegments.all.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({customerSegments.active.length})
              </TabsTrigger>
              <TabsTrigger value="new">
                New ({customerSegments.new.length})
              </TabsTrigger>
              <TabsTrigger value="regular">
                Regular ({customerSegments.regular.length})
              </TabsTrigger>
              <TabsTrigger value="vip">
                VIP ({customerSegments.vip.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerSegments.all.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-[var(--color-text-muted)]">
                    No customers found
                  </div>
                ) : (
                  customerSegments.all.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerSegments.active.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerSegments.new.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-[var(--color-text-muted)]">
                    No new customers
                  </div>
                ) : (
                  customerSegments.new.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="regular">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerSegments.regular.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="vip">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerSegments.vip.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-[var(--color-text-muted)]">
                    No VIP customers yet
                  </div>
                ) : (
                  customerSegments.vip.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Mobile Filters Sheet */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <div className="grid gap-3">
              <div className="text-[var(--font-size-lg)] font-semibold">Filters</div>
              <Input placeholder="Search name/email/phone" value={q} onChange={(e) => setQ(e.target.value)} />
              <Select options={[{ label: 'All', value: 'all' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} value={status} onValueChange={(v) => setStatus(v as 'all'|'active'|'inactive')} />
              <div className="flex justify-end"><Button onClick={() => setFiltersOpen(false)}>Apply</Button></div>
            </div>
          </Sheet>
          
          <EntityCustomerDrawer open={createOpen} onOpenChange={setCreateOpen} onCreated={async () => {
            await queryClient.invalidateQueries({ queryKey: ['customers'] });
          }} />
        </div>
      </RoleGuard>
    </DashboardShell>
  );
}


