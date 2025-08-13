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

  async function setPasswordForExistingUser(e: React.FormEvent) {
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

      // Get session_id from URL for additional security verification
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      console.log('[WelcomeHandoff] Setting password for existing user:', email);

      // Use our new API endpoint to update the existing user's password
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          session_id: sessionId 
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error('[WelcomeHandoff] Password set failed:', data?.error);
        setError(data?.error?.message || 'Failed to set password. Please try again.');
        return;
      }

      console.log('[WelcomeHandoff] Password set successfully, attempting sign in');

      // Password set successfully, now sign in with the new password
      const signInRes = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (signInRes.error) {
        console.error('[WelcomeHandoff] Sign in failed after password set:', signInRes.error);
        // Password was set but sign in failed - redirect to normal sign in page
        setError('Password set successfully! Please use the sign-in page to access your account.');
        setTimeout(() => {
          window.location.href = '/signin';
        }, 2000);
        return;
      }

      if (!signInRes.data.session) {
        console.warn('[WelcomeHandoff] No session after successful sign in');
        setError('Password set successfully! Please check your email to confirm your account, then sign in.');
        return;
      }

      console.log('[WelcomeHandoff] Sign in successful, setting up session');

      // Sign in successful, set up the session
      const ok = await persistSession();
      if (ok) {
        console.log('[WelcomeHandoff] Session persisted, redirecting to onboarding');
        window.location.href = '/onboarding';
      } else {
        setError('Password set and signed in successfully, but session setup failed. Please try signing in again.');
      }

    } catch (error) {
      console.error('[WelcomeHandoff] Password set error:', error);
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
            Set Your Password
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Your account was created after payment. Set your password to access your Detailor workspace.
          </p>
        </div>

      <form onSubmit={setPasswordForExistingUser} className="space-y-4">
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
              Setting Password...
            </>
          ) : (
            'Set Password & Continue →'
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
              console.log('[WelcomeHandoff] Attempting bootstrap for existing account');
              
              const boot = await fetch('/api/session/bootstrap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sid })
              });
              const bj = await boot.json();
              
              console.log('[WelcomeHandoff] Bootstrap response:', bj);
              
              if (!boot.ok || !bj.success) {
                // Handle specific error codes with user-friendly messages
                const code = bj?.error?.details?.code || bj?.error?.code;
                switch (code) {
                  case 'SETUP_PENDING':
                    setError('Your account is still being set up after payment. Please wait a moment and try again.');
                    break;
                  case 'MISSING_TENANT':
                    setError('Account setup incomplete. Please contact support for assistance.');
                    break;
                  case 'UNEXPECTED_STATE':
                    setError('Unexpected account state. Please contact support.');
                    break;
                  default:
                    setError(bj?.error?.message || 'Failed to access your account');
                }
                return;
              }
              
              if (bj.data?.complete) {
                // User has complete setup - redirect to normal login
                console.log('[WelcomeHandoff] Account fully set up - redirecting to sign in');
                setError('Your account is fully set up! Please use the sign-in page to access your account.');
                // Could redirect to signin page here
                window.location.href = '/signin';
                return;
              }
              
              if (bj.data?.exists && bj.data?.needsSetup) {
                setError(bj.data?.message || 'Your account setup is in progress. Please try again in a few moments.');
              } else if (bj.data?.exists) {
                setError('Account exists. Please use the sign-in page or try password reset if needed.');
              } else {
                setError('Unable to access your account. Please try creating a new account below or contact support.');
              }
            } catch (e) {
              console.error('[WelcomeHandoff] Bootstrap error:', e);
              setError('Connection failed. Please check your internet connection and try again.');
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


