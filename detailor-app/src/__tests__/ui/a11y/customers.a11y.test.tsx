import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import AdminCustomersPage from '@/app/admin/customers/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/customers' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('A11y: AdminCustomersPage headings and controls', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/customers')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { customers: [] } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('has a main landmark and named Export/New buttons', async () => {
    renderWithProviders(<AdminCustomersPage />);
    expect(await screen.findByRole('main', { name: /main content/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /new customer/i })).toBeInTheDocument();
  });
});


