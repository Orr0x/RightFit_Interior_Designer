
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  user_tier: 'guest' | 'free' | 'basic' | 'standard' | 'pro' | 'dev' | 'admin' | 'god';
}

interface AuthUser extends User {
  profile?: Profile;
  user_tier?: 'guest' | 'free' | 'basic' | 'standard' | 'pro' | 'dev' | 'admin' | 'god';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        // Set basic user immediately
        setUser(session.user as AuthUser);
        // Defer Supabase calls to avoid deadlocks inside the callback
        setTimeout(() => {
          (async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              setUser((prev) =>
                prev ? ({ 
                  ...prev, 
                  profile: profile || null,
                  user_tier: profile?.user_tier || 'free'
                } as AuthUser) : ({ 
                  ...session.user, 
                  profile: profile || null,
                  user_tier: profile?.user_tier || 'free'
                } as AuthUser)
              );
            } finally {
              setIsLoading(false);
            }
          })();
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user as AuthUser);
        (async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            setUser((prev) =>
              prev ? ({ 
                ...prev, 
                profile: profile || null,
                user_tier: profile?.user_tier || 'free'
              } as AuthUser) : ({ 
                ...session.user, 
                profile: profile || null,
                user_tier: profile?.user_tier || 'free'
              } as AuthUser)
            );
          } finally {
            setIsLoading(false);
          }
        })();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const register = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: name,
        },
      },
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
