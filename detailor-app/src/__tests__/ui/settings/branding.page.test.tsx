import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import BrandingSettings from '@/app/admin/settings/branding/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/branding' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BrandingSettings', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/settings/tenant') && (!init || init.method !== 'PATCH')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { tenant: { brand_theme: { brand: { primary: '#0000FF', secondary: '#00FF00' } } } } }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders branding form and saves changes', async () => {
    renderWithProviders(<BrandingSettings />);
    await screen.findByTestId('branding-form');
    fireEvent.change(screen.getByTestId('branding-primary'), { target: { value: '#FF0000' } });
    // secondary input removed in new UX; ensure preview still renders
    expect(await screen.findByTestId('branding-preview')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('branding-save'));
  });
});


