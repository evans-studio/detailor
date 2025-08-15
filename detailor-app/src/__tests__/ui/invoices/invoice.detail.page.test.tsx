import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminInvoiceDetailPage from '@/app/admin/invoices/[id]/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/invoices/inv1',
  useParams: () => ({ id: 'inv1' }),
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminInvoiceDetailPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/invoices/inv1')) {
        return Promise.resolve(new Response(JSON.stringify({ invoice: { id: 'inv1', number: 'INV-1001', total: 120, paid_amount: 0, balance: 120, created_at: new Date().toISOString() } }), { status: 200 }));
      }
      if (url.includes('/api/payments?invoice_id=inv1')) {
        return Promise.resolve(new Response(JSON.stringify({ payments: [] }), { status: 200 }));
      }
      if (url.includes('/api/tenant/me')) {
        return Promise.resolve(new Response(JSON.stringify({ tenant: { is_demo: true } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders invoice header and actions', async () => {
    renderWithProviders(<AdminInvoiceDetailPage />);
    await screen.findByText(/Invoice INV-1001/);
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Mark as Paid/i })).toBeInTheDocument();
  });
});


