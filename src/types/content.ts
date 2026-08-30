// Типы для контента

import { Database } from '../services/supabase';

// Тип контента из БД
export type ContentItem = Database['public']['Tables']['content']['Row'];

// Тип контента для вставки
export type ContentInsert = Database['public']['Tables']['content']['Insert'];

// Тип контента для обновления
export type ContentUpdate = Database['public']['Tables']['content']['Update'];

// Типы контента
export type ContentType = 'article' | 'video' | 'audio' | 'course';

// Категории контента
export type ContentCategory = 
  | 'meditation'
  | 'practice'
  | 'art_therapy'
  | 'spiritual'
  | 'personal'
  | 'course';

// Тарифы подписки
export type SubscriptionTier = 'free' | 'path' | 'awakening';

// Прогресс пользователя
export type UserProgress = Database['public']['Tables']['user_content_progress']['Row'];

// Закладка
export type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

// Комментарий
export type Comment = Database['public']['Tables']['comments']['Row'];

// Комментарий с именем автора
export interface CommentWithAuthor extends Comment {
  profiles: { display_name: string | null } | null;
  parent_text?: string | null; // Текст родительского комментария (для ответов)
}

// Параметры фильтрации контента
export interface ContentFilter {
  type?: ContentType;
  category?: ContentCategory;
  isPremium?: boolean;
  searchQuery?: string;
}

// Параметры пагинации
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// Ответ API с пагинацией
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}