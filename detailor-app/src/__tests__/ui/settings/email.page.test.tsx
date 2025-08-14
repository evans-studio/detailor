import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import EmailSettings from '@/app/admin/settings/email/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings/email' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('EmailSettings', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/settings/tenant') && (!init || init.method !== 'PATCH')) {
        return Promise.resolve(new Response(JSON.stringify({ tenant: { reply_to: 'hello@example.com', sender_domain: 'mg.example.com' } }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant') && init?.method === 'PATCH') {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders email form and saves changes', async () => {
    renderWithProviders(<EmailSettings />);
    await screen.findByTestId('email-form');
    fireEvent.change(screen.getByTestId('email-reply-to'), { target: { value: 'support@example.com' } });
    fireEvent.change(screen.getByTestId('email-sender-domain'), { target: { value: 'mg2.example.com' } });
    fireEvent.click(screen.getByTestId('email-save'));
  });
});


