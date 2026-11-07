import { createContext } from 'react';

import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../types/database.types';

export interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);