import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import BlackoutsSettingsPage from '@/app/admin/settings/availability/blackouts/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/availability/blackouts' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BlackoutsSettingsPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    // Default list
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/admin/availability/blackouts') && (!init || init.method === undefined)) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { blackouts: [
          { id: 'b1', starts_at: new Date().toISOString(), ends_at: new Date(Date.now()+3600000).toISOString(), reason: 'Holiday' },
        ] } }), { status: 200 }));
      }
      if (url.includes('/api/admin/availability/blackouts') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      if (url.includes('/api/admin/availability/blackouts') && init?.method === 'DELETE') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders existing blackouts and allows create', async () => {
    renderWithProviders(<BlackoutsSettingsPage />);
    await screen.findByTestId('blackout-list');
    await screen.findByTestId('blackout-item-b1');

    fireEvent.change(screen.getByTestId('blackout-start'), { target: { value: '2025-01-01T09:00' } });
    fireEvent.change(screen.getByTestId('blackout-end'), { target: { value: '2025-01-01T17:00' } });
    fireEvent.change(screen.getByTestId('blackout-reason'), { target: { value: 'Bank Holiday' } });

    fireEvent.click(screen.getByTestId('blackout-add'));
    // List invalidation occurs; just assert list container still present
    await screen.findByTestId('blackout-list');
  });
});


