// Типы для аутентификации

import { User, Session } from '@supabase/supabase-js';

// Состояние аутентификации
export interface AuthState {
  // Пользователь Supabase
  user: User | null;
  
  // Сессия
  session: Session | null;
  
  // Профиль пользователя из БД
  profile: UserProfile | null;
  
  // Состояние загрузки
  isLoading: boolean;
  
  // Инициализация завершена
  isInitialized: boolean;
  
  // Действия
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

// Профиль пользователя из БД
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'path' | 'awakening';
  created_at: string;
}

// Данные для регистрации
export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

// Данные для входа
export interface SignInData {
  email: string;
  password: string;
}