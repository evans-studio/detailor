"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('admin' | 'staff' | 'customer' | 'super_admin')[];
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles,
  redirectTo = '/signin' 
}: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // If specific roles are required but user doesn't have permission
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect based on user role
      if (user.role === 'customer') {
        router.push('/customer/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
      return;
    }
  }, [user, loading, isAuthenticated, requireAuth, allowedRoles, router, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSkeleton rows={3} />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If specific roles are required but user doesn't have permission, don't render children
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}