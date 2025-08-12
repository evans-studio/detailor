"use client";
import * as React from 'react';
import { Badge } from '@/ui/badge';

export function StripeTestBadge() {
  const [isDemo, setIsDemo] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/me');
        const json = await res.json();
        setIsDemo(Boolean(json?.tenant?.is_demo));
      } catch {
        setIsDemo(null);
      }
    })();
  }, []);
  if (isDemo !== true) return null;
  return <Badge intent="info">Stripe Test Mode</Badge>;
}


