"use client";
import * as React from 'react';
import { AccessDenied } from '@/components/AccessDenied';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { useAuth } from '@/lib/auth-context';

export function RoleGuard({ allowed, children }: { allowed: Array<'admin'|'staff'|'customer'|'super_admin'>; children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <LoadingSkeleton rows={4} />;
  if (!isAuthenticated || !user || !allowed.includes(user.role)) return <AccessDenied />;
  return <>{children}</>;
}


