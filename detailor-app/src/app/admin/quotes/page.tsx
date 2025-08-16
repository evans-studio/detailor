"use client";
import * as React from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { RoleGuard } from '@/components/RoleGuard';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';
import { PlusCircle, Search, FileText, Calendar, DollarSign } from 'lucide-react';

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
  created_at: string;
  valid_until: string;
  services: Array<{
    name: string;
    price: number;
  }>;
}

export default function AdminQuotesPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['admin-quotes'],
    queryFn: async (): Promise<Quote[]> => {
      const res = await fetch('/api/quotes');
      const json = await res.json();
      return json.quotes || [];
    },
  });

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft': return 'bg-[var(--color-muted)] text-[var(--color-text)]';
      case 'sent': return 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]';
      case 'accepted': return 'bg-[var(--color-success-100)] text-[var(--color-success-600)]';
      case 'expired': return 'bg-[var(--color-warning-100)] text-[var(--color-warning-600)]';
      case 'rejected': return 'bg-[var(--color-error-100)] text-[var(--color-error-600)]';
      default: return 'bg-[var(--color-muted)] text-[var(--color-text)]';
    }
  };

  return (
    <RoleGuard allowed={['admin', 'staff']}>
      <DashboardShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Quotes</h1>
              <p className="text-[var(--color-text-secondary)]">Manage customer quotes and proposals</p>
            </div>
            <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-hover-primary)] text-[var(--color-primary-foreground)]" data-testid="create-quote-button">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          </div>

          {/* Filters */}
          <Card data-testid="quotes-filters">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] h-4 w-4" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="expired">Expired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Quotes List */}
          <div className="space-y-4" data-testid="quotes-list">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-[var(--color-active-surface)] rounded w-1/4"></div>
                        <div className="h-3 bg-[var(--color-active-surface)] rounded w-1/2"></div>
                        <div className="h-3 bg-[var(--color-active-surface)] rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredQuotes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">No quotes found</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No quotes match your current filters.' 
                      : 'Get started by creating your first quote.'
                    }
                  </p>
                  <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-hover-primary)] text-[var(--color-primary-foreground)]">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Quote
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow" data-testid={`quote-card-${quote.id}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-[var(--color-text)]" data-testid="quote-number">{quote.quote_number}</h3>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-[var(--color-text-secondary)]" data-testid="quote-customer">{quote.customer_name}</p>
                        <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(quote.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span data-testid="quote-total">£{quote.total.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button intent="outline" size="sm">
                          View
                        </Button>
                        <Button intent="outline" size="sm">
                          Edit
                        </Button>
                        {quote.status === 'accepted' && (
                          <Button size="sm" className="bg-[var(--color-success)] hover:opacity-90 text-[var(--color-success-foreground)]">
                            Convert to Booking
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}