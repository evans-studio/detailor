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
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleGuard allowed={['admin', 'staff']}>
      <DashboardShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
              <p className="text-gray-600">Manage customer quotes and proposals</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Quote
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredQuotes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No quotes match your current filters.' 
                      : 'Get started by creating your first quote.'
                    }
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Quote
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {quote.quote_number}
                          </h3>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{quote.customer_name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {new Date(quote.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            £{quote.total.toFixed(2)}
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
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
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