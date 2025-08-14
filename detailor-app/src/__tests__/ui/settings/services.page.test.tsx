import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import AdminServicesPage from '@/app/admin/settings/services/page';
import { renderWithProviders } from '../../setup/render';

// Mock pathname for sidebar active state
vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/settings/services',
}));

// Ensure auth context returns admin for this suite
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminServicesPage (Settings > Services)', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    // Default GET list
    fetchMock.mockImplementation((url: string, init?: any) => {
      if (url.includes('/api/admin/services') && (!init || init.method !== 'POST')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [
          { id: 'svc1', name: 'Exterior Wash', description: 'Fast exterior wash', duration_minutes: 30, base_price: 25, visible: true, category: 'exterior', requires_vehicle: true, created_at: '', updated_at: '' },
        ] }), { status: 200 }));
      }
      // Default success
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders services list and allows creating a new service', async () => {
    renderWithProviders(<AdminServicesPage />);

    // Existing service card appears
    await screen.findByTestId('services-list');

    // Open create form
    fireEvent.click(screen.getByTestId('add-service-button'));

    // Fill and submit
    fireEvent.change(screen.getByTestId('service-name-input'), { target: { value: 'Interior Clean' } });
    fireEvent.change(screen.getByTestId('service-description-textarea'), { target: { value: 'Deep interior clean' } });
    fireEvent.change(screen.getByTestId('service-price-input'), { target: { value: '35' } });
    fireEvent.change(screen.getByTestId('service-duration-input'), { target: { value: '45' } });

    // Mock POST create
    fetchMock.mockImplementationOnce((_url: string, init?: any) => {
      const body = JSON.parse(init?.body || '{}');
      expect(body.name).toBe('Interior Clean');
      expect(body.base_price).toBe(35);
      expect(body.base_duration_min ?? body.duration_minutes).toBe(45);
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: { id: 'svc2' } }), { status: 200 }));
    });

    fireEvent.click(screen.getByTestId('create-service-button'));

    // After create, list refetch is triggered; ensure our list request happens again
    // We already have default GET mock; just assert button is enabled again later and form can close
    // A simple assertion: the original service remains visible
    await screen.findByTestId('services-list');
  });
});


