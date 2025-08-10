"use client";
import * as React from 'react';
import { api } from '@/lib/api';

export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const load = React.useCallback(async () => {
    try { setLoading(true); setError(null); setData(await fetcher()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [fetcher]);
  React.useEffect(() => { load(); }, [key, load]);
  React.useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);
  return { data, loading, error, reload: load } as const;
}

export function useMutation<TInput extends object, TOut>(
  mutate: (input: TInput) => Promise<TOut>,
  options?: { onSuccess?: (out: TOut) => void; onError?: (err: Error) => void }
) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const run = React.useCallback(async (input: TInput) => {
    try { setLoading(true); setError(null); const out = await mutate(input); options?.onSuccess?.(out); return out; }
    catch (e) { const err = e as Error; setError(err.message); options?.onError?.(err); throw err; }
    finally { setLoading(false); }
  }, [mutate, options]);
  return { mutate: run, loading, error } as const;
}

// Common fetchers
export const fetchInvoices = async () => (await api<{ ok: boolean; invoices: unknown[] }>(`/api/invoices`)).invoices;
export const fetchCustomers = async (qs = '') => (await api<{ ok: boolean; customers: unknown[] }>(`/api/customers${qs}`)).customers;
export const fetchJobs = async (qs = '') => (await api<{ ok: boolean; jobs: unknown[] }>(`/api/jobs${qs}`)).jobs;


