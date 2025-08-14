import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminDashboard from '@/app/admin/dashboard/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));

// Mock auth to admin
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminDashboard', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/kpis')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { bookings_today: 3, revenue_mtd: 1200, total_customers: 42, active_jobs: 1 } }), { status: 200 }));
      }
      if (url.includes('/api/bookings')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [{ id: 'b1', start_at: new Date().toISOString(), service_name: 'Wash', customer_name: 'John' }] }), { status: 200 }));
      }
      if (url.includes('/api/activities/recent')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, activities: [{ id: 'a1', message: 'Created booking', created_at: new Date().toISOString() }] }), { status: 200 }));
      }
      if (url.includes('/api/jobs?status=in_progress')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { jobs: [{ id: 'j1', status: 'in_progress', started_at: new Date().toISOString(), bookings: { reference: 'REF1' }, customers: { name: 'Sam' } }] } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders KPI cards and lists sections with KPI values', async () => {
    renderWithProviders(<AdminDashboard />);
    const bookingsKPI = await screen.findByTestId('kpi-bookings-today-value');
    expect(bookingsKPI.textContent).toBe('3');
    expect(await screen.findByTestId('kpi-revenue-mtd')).toBeInTheDocument();
    expect(await screen.findByTestId('kpi-total-customers')).toBeInTheDocument();
    expect(await screen.findByTestId('kpi-active-jobs')).toBeInTheDocument();
    await screen.findByTestId('upcoming-bookings');
    await screen.findByTestId('recent-activity');
    await screen.findByTestId('live-jobs');
  });
});


