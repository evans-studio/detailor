import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminCustomersPage from '@/app/admin/customers/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/customers',
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminCustomersPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/customers')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { customers: [
          { id: 'c1', name: 'Jane Smith', email: 'jane@example.com', phone: '+4412345678', total_bookings: 2, total_spent: 150 },
        ] } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders customer cards with key info', async () => {
    renderWithProviders(<AdminCustomersPage />);
    const name = await screen.findByTestId('customer-name');
    const email = await screen.findByTestId('customer-email');
    const phone = await screen.findByTestId('customer-phone');
    const bookings = await screen.findByTestId('customer-total-bookings');
    const spent = await screen.findByTestId('customer-total-spent');
    expect(name.textContent).toMatch(/Jane Smith/);
    expect(email.textContent).toMatch(/jane@example.com/);
    expect(phone.textContent).toMatch(/\+4412345678/);
    expect(Number(bookings.textContent)).toBeGreaterThanOrEqual(0);
    expect(spent.textContent).toMatch(/£/);
  });
});


