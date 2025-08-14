import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import AdminMessagesPage from '@/app/admin/messages/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/messages' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminMessagesPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/messages')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { conversations: [
          { id: 'm1', customer_name: 'Jane Smith', customer_email: 'jane@example.com', last_message: 'Hello', last_message_at: new Date().toISOString(), unread_count: 2, channel: 'sms', status: 'active' },
        ] } }), { status: 200 }));
      }
      if (url.includes('/api/billing/usage')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { usage: { sms_credits: 10 } } }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders conversations and opens thread on click', async () => {
    renderWithProviders(<AdminMessagesPage />);
    await screen.findByTestId('conversations-list');
    const convo = await screen.findByTestId('conversation-customer');
    expect(convo.textContent).toMatch(/Jane Smith/);
    fireEvent.click(screen.getByTestId('conversation-item-m1'));
    const thread = await screen.findByTestId('thread-title');
    expect(thread.textContent).toMatch(/Jane Smith/);
  });
});


