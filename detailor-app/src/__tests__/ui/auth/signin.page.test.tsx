import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
// Mock auth-context BEFORE importing the page to ensure hook is mocked
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: null, loading: false, isAuthenticated: false, signOut: async () => {}, refreshUser: async () => {} }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import SignInPage from '@/app/(auth)/signin/page';
import { renderWithProviders } from '../../setup/render';

// Mock next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock supabase client with shared function refs we can control per test
vi.mock('@supabase/supabase-js', () => {
  const signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null });
  const getSession = vi.fn().mockResolvedValue({ data: { session: null } });
  const onAuthStateChange = () => ({ data: { subscription: { unsubscribe: () => {} } } });
  const signOut = vi.fn();
  return {
    createClient: () => ({ auth: { signInWithPassword, getSession, onAuthStateChange, signOut } }),
    __authMocks: { signInWithPassword, getSession },
  };
});

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

  it('renders without submitting when missing fields', async () => {
    renderWithProviders(<SignInPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    // HTML5 required attribute prevents submit; ensure we still see the form
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('displays API error message on failed login', async () => {
    const mod: any = await import('@supabase/supabase-js');
    mod.__authMocks.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } });

    renderWithProviders(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('successful login triggers reload (auth context pick-up)', async () => {
    const originalLocation = window.location;
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: reloadSpy },
      writable: true,
    });

    renderWithProviders(<SignInPage />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in to your account/i }));

    await waitFor(() => {
      expect(reloadSpy).toHaveBeenCalled();
    });

    Object.defineProperty(window, 'location', { value: originalLocation });
  });
});


