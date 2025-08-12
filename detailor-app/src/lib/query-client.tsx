"use client";
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let client: QueryClient | null = null;

function getClient() {
  if (client) return client;
  client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
  return client;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = React.useMemo(() => getClient(), []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}


