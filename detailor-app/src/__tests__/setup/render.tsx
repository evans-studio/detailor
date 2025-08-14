import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock the auth context by default; tests can override via vi.mock
// Provide a no-op AuthProvider to avoid side effects
vi.mock('@/lib/auth-context', () => {
  return {
    useAuth: () => ({ user: null, loading: false, isAuthenticated: false, signOut: async () => {}, refreshUser: async () => {} }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

type RenderOptions = {
  queryClient?: QueryClient;
};

export function renderWithProviders(ui: React.ReactElement, options: RenderOptions = {}) {
  const queryClient = options.queryClient || new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper as React.ComponentType });
}


