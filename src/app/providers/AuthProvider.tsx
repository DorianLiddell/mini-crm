import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type { User } from '@supabase/supabase-js';

import { supabase } from '../../services/supabase/client';
import {
  getProfile,
  signIn,
  signOut,
} from '../../services/auth/authService';

import type { Profile } from '../../types/database.types';

import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      setError(null);

      const userProfile = await getProfile(userId);

      setProfile(userProfile);
    } catch {
      setProfile(null);
      setError('Не удалось загрузить профиль пользователя');
    }
  }, []);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setProfile(null);
      setError(null);

      if (currentUser) {
        void Promise.resolve().then(async () => {
          if (!active) return;

          await loadProfile(currentUser.id);

          if (active) {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await signOut();

      setUser(null);
      setProfile(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
