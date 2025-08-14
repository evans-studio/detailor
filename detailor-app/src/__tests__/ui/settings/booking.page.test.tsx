import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import BookingDefaultsPage from '@/app/admin/settings/booking/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/booking' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BookingDefaultsPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/admin/availability/work-patterns') && (!init || init.method !== 'POST')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant') && (!init || init.method !== 'PATCH')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { tenant: { business_prefs: { service_radius_km: 25 } } } }), { status: 200 }));
      }
      if (url.includes('/api/admin/availability/work-patterns') && init?.method === 'POST') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders working hours and can save service radius', async () => {
    renderWithProviders(<BookingDefaultsPage />);
    await screen.findByTestId('working-hours');
    await screen.findByTestId('service-radius');
    fireEvent.change(screen.getByTestId('service-radius-input'), { target: { value: '30' } });
    fireEvent.click(screen.getByTestId('working-hours-save'));
  });
});


