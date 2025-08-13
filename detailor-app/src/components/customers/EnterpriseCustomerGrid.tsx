"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';
import { Avatar } from '@/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';

export interface CustomerData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  flags?: Record<string, unknown>;
  last_booking_at?: string;
  total_bookings?: number;
  total_spent?: number;
  preferred_services?: string[];
  vehicles?: Array<{ id: string; name: string; }>;
  addresses?: Array<{ id: string; address: string; }>;
  customer_since?: string;
  last_contacted?: string;
  satisfaction_rating?: number;
  tags?: string[];
  notes?: string;
  lifetime_value?: number;
  avg_booking_value?: number;
  booking_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'rarely';
  risk_level?: 'low' | 'medium' | 'high';
  communication_preference?: 'email' | 'phone' | 'sms';
}

export interface CustomerGridProps {
  customers: CustomerData[];
  loading?: boolean;
  onCustomerClick?: (customer: CustomerData) => void;
  onCustomerEdit?: (customer: CustomerData) => void;
  onCustomerDelete?: (customer: CustomerData) => void;
  onBookService?: (customer: CustomerData) => void;
  onExport?: () => void;
  className?: string;
}

type ViewMode = 'cards' | 'table' | 'compact';
type SortField = 'name' | 'total_spent' | 'total_bookings' | 'last_booking_at' | 'customer_since';
type SortOrder = 'asc' | 'desc';

// Advanced customer analytics
const calculateCustomerMetrics = (customer: CustomerData) => {
  const totalSpent = customer.total_spent || 0;
  const totalBookings = customer.total_bookings || 0;
  const avgBookingValue = totalBookings > 0 ? totalSpent / totalBookings : 0;
  
  // Customer lifetime value projection
  const monthsSinceFirst = customer.customer_since 
    ? Math.max(1, Math.floor((Date.now() - new Date(customer.customer_since).getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 1;
  const monthlyValue = totalSpent / monthsSinceFirst;
  const projectedLTV = monthlyValue * 24; // 2-year projection

  return {
    avgBookingValue,
    monthlyValue,
    projectedLTV,
    bookingFrequency: totalBookings / monthsSinceFirst,
  };
};

// Customer status and tier logic
const getCustomerTier = (customer: CustomerData) => {
  const totalSpent = customer.total_spent || 0;
  const totalBookings = customer.total_bookings || 0;
  
  if (customer.flags?.inactive) {
    return { tier: 'Inactive', color: 'default', priority: 0 };
  }
  
  if (totalSpent >= 2000 || totalBookings >= 15) {
    return { tier: 'Platinum', color: 'success', priority: 4 };
  }
  
  if (totalSpent >= 1000 || totalBookings >= 8) {
    return { tier: 'Gold', color: 'warning', priority: 3 };
  }
  
  if (totalSpent >= 500 || totalBookings >= 4) {
    return { tier: 'Silver', color: 'info', priority: 2 };
  }
  
  return { tier: 'Bronze', color: 'primary', priority: 1 };
};

// Customer risk assessment
const getCustomerRisk = (customer: CustomerData) => {
  const daysSinceLastBooking = customer.last_booking_at 
    ? Math.floor((Date.now() - new Date(customer.last_booking_at).getTime()) / (24 * 60 * 60 * 1000))
    : Infinity;
    
  if (daysSinceLastBooking > 180) return { level: 'High', color: 'error' };
  if (daysSinceLastBooking > 90) return { level: 'Medium', color: 'warning' };
  return { level: 'Low', color: 'success' };
};

// Compact customer card for grid view
function CustomerCard({ customer, onCustomerClick, onBookService, onCustomerEdit }: {
  customer: CustomerData;
  onCustomerClick?: (customer: CustomerData) => void;
  onBookService?: (customer: CustomerData) => void;
  onCustomerEdit?: (customer: CustomerData) => void;
}) {
  const tier = getCustomerTier(customer);
  const risk = getCustomerRisk(customer);
  const metrics = calculateCustomerMetrics(customer);

  return (
    <Card className="group hover:shadow-[var(--shadow-md)] transition-all duration-[var(--duration-normal)] cursor-pointer border-[var(--color-border)] hover:border-[var(--color-primary)]/30">
      <CardContent className="p-6">
        {/* Customer Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            src={customer.avatar}
            name={customer.name}
            size="lg"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-[var(--font-weight-semibold)] text-[var(--color-text)] truncate cursor-pointer hover:text-[var(--color-primary)]"
                onClick={() => onCustomerClick?.(customer)}
              >
                {customer.name}
              </h3>
              <Badge variant={tier.color as 'success' | 'warning' | 'info' | 'primary' | 'default'} size="sm">
                {tier.tier}
              </Badge>
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] space-y-1">
              {customer.email && <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="truncate">{customer.email}</span>
              </div>}
              {customer.phone && <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{customer.phone}</span>
              </div>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={risk.color as 'success' | 'warning' | 'error'} size="sm">
              {risk.level} Risk
            </Badge>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] uppercase tracking-wide font-[var(--font-weight-medium)]">
              Total Spent
            </div>
            <div className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
              £{(customer.total_spent || 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] uppercase tracking-wide font-[var(--font-weight-medium)]">
              Bookings
            </div>
            <div className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
              {customer.total_bookings || 0}
            </div>
          </div>
          <div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] uppercase tracking-wide font-[var(--font-weight-medium)]">
              Avg Value
            </div>
            <div className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
              £{Math.round(metrics.avgBookingValue)}
            </div>
          </div>
          <div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] uppercase tracking-wide font-[var(--font-weight-medium)]">
              LTV
            </div>
            <div className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
              £{Math.round(metrics.projectedLTV)}
            </div>
          </div>
        </div>

        {/* Last Activity */}
        {customer.last_booking_at && (
          <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]/30">
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] uppercase tracking-wide font-[var(--font-weight-medium)] mb-1">
              Last Booking
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text)]">
              {new Date(customer.last_booking_at).toLocaleDateString('en-GB', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {customer.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
              {customer.tags.length > 3 && (
                <Badge variant="outline" size="sm">
                  +{customer.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            intent="ghost" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onCustomerEdit?.(customer);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Button>
          <Button 
            intent="primary" 
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onBookService?.(customer);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced customer table row
function CustomerTableRow({ customer, onCustomerClick, onBookService, onCustomerEdit }: {
  customer: CustomerData;
  onCustomerClick?: (customer: CustomerData) => void;
  onBookService?: (customer: CustomerData) => void;
  onCustomerEdit?: (customer: CustomerData) => void;
}) {
  const tier = getCustomerTier(customer);
  const risk = getCustomerRisk(customer);
  const metrics = calculateCustomerMetrics(customer);

  return (
    <tr className="group hover:bg-[var(--color-hover-surface)] cursor-pointer border-b border-[var(--color-border)]">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={customer.avatar}
            name={customer.name}
            size="sm"
          />
          <div>
            <div 
              className="font-[var(--font-weight-medium)] text-[var(--color-text)] hover:text-[var(--color-primary)] cursor-pointer"
              onClick={() => onCustomerClick?.(customer)}
            >
              {customer.name}
            </div>
            <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              {customer.email}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-1">
          <Badge variant={tier.color as 'success' | 'warning' | 'info' | 'primary' | 'default'} size="sm">
            {tier.tier}
          </Badge>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
          £{(customer.total_spent || 0).toLocaleString()}
        </div>
        <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          LTV: £{Math.round(metrics.projectedLTV).toLocaleString()}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
          {customer.total_bookings || 0}
        </div>
        <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          Avg: £{Math.round(metrics.avgBookingValue)}
        </div>
      </td>
      <td className="p-4">
        <div className="text-[var(--font-size-sm)] text-[var(--color-text)]">
          {customer.last_booking_at 
            ? new Date(customer.last_booking_at).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short',
                year: 'numeric'
              })
            : 'Never'
          }
        </div>
        <Badge variant={risk.color as 'success' | 'warning' | 'error'} size="sm">
          {risk.level} Risk
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            intent="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCustomerEdit?.(customer);
            }}
          >
            Edit
          </Button>
          <Button 
            intent="primary" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBookService?.(customer);
            }}
          >
            Book
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Main Enterprise Customer Grid Component
export function EnterpriseCustomerGrid({
  customers,
  loading = false,
  onCustomerClick,
  onCustomerEdit,
  onBookService,
  onExport,
  className
}: CustomerGridProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const [selectedTier, setSelectedTier] = React.useState<string>('all');

  // Filter and sort customers
  const filteredCustomers = React.useMemo(() => {
    const filtered = customers.filter(customer => {
      const matchesSearch = searchQuery === '' || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery);
      
      const tier = getCustomerTier(customer).tier;
      const matchesTier = selectedTier === 'all' || tier.toLowerCase() === selectedTier.toLowerCase();
      
      return matchesSearch && matchesTier;
    });

    // Sort customers
    filtered.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'total_spent':
          aVal = a.total_spent || 0;
          bVal = b.total_spent || 0;
          break;
        case 'total_bookings':
          aVal = a.total_bookings || 0;
          bVal = b.total_bookings || 0;
          break;
        case 'last_booking_at':
          aVal = a.last_booking_at ? new Date(a.last_booking_at).getTime() : 0;
          bVal = b.last_booking_at ? new Date(b.last_booking_at).getTime() : 0;
          break;
        case 'customer_since':
          aVal = a.customer_since ? new Date(a.customer_since).getTime() : 0;
          bVal = b.customer_since ? new Date(b.customer_since).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [customers, searchQuery, sortField, sortOrder, selectedTier]);

  // Customer segments for stats
  const customerStats = React.useMemo(() => {
    const stats = {
      total: customers.length,
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      totalRevenue: 0,
      avgLTV: 0,
    };

    customers.forEach(customer => {
      const tier = getCustomerTier(customer);
      const metrics = calculateCustomerMetrics(customer);
      
      stats.totalRevenue += customer.total_spent || 0;
      stats.avgLTV += metrics.projectedLTV;
      
      switch (tier.tier.toLowerCase()) {
        case 'bronze': stats.bronze++; break;
        case 'silver': stats.silver++; break;
        case 'gold': stats.gold++; break;
        case 'platinum': stats.platinum++; break;
      }
    });

    stats.avgLTV = stats.total > 0 ? stats.avgLTV / stats.total : 0;

    return stats;
  }, [customers]);

  if (loading) {
    return <CustomerGridSkeleton />;
  }

  return (
    <div className={className}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
              {customerStats.total}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Total Customers
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
              {customerStats.platinum}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Platinum
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-warning)]">
              {customerStats.gold}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Gold
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-primary)]">
              £{Math.round(customerStats.avgLTV).toLocaleString()}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Avg LTV
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
              £{customerStats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              Total Revenue
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Customer Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                intent="ghost"
                size="sm"
                onClick={onExport}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>
              
              {/* View Mode Toggle */}
              <div className="flex border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
                <Button
                  intent={viewMode === 'cards' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0"
                  onClick={() => setViewMode('cards')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                </Button>
                <Button
                  intent={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 border-l border-[var(--color-border)]"
                  onClick={() => setViewMode('table')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            
            <Select
              options={[
                { label: 'All Tiers', value: 'all' },
                { label: 'Platinum', value: 'platinum' },
                { label: 'Gold', value: 'gold' },
                { label: 'Silver', value: 'silver' },
                { label: 'Bronze', value: 'bronze' },
              ]}
              value={selectedTier}
              onValueChange={setSelectedTier}
            />
            
            <Select
              options={[
                { label: 'Sort by Name', value: 'name' },
                { label: 'Sort by Revenue', value: 'total_spent' },
                { label: 'Sort by Bookings', value: 'total_bookings' },
                { label: 'Sort by Last Booking', value: 'last_booking_at' },
              ]}
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            />
            
            <Button
              intent="ghost"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="justify-start"
            >
              {sortOrder === 'asc' ? (
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid/Table */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onCustomerClick={onCustomerClick}
              onBookService={onBookService}
              onCustomerEdit={onCustomerEdit}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Customer</th>
                  <th className="text-left p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Tier</th>
                  <th className="text-right p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Revenue</th>
                  <th className="text-center p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Bookings</th>
                  <th className="text-left p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Last Booking</th>
                  <th className="text-left p-4 font-[var(--font-weight-semibold)] text-[var(--color-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    customer={customer}
                    onCustomerClick={onCustomerClick}
                    onBookService={onBookService}
                    onCustomerEdit={onCustomerEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-[var(--font-size-lg)] font-[var(--font-weight-semibold)] text-[var(--color-text)] mb-2">
              No customers found
            </h3>
            <p className="text-[var(--color-text-muted)] mb-4">
              {searchQuery || selectedTier !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first customer'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading skeleton
function CustomerGridSkeleton() {
  return (
    <div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <div className="h-8 bg-[var(--color-muted)] rounded w-16 mx-auto mb-2 animate-pulse" />
              <div className="h-4 bg-[var(--color-muted)] rounded w-20 mx-auto animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Controls skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-[var(--color-muted)] rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-[var(--color-muted)] rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 bg-[var(--color-muted)] rounded w-32 mb-2 animate-pulse" />
                  <div className="h-4 bg-[var(--color-muted)] rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-[var(--color-muted)] rounded animate-pulse" />
                <div className="h-4 bg-[var(--color-muted)] rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-[var(--color-muted)] rounded w-1/2 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}