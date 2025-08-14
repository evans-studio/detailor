import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import OnboardingPage from '@/app/onboarding/page';
import { renderWithProviders } from '../../setup/render';

// Mock notifications hook
vi.mock('@/lib/notifications', () => ({
  useNotifications: () => ({ notify: vi.fn() }),
}));

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock as any;

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks for init calls
    fetchMock.mockImplementation((url: string, init?: any) => {
      if (url.includes('/api/tenant/me')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { id: 'tid-1' } }), { status: 200 }));
      }
      if (url.includes('/api/settings/tenant')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: { tenant: { legal_name: 'Biz', trading_name: 'Biz Ltd', contact_email: 'owner@biz.com' } } }), { status: 200 }));
      }
      if (url.includes('/api/admin/services') && (!init || init.method !== 'POST')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
      }
      if (url.includes('/api/admin/availability/work-patterns') && (!init || init.method !== 'POST')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
  });

  it('progresses through business -> service -> availability -> branding -> complete', async () => {
    renderWithProviders(<OnboardingPage />);

    // Business step prefill and continue
    await screen.findByText(/Business Information/i);
    fireEvent.change(screen.getByLabelText(/Business Name/i), { target: { value: 'My Co' } });
    fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Admin Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/Admin Email/i), { target: { value: 'owner@biz.com' } });

    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: { tenant_id: 'tid-1' } }), { status: 200 })));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText(/Your First Service/i);

    // Create service
    fireEvent.change(screen.getByLabelText(/Service Name/i), { target: { value: 'Exterior Wash' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), { target: { value: '60' } });
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ success: true, data: { id: 'svc1' } }), { status: 200 })));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText(/Working Hours/i);

    // Save availability
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/admin/availability/work-patterns')) {
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await screen.findByText(/Branding/i);

    // Branding save and complete
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 })));
    fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

    await screen.findByText(/Setup Complete/i);
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
  });
});


