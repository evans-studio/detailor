import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import AdminQuotesPage from '@/app/admin/quotes/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/quotes' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AdminQuotesPage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/quotes')) {
        return Promise.resolve(new Response(JSON.stringify({ quotes: [
          { id: 'q1', quote_number: 'Q-1001', customer_name: 'Jane Smith', customer_email: 'jane@example.com', total: 199.99, status: 'sent', created_at: new Date().toISOString(), valid_until: new Date(Date.now()+86400000).toISOString(), services: [] },
          { id: 'q2', quote_number: 'Q-1002', customer_name: 'John Doe', customer_email: 'john@example.com', total: 250, status: 'accepted', created_at: new Date().toISOString(), valid_until: new Date(Date.now()+86400000).toISOString(), services: [] },
        ] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('renders quotes and supports filtering UI', async () => {
    renderWithProviders(<AdminQuotesPage />);

    // List is present and renders the quote
    await screen.findByTestId('quotes-list');
    const numbers = await screen.findAllByTestId('quote-number');
    expect(numbers.length).toBeGreaterThanOrEqual(1);
    const customers = await screen.findAllByTestId('quote-customer');
    expect(customers.length).toBeGreaterThanOrEqual(1);
    const totals = await screen.findAllByTestId('quote-total');
    expect(totals.length).toBeGreaterThanOrEqual(1);

    // Filters exist and can be interacted with
    await screen.findByTestId('quotes-filters');
    fireEvent.change(screen.getByPlaceholderText(/search quotes/i), { target: { value: 'Q-1001' } });
  });

  it('exposes create quote action', async () => {
    renderWithProviders(<AdminQuotesPage />);
    const btn = await screen.findByTestId('create-quote-button');
    expect(btn).toBeInTheDocument();
  });

  it('shows Convert to Booking button for accepted quotes', async () => {
    renderWithProviders(<AdminQuotesPage />);
    await screen.findByTestId('quotes-list');
    // Accepted quote should render action
    expect(await screen.findByText(/Convert to Booking/i)).toBeInTheDocument();
  });
});


