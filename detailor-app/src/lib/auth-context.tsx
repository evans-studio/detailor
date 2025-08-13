"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer' | 'super_admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const client = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }, []);

  const refreshUser = async () => {
    if (!client) return;
    
    try {
      const { data: sessionData } = await client.auth.getSession();
      const session = sessionData?.session;
      
      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      
      // Only fetch profile if we have a valid session
      const response = await fetch('/api/profiles/me', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success && data?.data) {
        setUser({
          id: data.data.id,
          email: data.data.email,
          role: data.data.role,
        });
      } else {
        // If profile fetch fails but we have a session, clear everything
        setUser(null);
        setIsAuthenticated(false);
        await client.auth.signOut();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const signOut = async () => {
    if (!client) return;
    
    await client.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/signin';
  };

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    // Initial auth state check
    refreshUser().finally(() => setLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [client]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}