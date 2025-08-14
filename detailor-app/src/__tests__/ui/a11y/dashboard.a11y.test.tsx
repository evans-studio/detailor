import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import AdminDashboard from '@/app/admin/dashboard/page';
import { renderWithProviders } from '../../setup/render';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/dashboard' }));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'a@b.com', role: 'admin' }, loading: false, isAuthenticated: true, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('A11y: AdminDashboard landmarks and names', () => {
  it('exposes landmarks and skip link', async () => {
    renderWithProviders(<AdminDashboard />);
    // Landmark roles
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    const main = await screen.findByRole('main', { name: /main content/i });
    expect(main).toBeInTheDocument();
    // One or more navigation regions exist (sidebar + mobile)
    const navs = await screen.findAllByRole('navigation');
    expect(navs.length).toBeGreaterThanOrEqual(1);
    // Skip link is present and named
    const skip = await screen.findByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
  });
});


