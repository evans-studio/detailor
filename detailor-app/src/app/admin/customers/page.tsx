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
import { EnterpriseCustomerGrid, type CustomerData } from '@/components/customers/EnterpriseCustomerGrid';
import { CustomerProfilePanel } from '@/components/customers/CustomerProfilePanel';

// Using CustomerData type from EnterpriseCustomerGrid
type Customer = CustomerData;

export default function AdminCustomersPage() {
  const queryClient = useQueryClient();
  
  // System Bible Pattern: Real-time admin updates (tenant-aware)
  const [tenantId, setTenantId] = React.useState<string>('');
  React.useEffect(() => {
    try {
      const cookie = document.cookie.split('; ').find(c => c.startsWith('df-tenant='));
      if (cookie) setTenantId(decodeURIComponent(cookie.split('=')[1]));
    } catch {}
  }, []);
  useRealtimeAdminUpdates(tenantId || '', true);
  const [activeTab, setActiveTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'all'|'active'|'inactive'>('all');
  const [segment, setSegment] = React.useState<'all'|'new'|'regular'|'vip'>('all');
  
  const { data: customers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', { q, status, segment }],
    queryFn: async (): Promise<Customer[]> => {
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (status !== 'all') qs.set('status', status);
      if (segment !== 'all') qs.set('segment', segment);
      const res = await fetch(`/api/customers${qs.toString() ? `?${qs.toString()}` : ''}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message || 'Failed to load customers');
      return json.data?.customers || json.customers || json.data || [];
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
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [profilePanelOpen, setProfilePanelOpen] = React.useState(false);
  
  const getCustomerStatus = (customer: Customer) => {
    if (customer.flags?.inactive) return { label: 'Inactive', intent: 'default' as const };
    if ((customer.total_spent || 0) >= 1000) return { label: 'VIP', intent: 'success' as const };
    if ((customer.total_bookings || 0) <= 1) return { label: 'New', intent: 'info' as const };
    return { label: 'Active', intent: 'success' as const };
  };

  // Enhanced customer handlers
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setProfilePanelOpen(true);
  };

  const handleCustomerEdit = (customer: Customer) => {
    // In a real app, this would open an edit modal/drawer
    console.log('Edit customer:', customer);
  };

  const handleBookService = (customer: Customer) => {
    // Navigate to booking page with customer pre-selected
    window.location.href = `/book/new?customer_id=${customer.id}`;
  };

  const handleExportCustomers = () => {
    // In a real app, this would trigger a CSV/Excel export
    console.log('Exporting customers...');
  };
  
  const CustomerCard = ({ customer }: { customer: Customer }) => {
    const status = getCustomerStatus(customer);
    return (
      <Card className="transition-colors hover:border-[var(--color-primary)]/30" data-testid={`customer-card-${customer.id}`}>
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="font-semibold text-[var(--color-text)] mb-1" data-testid="customer-name">{customer.name}</div>
              <div className="text-[var(--color-text-muted)] text-[var(--font-size-sm)] space-y-1">
                {customer.email && <div data-testid="customer-email">{customer.email}</div>}
                {customer.phone && <div data-testid="customer-phone">{customer.phone}</div>}
              </div>
            </div>
            <Badge intent={status.intent}>{status.label}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3 text-[var(--font-size-sm)]">
            <div>
              <div className="text-[var(--color-text-muted)]">Bookings</div>
              <div className="font-medium text-[var(--color-text)]" data-testid="customer-total-bookings">{customer.total_bookings || 0}</div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)]">Total Spent</div>
              <div className="font-medium text-[var(--color-text)]" data-testid="customer-total-spent">£{customer.total_spent || 0}</div>
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
    <DashboardShell role="admin" tenantName="Detailor">
      <RoleGuard allowed={['admin','staff']}>
        <div className="space-y-8">
          {/* Enterprise Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[var(--font-size-4xl)] font-[var(--font-weight-bold)] text-[var(--color-text)] tracking-[var(--letter-spacing-tight)]">
                Customer CRM
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-2">
                Enterprise-grade customer relationship management with advanced analytics
              </p>
            </div>
            <div className="flex gap-3">
              <Button intent="secondary" onClick={handleExportCustomers}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
              </Button>
              <Button intent="primary" onClick={() => setCreateOpen(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Customer
              </Button>
            </div>
          </div>

          {/* Loading / Error States */}
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-[var(--color-text-muted)]">Loading customers…</CardContent>
            </Card>
          )}
          {isError && (
            <Card>
              <CardContent className="p-6 text-[var(--color-danger)]">
                {(error as Error)?.message || 'Failed to load customers'}
                <div className="mt-3">
                  <Button size="sm" intent="ghost" onClick={() => refetch()}>Retry</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enterprise Customer Grid */}
          <EnterpriseCustomerGrid
            customers={customers}
            loading={isLoading}
            onCustomerClick={handleCustomerClick}
            onCustomerEdit={handleCustomerEdit}
            onBookService={handleBookService}
            onExport={handleExportCustomers}
            className=""
          />
          
          {/* Customer Profile Panel */}
          <CustomerProfilePanel
            customer={selectedCustomer}
            open={profilePanelOpen}
            onClose={() => {
              setProfilePanelOpen(false);
              setSelectedCustomer(null);
            }}
            onEdit={handleCustomerEdit}
            onBookService={handleBookService}
          />

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


