import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import storage from '../utils/storage';

// Конфигурация Supabase
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Проверка наличия переменных окружения
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase URL или Anon Key не заданы. Проверьте .env файл.');
}

// Инициализация Supabase клиента с платформенным storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Типы для базы данных
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          birthday: string | null;
          subscription_tier: 'free' | 'path' | 'awakening';
          role: 'user' | 'admin';
          notif_chat: boolean;
          notif_community: boolean;
          notif_articles: boolean;
          notif_comments: boolean;
          last_community_active: string;
          subscription_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          birthday?: string | null;
          subscription_tier?: 'free' | 'path' | 'awakening';
          role?: 'user' | 'admin';
          notif_chat?: boolean;
          notif_community?: boolean;
          notif_articles?: boolean;
          notif_comments?: boolean;
          last_community_active?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          birthday?: string | null;
          subscription_tier?: 'free' | 'path' | 'awakening';
          role?: 'user' | 'admin';
          notif_chat?: boolean;
          notif_community?: boolean;
          notif_articles?: boolean;
          notif_comments?: boolean;
          last_community_active?: string;
          subscription_expires_at?: string | null;
          created_at?: string;
        };
      };
      content: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'article' | 'video' | 'audio' | 'course';
          category: string;
          content_data: Record<string, unknown>;
          is_premium: boolean;
          subscription_tier: 'free' | 'path' | 'awakening';
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'article' | 'video' | 'audio' | 'course';
          category: string;
          content_data?: Record<string, unknown>;
          is_premium?: boolean;
          subscription_tier?: 'free' | 'path' | 'awakening';
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          type?: 'article' | 'video' | 'audio' | 'course';
          category?: string;
          content_data?: Record<string, unknown>;
          is_premium?: boolean;
          subscription_tier?: 'free' | 'path' | 'awakening';
          created_at?: string;
        };
      };
      user_content_progress: {
        Row: {
          user_id: string;
          content_id: string;
          progress: number;
          last_position: number;
          is_downloaded: boolean;
        };
        Insert: {
          user_id: string;
          content_id: string;
          progress?: number;
          last_position?: number;
          is_downloaded?: boolean;
        };
        Update: {
          user_id?: string;
          content_id?: string;
          progress?: number;
          last_position?: number;
          is_downloaded?: boolean;
        };
      };
      bookmarks: {
        Row: {
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          content_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          text: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          text: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          text?: string;
          parent_id?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          sender: 'user' | 'author';
          created_at: string;
          read: boolean;
          edited: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          sender?: 'user' | 'author';
          created_at?: string;
          read?: boolean;
          edited?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          sender?: 'user' | 'author';
          created_at?: string;
          read?: boolean;
          edited?: boolean;
        };
      };
      community_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          edited: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          edited?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          edited?: boolean;
          created_at?: string;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          user_id: string;
          tier: 'path' | 'awakening';
          status: 'active' | 'expired' | 'cancelled';
          expires_at: string;
        };
        Insert: {
          user_id: string;
          tier: 'path' | 'awakening';
          status?: 'active' | 'expired' | 'cancelled';
          expires_at: string;
        };
        Update: {
          user_id?: string;
          tier?: 'path' | 'awakening';
          status?: 'active' | 'expired' | 'cancelled';
          expires_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      subscription_tier: 'free' | 'path' | 'awakening';
      content_type: 'article' | 'video' | 'audio' | 'course';
      subscription_status: 'active' | 'expired' | 'cancelled';
    };
  };
};
