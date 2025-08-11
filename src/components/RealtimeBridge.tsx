"use client";
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wireRealtimeInvalidations } from '@/lib/realtime';

export function RealtimeBridge() {
  const queryClient = useQueryClient();
  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const res = await fetch('/api/tenant/me');
        const json = await res.json();
        const tenantId = json?.tenant?.id as string | undefined;
        if (tenantId) {
          unsub = wireRealtimeInvalidations(tenantId, queryClient);
        }
      } catch {
        // ignore
      }
    })();
    return () => { try { unsub?.(); } catch {} };
  }, [queryClient]);
  return null;
}


