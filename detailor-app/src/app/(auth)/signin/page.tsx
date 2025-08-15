"use client";
import * as React from 'react';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'staff') {
        router.push('/admin/dashboard');
      } else if (user.role === 'customer') {
        router.push('/customer/dashboard');
      }
    }
  }, [user, loading, isAuthenticated, router]);
  
  const client = React.useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Trim and normalize email
      const normalizedEmail = email.toLowerCase().trim();
      
      const res = await client.auth.signInWithPassword({ 
        email: normalizedEmail, 
        password 
      });
      
      if (res.error) {
        // Provide more helpful error messages
        let errorMessage = res.error.message;
        
        if (res.error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (res.error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (res.error.message.includes('Too many requests')) {
          errorMessage = 'Too many failed attempts. Please wait a few minutes and try again.';
        }
        
        setError(errorMessage);
        
        // Log additional debug info in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth error:', res.error);
          console.log('Attempting with email:', normalizedEmail);
        }
        
        return;
      }

      // Success: set secure httpOnly cookies for server-side APIs and middleware
      try {
        const token = res.data.session?.access_token;
        if (token) {
          await fetch('/api/session/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: token })
          });
        }
      } catch {}

      // Let the auth context update and route accordingly
      window.location.reload();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Debug function for development
  async function debugAccount() {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const res = await fetch('/api/dev/auth-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      });
      const data = await res.json();
      setDebugInfo(data.debug);
      setShowDebug(true);
    } catch (e) {
      console.error('Debug failed:', e);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 brand-gradient-primary opacity-90"></div>
        
        {/* Overlay Pattern */}
        <div className="absolute inset-0 brand-gradient-subtle"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-[var(--color-inverse-text)]">
          {/* Logo */}
          <div className="mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center glass-effect">
                <svg className="w-6 h-6 text-[var(--color-inverse-text)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.11L19.53 8L12 11.89L4.47 8L12 4.11ZM4 9.53L11 13.42V20.47L4 16.58V9.53ZM13 20.47V13.42L20 9.53V16.58L13 20.47Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Detailor</h1>
                <p className="text-[var(--color-inverse-text)]/80 text-sm">Premium Business Management</p>
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Manage your detailing business with confidence
              </h2>
              <p className="text-xl text-[var(--color-inverse-text)]/90 leading-relaxed">
                Join 500+ UK detailing businesses using Detailor to streamline bookings, 
                manage customers, and grow their revenue.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center text-[var(--color-success-foreground)]">
                  <svg className="w-3 h-3 text-[var(--color-success-foreground)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[var(--color-inverse-text)]/90">Online booking & scheduling</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center text-[var(--color-success-foreground)]">
                  <svg className="w-3 h-3 text-[var(--color-success-foreground)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[var(--color-inverse-text)]/90">Customer management & invoicing</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center text-[var(--color-success-foreground)]">
                  <svg className="w-3 h-3 text-[var(--color-success-foreground)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[var(--color-inverse-text)]/90">Automated SMS & email notifications</span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-[var(--color-success)] rounded-full flex items-center justify-center text-[var(--color-success-foreground)]">
                  <svg className="w-3 h-3 text-[var(--color-success-foreground)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-[var(--color-inverse-text)]/90">Business analytics & reporting</span>
              </div>
            </div>

            {/* Testimonial */}
            <div className="glass-effect rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <img src="/api/placeholder/48/48" alt="Customer" className="w-12 h-12 rounded-full glass-effect" />
                <div>
                  <p className="text-[var(--color-inverse-text)]/90 italic mb-2">
                    "Detailor transformed our business. We've increased bookings by 40% and reduced admin time by 60%."
                  </p>
                  <p className="text-[var(--color-inverse-text)]/70 text-sm">
                    <span className="font-medium">James Wilson</span> - Premium Auto Detail
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-[var(--color-primary-foreground)]">
                <svg className="w-6 h-6 text-[var(--color-primary-foreground)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.11L19.53 8L12 11.89L4.47 8L12 4.11ZM4 9.53L11 13.42V20.47L4 16.58V9.53ZM13 20.47V13.42L20 9.53V16.58L13 20.47Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text)]">Detailor</h1>
                <p className="text-[var(--color-text-secondary)] text-sm">Business Management</p>
              </div>
            </div>
          </div>

          {/* Sign In Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              Welcome back
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Sign in to your Detailor account to continue managing your business.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-[var(--color-error-50)] border border-[var(--color-error-100)] rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-[var(--color-error-600)] text-sm">{error}</p>
                    {process.env.NODE_ENV === 'development' && email && (
                      <button
                        type="button"
                        onClick={debugAccount}
                        className="mt-2 text-xs text-[var(--color-error)] underline"
                      >
                        Debug Account Info
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Debug Info Panel (Development Only) */}
            {process.env.NODE_ENV === 'development' && showDebug && debugInfo && (
              <div className="bg-[var(--color-warning-50)] border border-[var(--color-warning-100)] rounded-lg p-4 text-xs">
                <h4 className="font-semibold text-[var(--color-warning-600)] mb-2">Debug Information:</h4>
                <div className="space-y-1 text-[var(--color-warning-600)]">
                  <div><strong>Email:</strong> {debugInfo.email}</div>
                  <div><strong>User Exists:</strong> {debugInfo.userExists ? 'Yes' : 'No'}</div>
                  {debugInfo.userExists && (
                    <>
                      <div><strong>Email Confirmed:</strong> {debugInfo.emailConfirmed ? 'Yes' : 'No'}</div>
                      <div><strong>User ID:</strong> {debugInfo.userId}</div>
                      <div><strong>Last Sign In:</strong> {debugInfo.lastSignIn || 'Never'}</div>
                      <div><strong>Role:</strong> {debugInfo.profile?.role || 'No profile'}</div>
                    </>
                  )}
                  <div><strong>Supabase URL:</strong> {debugInfo.supabaseUrl}</div>
                  <div><strong>Total Users:</strong> {debugInfo.totalUsers}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDebug(false)}
                  className="mt-2 text-[var(--color-warning-600)] underline"
                >
                  Close Debug
                </button>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Email address
              </label>
              <Input 
                id="email"
                type="email" 
                placeholder="Enter your email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 px-4 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Password
              </label>
              <Input 
                id="password"
                type="password" 
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 px-4 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-colors"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-[var(--color-border)] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--color-text)]">
                  Remember me
                </label>
              </div>

              <Link href="/reset-password" className="text-sm text-[var(--color-primary)] font-medium">
                Forgot your password?
              </Link>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              intent="primary"
              className="w-full h-12"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--color-primary-foreground)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in to your account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[var(--color-text-secondary)] text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[var(--color-primary)] font-medium">
                Start your free trial
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-center space-x-6 text-[var(--color-text-muted)]">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


