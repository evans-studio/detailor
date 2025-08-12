"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Avatar } from '@/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { CustomerData } from './EnterpriseCustomerGrid';

interface CustomerProfilePanelProps {
  customer: CustomerData | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (customer: CustomerData) => void;
  onBookService?: (customer: CustomerData) => void;
  onDelete?: (customer: CustomerData) => void;
  className?: string;
}

interface BookingHistory {
  id: string;
  date: string;
  service: string;
  vehicle?: string;
  status: 'completed' | 'cancelled' | 'no_show';
  amount: number;
  rating?: number;
  notes?: string;
}

interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  registration?: string;
  notes?: string;
  last_serviced?: string;
  service_history_count: number;
  preferred_services?: string[];
}

interface CommunicationLog {
  id: string;
  type: 'email' | 'phone' | 'sms' | 'in_person';
  date: string;
  subject?: string;
  content: string;
  direction: 'inbound' | 'outbound';
  staff_member?: string;
}

// Customer Health Score Calculation
const calculateCustomerHealthScore = (customer: CustomerData): { score: number; factors: string[]; trend: 'up' | 'down' | 'stable' } => {
  let score = 50; // Base score
  const factors: string[] = [];

  // Recency of last booking
  if (customer.last_booking_at) {
    const daysSince = Math.floor((Date.now() - new Date(customer.last_booking_at).getTime()) / (24 * 60 * 60 * 1000));
    if (daysSince < 30) {
      score += 20;
      factors.push('Recent activity');
    } else if (daysSince > 90) {
      score -= 15;
      factors.push('Inactive for 90+ days');
    }
  }

  // Booking frequency
  const bookings = customer.total_bookings || 0;
  if (bookings >= 10) {
    score += 15;
    factors.push('Frequent customer');
  } else if (bookings >= 5) {
    score += 10;
    factors.push('Regular customer');
  } else if (bookings <= 1) {
    score -= 10;
    factors.push('New/infrequent customer');
  }

  // Spending level
  const totalSpent = customer.total_spent || 0;
  if (totalSpent >= 1000) {
    score += 15;
    factors.push('High-value customer');
  } else if (totalSpent >= 500) {
    score += 10;
    factors.push('Moderate spender');
  }

  // Satisfaction rating
  if (customer.satisfaction_rating) {
    if (customer.satisfaction_rating >= 4.5) {
      score += 10;
      factors.push('Highly satisfied');
    } else if (customer.satisfaction_rating < 3) {
      score -= 15;
      factors.push('Low satisfaction');
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Simple trend calculation (would be based on historical data in real implementation)
  const trend: 'up' | 'down' | 'stable' = score >= 75 ? 'up' : score <= 40 ? 'down' : 'stable';

  return { score, factors, trend };
};

// Mock data generators (in real app, these would come from API)
const generateMockBookingHistory = (customer: CustomerData): BookingHistory[] => {
  const services = ['Premium Detail', 'Express Wash', 'Paint Correction', 'Ceramic Coating', 'Interior Deep Clean'];
  const vehicles = customer.vehicles?.map(v => v.name) || ['Vehicle'];
  
  return Array.from({ length: Math.min(10, customer.total_bookings || 0) }, (_, i) => ({
    id: `booking-${i}`,
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    service: services[Math.floor(Math.random() * services.length)],
    vehicle: vehicles[Math.floor(Math.random() * vehicles.length)],
    status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'cancelled' : 'no_show',
    amount: Math.random() * 200 + 50,
    rating: Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 4 : undefined,
    notes: Math.random() > 0.7 ? 'Customer was very satisfied with the service' : undefined,
  }));
};

const generateMockCommunicationLog = (): CommunicationLog[] => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `comm-${i}`,
    type: ['email', 'phone', 'sms'][Math.floor(Math.random() * 3)] as 'email' | 'phone' | 'sms',
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    subject: 'Booking confirmation',
    content: 'Thank you for your booking. We look forward to serving you.',
    direction: Math.random() > 0.5 ? 'outbound' : 'inbound',
    staff_member: 'Sarah Johnson',
  }));
};

export function CustomerProfilePanel({
  customer,
  open,
  onClose,
  onEdit,
  onBookService,
  onDelete,
  className
}: CustomerProfilePanelProps) {
  const [activeTab, setActiveTab] = React.useState('overview');

  // Move React hooks before early return
  const mockBookings = React.useMemo(() => 
    customer ? generateMockBookingHistory(customer) : [], [customer]
  );
  const mockCommunications = React.useMemo(() => generateMockCommunicationLog(), []);

  if (!customer) return null;

  const healthScore = calculateCustomerHealthScore(customer);

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--color-surface)] shadow-[var(--shadow-xl)] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <Avatar
                src={customer.avatar}
                name={customer.name}
                size="lg"
              />
              <div>
                <h2 className="text-[var(--font-size-xl)] font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                  {customer.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary" size="sm">
                    Customer ID: {customer.id.slice(0, 8)}
                  </Badge>
                  {customer.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                intent="primary"
                size="sm"
                onClick={() => onBookService?.(customer)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Book Service
              </Button>
              <Button
                intent="ghost"
                size="sm"
                onClick={() => onEdit?.(customer)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </Button>
              <Button
                intent="ghost"
                size="sm"
                onClick={onClose}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6 pt-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                  <TabsTrigger value="communications">Communications</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 space-y-6">
                <TabsContent value="overview">
                  {/* Health Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span>Customer Health Score</span>
                        <Badge 
                          variant={healthScore.score >= 75 ? 'success' : healthScore.score >= 50 ? 'warning' : 'error'}
                        >
                          {healthScore.score}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Score bar */}
                        <div className="relative w-full h-2 bg-[var(--color-muted)] rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                              width: `${healthScore.score}%`,
                              backgroundColor: healthScore.score >= 75 ? 'var(--color-success)' : 
                                              healthScore.score >= 50 ? 'var(--color-warning)' : 'var(--color-error)'
                            }}
                          />
                        </div>
                        
                        {/* Factors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {healthScore.factors.map((factor, index) => (
                            <div key={index} className="flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                              <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text)]">
                          {customer.total_bookings || 0}
                        </div>
                        <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                          Total Bookings
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
                          {formatCurrency(customer.total_spent || 0)}
                        </div>
                        <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                          Total Spent
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {customer.email && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-[var(--color-text)]">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-[var(--color-text)]">{customer.phone}</span>
                        </div>
                      )}
                      {customer.communication_preference && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          <span className="text-[var(--color-text)]">
                            Prefers {customer.communication_preference}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {customer.last_booking_at && (
                          <div className="flex items-center gap-3 text-[var(--font-size-sm)]">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
                            <span className="text-[var(--color-text)]">
                              Last booking: {new Date(customer.last_booking_at).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {customer.customer_since && (
                          <div className="flex items-center gap-3 text-[var(--font-size-sm)]">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                            <span className="text-[var(--color-text)]">
                              Customer since: {new Date(customer.customer_since).toLocaleDateString('en-GB', {
                                year: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bookings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking History ({mockBookings.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockBookings.map((booking) => (
                          <div key={booking.id} className="flex items-start gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
                                  {booking.service}
                                </span>
                                <Badge 
                                  variant={
                                    booking.status === 'completed' ? 'success' :
                                    booking.status === 'cancelled' ? 'warning' : 'error'
                                  }
                                  size="sm"
                                >
                                  {booking.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] space-y-1">
                                <div>{new Date(booking.date).toLocaleDateString('en-GB')}</div>
                                {booking.vehicle && <div>Vehicle: {booking.vehicle}</div>}
                                {booking.notes && <div>Notes: {booking.notes}</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                                {formatCurrency(booking.amount)}
                              </div>
                              {booking.rating && (
                                <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                  ⭐ {booking.rating}/5
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vehicles">
                  <Card>
                    <CardHeader>
                      <CardTitle>Registered Vehicles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customer.vehicles && customer.vehicles.length > 0 ? (
                        <div className="space-y-4">
                          {customer.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-[var(--font-weight-semibold)] text-[var(--color-text)]">
                                    {vehicle.name}
                                  </h4>
                                  <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                    Vehicle details
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 15l-7-7-7 7" />
                            </svg>
                          </div>
                          <p className="text-[var(--color-text-muted)]">No vehicles registered</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockCommunications.map((comm) => (
                          <div key={comm.id} className="flex gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                              {comm.type === 'email' && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                              )}
                              {comm.type === 'phone' && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              )}
                              {comm.type === 'sms' && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-[var(--font-weight-medium)] text-[var(--color-text)]">
                                  {comm.subject || `${comm.type.toUpperCase()} ${comm.direction}`}
                                </span>
                                <Badge variant="outline" size="sm">
                                  {comm.direction}
                                </Badge>
                              </div>
                              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mb-2">
                                {comm.content}
                              </p>
                              <div className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                                {new Date(comm.date).toLocaleDateString('en-GB')} • {comm.staff_member}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics">
                  <div className="space-y-6">
                    {/* Customer Value Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Customer Value Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
                              {formatCurrency((customer.total_spent || 0) / Math.max(1, customer.total_bookings || 1))}
                            </div>
                            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                              Avg Booking Value
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-primary)]">
                              {customer.lifetime_value ? formatCurrency(customer.lifetime_value) : 'N/A'}
                            </div>
                            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                              Lifetime Value
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-warning)]">
                              {customer.booking_frequency || 'Monthly'}
                            </div>
                            <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                              Booking Frequency
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Satisfaction & Feedback */}
                    {customer.satisfaction_rating && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Customer Satisfaction</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-[var(--font-size-3xl)] font-[var(--font-weight-bold)] text-[var(--color-success)]">
                                {customer.satisfaction_rating.toFixed(1)}
                              </div>
                              <div className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                Average Rating
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-5 h-5 ${i < Math.floor(customer.satisfaction_rating!) ? 'text-yellow-400' : 'text-[var(--color-muted)]'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                                Based on {customer.total_bookings || 0} completed services
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}