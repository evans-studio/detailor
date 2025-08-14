import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AnalyticsPage from '@/app/admin/analytics/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/analytics' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AnalyticsPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/revenue')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { daily_revenue: [{ date: '2025-01-01', revenue: 100 }] } }), { status: 200 }));
      }
      if (url.includes('/api/analytics/service-popularity')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { services: [{ service: 'Wash', revenue: 200, bookings: 5 }] } }), { status: 200 }));
      }
      if (url.includes('/api/analytics/clv')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { customers: [{ id: 'c1', name: 'Jane', ltv: 500 }] } }), { status: 200 }));
      }
      if (url.includes('/api/analytics/staff-productivity')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { staff: [{ staff_profile_id: 's1', name: 'Tech 1', jobs_completed: 3, avg_duration_min: 90 }] } }), { status: 200 }));
      }
      if (url.includes('/api/analytics/conversion-funnel')) {
        return Promise.resolve(new Response(JSON.stringify({ data: { funnel: { visits: 100, quotes: 20, bookings: 10 } } }), { status: 200 }));
      }
      if (url.includes('/api/analytics/export')) {
        return Promise.resolve(new Response(new Blob(['col1,col2\n1,2'])));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders analytics panels and basic data', async () => {
    renderWithProviders(<AnalyticsPage />);
    await screen.findByTestId('analytics-panels');
    await screen.findByTestId('analytics-revenue');
    await screen.findByText(/2025-01-01/);
    await screen.findByTestId('analytics-services');
    await screen.findByText(/Wash/);
    await screen.findByTestId('analytics-clv');
    await screen.findByText(/Jane/);
    await screen.findByTestId('analytics-staff');
    await screen.findByText(/Tech 1/);
    await screen.findByTestId('analytics-funnel');
  });
});


