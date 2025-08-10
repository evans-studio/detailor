"use client";
import * as React from 'react';
import { AccessDenied } from '@/components/AccessDenied';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export function RoleGuard({ allowed, children }: { allowed: Array<'admin'|'staff'|'customer'>; children: React.ReactNode }) {
  const [role, setRole] = React.useState<'admin'|'staff'|'customer'|null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profiles/me');
        const json = await res.json();
        setRole(json?.profile?.role ?? null);
      } catch {
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <LoadingSkeleton rows={4} />;
  if (!role || !allowed.includes(role)) return <AccessDenied />;
  return <>{children}</>;
}


