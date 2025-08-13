"use client";
import * as React from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Card } from '@/ui/card';

interface WelcomeHandoffProps {
  email: string | null;
}

interface AuthState {
  access_token?: string;
}

export function WelcomeHandoff({ email }: WelcomeHandoffProps) {
  const supabase = React.useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = React.useState<AuthState | null>(null);
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const s = await supabase.auth.getSession();
      setSession(s.data.session ? { access_token: s.data.session.access_token } : null);
      setLoading(false);
    })();
  }, [supabase]);

  const persistSession = React.useCallback(async (retries = 3): Promise<boolean> => {
    try {
      // Force-refresh auth state to pick up any server-set cookies
      await supabase.auth.getSession();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      if (!token) {
        console.warn('[WelcomeHandoff] No access token found');
        return false;
      }

      // Set session with retry logic
      const res = await fetch('/api/session/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ access_token: token })
      });

      if (!res.ok) {
        console.warn('[WelcomeHandoff] Session set failed:', res.status);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return persistSession(retries - 1);
        }
        return false;
      }

      // Verify cookie by calling an authenticated endpoint
      const me = await fetch('/api/profiles/me', { credentials: 'include' });
      if (!me.ok) {
        console.warn('[WelcomeHandoff] Profile verification failed:', me.status);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return persistSession(retries - 1);
        }
        return false;
      }

      console.log('[WelcomeHandoff] Session persisted successfully');
      return true;
    } catch (error) {
      console.error('[WelcomeHandoff] Session persistence error:', error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return persistSession(retries - 1);
      }
      return false;
    }
  }, [supabase]);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!email) {
        setError('Missing email from checkout session. Please contact support.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match');
        return;
      }

      const res = await supabase.auth.signUp({ email, password });
      if (res.error) {
        // Handle specific Supabase errors
        if (res.error.message.includes('already registered')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else {
          setError(`Account creation failed: ${res.error.message}`);
        }
        return;
      }

      // Try to persist session with retries
      const ok = await persistSession();
      if (ok) {
        window.location.href = '/onboarding';
      } else {
        setError('Account created but session setup failed. Please try refreshing the page.');
      }
    } catch (error) {
      console.error('[WelcomeHandoff] Account creation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => { 
    if (session) { 
      void persistSession(); 
    } 
  }, [session, persistSession]);

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
        <span className="ml-3 text-[var(--color-text-muted)]">Setting up your account...</span>
      </div>
    );
  }

  // Enhanced signed-in state
  if (session) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
              Welcome Back!
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm">
              Ready to set up your Detailor workspace and start accepting bookings.
            </p>
          </div>
        <Button
          onClick={async () => {
            setSubmitting(true);
            const ok = await persistSession();
            if (ok) {
              window.location.href = '/onboarding';
            } else {
              setError('Session setup failed. Please refresh and try again.');
              setSubmitting(false);
            }
          }}
          disabled={submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Setting up workspace...
            </>
          ) : (
            'Continue to Setup →'
          )}
        </Button>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="p-6 space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text)] mb-2">
            Create Your Account
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Set up your password to access your Detailor workspace
          </p>
        </div>

      <form onSubmit={createAccount} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Email Address
          </label>
          <Input
            value={email ?? ''}
            readOnly
            className="bg-[var(--color-muted)] cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Create Password
          </label>
          <Input
            type="password"
            placeholder="Enter a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
            minLength={8}
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Minimum 8 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
            Confirm Password
          </label>
          <Input
            type="password"
            placeholder="Confirm your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting || !password || !confirm}
          className="w-full"
          size="lg"
        >
          {submitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Creating Account...
            </>
          ) : (
            'Create Account & Continue →'
          )}
        </Button>
      </form>

      <div className="space-y-4 mt-6">
        <Button
          type="button"
          intent="ghost"
          size="lg"
          className="w-full"
          onClick={async () => {
            if (!email) { 
              setError('Missing email from checkout session'); 
              return; 
            }
            
            setSubmitting(true);
            setError(null);
            
            try {
              const sid = new URLSearchParams(window.location.search).get('session_id');
              const boot = await fetch('/api/session/bootstrap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sid })
              });
              const bj = await boot.json();
              
              if (!bj.ok) { 
                setError(bj.error || 'Failed to initialize session'); 
                return; 
              }
              
              if (bj.access_token) {
                await fetch('/api/session/set', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ access_token: bj.access_token })
                });
                
                // Refresh supabase client state
                await supabase.auth.getSession();
                window.location.href = '/onboarding';
                return;
              }
              
              setError('Account exists. Please sign in to continue.');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Checking account...
            </>
          ) : (
            'I already have an account'
          )}
        </Button>

        <div className="text-center text-sm text-[var(--color-text-muted)]">
          Need help? <a className="text-[var(--color-primary)] hover:underline" href="/signin">Sign in here</a>
        </div>
      </div>
      </div>
    </Card>
  );
}


