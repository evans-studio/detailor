import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminInvoicesPage from '@/app/admin/invoices/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/invoices' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminInvoicesPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/invoices')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { invoices: [
          { id: 'inv1', number: 'INV-1001', total: 120, paid_amount: 50, balance: 70, created_at: new Date().toISOString() },
        ] } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders invoices table and rows', async () => {
    renderWithProviders(<AdminInvoicesPage />);
    await screen.findByTestId('invoices-table');
    // Column content appears as plain text
    await screen.findByText(/INV-1001/);
    await screen.findByText(/£120.00/);
  });
});


