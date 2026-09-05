import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getProfile } from '../services/api';
import { registerForPushNotifications, savePushToken, removePushToken } from '../services/notifications';
import { AuthState, UserProfile } from '../types';

// Регистрация push-токена для текущего пользователя
const registerPushToken = async (userId: string) => {
  try {
    const token = await registerForPushNotifications();
    if (token) {
      await savePushToken(userId, token);
    }
  } catch (error) {
    console.error('Ошибка регистрации push-токена:', error);
  }
};

// Создание Zustand store для аутентификации
export const useAuthStore = create<AuthState>((set, get) => ({
  // Начальное состояние
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  // Инициализация аутентификации
  initialize: async () => {
    try {
      // Получаем текущую сессию
      const { data: { session } } = await supabase.auth.getSession();
      
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });

      // Если есть пользователь, загружаем профиль и регистрируем токен
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        set({ profile });
        registerPushToken(session.user.id);
      }

      // Слушаем изменения аутентификации
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
        
        set({
          session,
          user: currentUser,
        });

        // Загружаем профиль при входе
        if (currentUser) {
          const profile = await getProfile(currentUser.id);
          set({ profile });
          registerPushToken(currentUser.id);
        } else {
          set({ profile: null });
        }
      });

      set({ isInitialized: true });
    } catch (error) {
      console.error('Ошибка инициализации аутентификации:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  // Регистрация
  signUp: async (email, password, displayName) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // Если пользователь создан, загружаем профиль и регистрируем токен
      if (data.user) {
        const profile = await getProfile(data.user.id);
        set({ profile });
        registerPushToken(data.user.id);
      }

      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error: 'Неожиданная ошибка при регистрации' };
    }
  },

  // Вход
  signIn: async (email, password) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false });
        return { error: error.message };
      }

      // Загружаем профиль и регистрируем токен
      if (data.user) {
        const profile = await getProfile(data.user.id);
        set({ profile });
        registerPushToken(data.user.id);
      }

      set({ isLoading: false });
      return { error: null };
    } catch (error) {
      set({ isLoading: false });
      return { error: 'Неожиданная ошибка при входе' };
    }
  },

  // Выход
  signOut: async () => {
    try {
      const { user } = get();
      if (user) {
        await removePushToken(user.id);
      }
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        profile: null,
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  },

  // Сброс пароля
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pulsera://reset-password',
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Неожиданная ошибка при сбросе пароля' };
    }
  },

  // Обновление профиля
  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) {
        return { error: 'Пользователь не авторизован' };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        return { error: error.message };
      }

      // Обновляем профиль в store
      const updatedProfile = await getProfile(user.id);
      set({ profile: updatedProfile });

      return { error: null };
    } catch (error) {
      return { error: 'Неожиданная ошибка при обновлении профиля' };
    }
  },

  // Обновление профиля при возвращении из фона
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await getProfile(user.id);
      set({ profile });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
    }
  },
}));