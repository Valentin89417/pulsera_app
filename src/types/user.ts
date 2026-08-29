// Типы для пользователя

import { Database } from '../services/supabase';

// Профиль пользователя из БД
export type UserProfile = Database['public']['Tables']['profiles']['Row'];

// Профиль пользователя для вставки
export type UserProfileInsert = Database['public']['Tables']['profiles']['Insert'];

// Профиль пользователя для обновления
export type UserProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Подписка пользователя
export type UserSubscription = Database['public']['Tables']['subscriptions']['Row'];

// Расширенный профиль пользователя с подпиской
export interface ExtendedUserProfile extends UserProfile {
  subscription?: UserSubscription;
  isSubscriptionActive: boolean;
}

// Данные для обновления профиля
export interface ProfileUpdateData {
  display_name?: string;
  avatar_url?: string;
}

// Настройки пользователя
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// Статистика пользователя
export interface UserStats {
  totalContent: number;
  completedContent: number;
  bookmarksCount: number;
  commentsCount: number;
}
