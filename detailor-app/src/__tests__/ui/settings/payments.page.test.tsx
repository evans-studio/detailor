import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import PaymentSettings from '@/app/admin/settings/payments/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/payments' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PaymentSettings', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/settings/tenant') && (!init || init.method !== 'PATCH')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { tenant: { stripe_public_key: 'pk_test', business_prefs: { deposit_percent: 20, deposit_min_gbp: 5 } } } }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders payment form and saves changes', async () => {
    renderWithProviders(<PaymentSettings />);
    await screen.findByTestId('payments-form');
    fireEvent.change(screen.getByTestId('payments-stripe-pk'), { target: { value: 'pk_live_123' } });
    fireEvent.change(screen.getByTestId('payments-deposit-percent'), { target: { value: '25' } });
    fireEvent.change(screen.getByTestId('payments-deposit-min'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('payments-save'));
  });
});


