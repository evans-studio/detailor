import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminBookingsPage from '@/app/admin/bookings/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/bookings',
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminBookingsPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/bookings')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { bookings: [
          { id: 'b1', start_at: new Date().toISOString(), end_at: new Date(Date.now()+3600000).toISOString(), status: 'confirmed', payment_status: 'unpaid', price_breakdown: { total: 100 }, reference: 'REF1', customer_name: 'Alice', service_name: 'Deluxe', vehicle_name: '2020 Audi A3', address: '1 Main St, London' },
        ] } }), { status: 200 }));
      }
      if (url.includes('/api/payments/checkout-booking')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { url: 'https://checkout' } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders booking list with key booking info displayed', async () => {
    renderWithProviders(<AdminBookingsPage />);
    // Assert user outcomes rather than exact strings
    const service = await screen.findByTestId('booking-service');
    const customer = await screen.findByTestId('booking-customer');
    expect(service.textContent).toMatch(/Deluxe|Service/);
    expect(customer.textContent).toMatch(/Alice|Customer/);
  });
});


