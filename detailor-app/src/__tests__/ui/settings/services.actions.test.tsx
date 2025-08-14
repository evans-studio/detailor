import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import AdminServicesPage from '@/app/admin/settings/services/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/services' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminServicesPage actions', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/admin/services') && (!init || init.method === undefined)) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [
          { id: 'svc1', name: 'Exterior Wash', description: 'Fast exterior wash', duration_minutes: 30, base_price: 25, visible: true, category: 'exterior', requires_vehicle: true, created_at: '', updated_at: '' },
        ] }), { status: 200 }));
      }
      if (url.includes('/api/admin/services/svc1') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      if (url.includes('/api/admin/services/svc1') && init?.method === 'DELETE') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('toggles visibility and deletes a service', async () => {
    renderWithProviders(<AdminServicesPage />);
    await screen.findByTestId('services-list');
    // Toggle visibility
    const toggleButtons = screen.getAllByRole('button');
    fireEvent.click(toggleButtons.find((b) => b.querySelector('svg'))!);

    // Mock confirm for delete
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteButton = screen.getAllByRole('button').pop()!;
    fireEvent.click(deleteButton);
    confirmSpy.mockRestore();
  });
});


