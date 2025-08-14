import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminBookingsPage from '@/app/admin/bookings/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/bookings' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('A11y: AdminBookingsPage headings and button names', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/bookings')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { bookings: [] } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('has a main heading and a named New Booking button', async () => {
    renderWithProviders(<AdminBookingsPage />);
    const heading = await screen.findByRole('heading', { level: 1, name: /booking management/i });
    expect(heading).toBeInTheDocument();
    const newBooking = await screen.findByRole('button', { name: /new booking/i });
    expect(newBooking).toBeInTheDocument();
  });
});


