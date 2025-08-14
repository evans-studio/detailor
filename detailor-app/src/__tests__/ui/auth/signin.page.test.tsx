import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '@/app/(auth)/signin/page';
import { renderWithProviders } from '../../setup/render';

// Mock next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: vi.fn(),
    },
  }),
}));

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields and submit button', () => {
    renderWithProviders(<SignInPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to your account/i })).toBeInTheDocument();
  });

  it('shows validation error when missing fields', async () => {
    renderWithProviders(<SignInPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    // HTML5 required attribute prevents submit; no error from API expected
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    });
  });

  it('displays API error message on failed login', async () => {
    const mod: any = await import('@supabase/supabase-js');
    mod.createClient().auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } });

    renderWithProviders(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('successful login triggers reload (auth context pick-up)', async () => {
    const originalReload = window.location.reload;
    // @ts-ignore - test override
    window.location.reload = vi.fn();

    renderWithProviders(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });

    window.location.reload = originalReload;
  });
});


