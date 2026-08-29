import { supabase, Database } from './supabase';

// Типы для таблиц
type Profile = Database['public']['Tables']['profiles']['Row'];
type Content = Database['public']['Tables']['content']['Row'];
type UserContentProgress = Database['public']['Tables']['user_content_progress']['Row'];
type Bookmark = Database['public']['Tables']['bookmarks']['Row'];
type Comment = Database['public']['Tables']['comments']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

// ============================================
// ПРОФИЛИ
// ============================================

// Получить профиль пользователя
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Ошибка получения профиля:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при получении профиля:', error);
    return null;
  }
};

// Обновить профиль пользователя
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления профиля:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении профиля:', error);
    return null;
  }
};

// ============================================
// КОНТЕНТ
// ============================================

// Получить список контента с фильтрацией
export const getContent = async (options?: {
  type?: Content['type'];
  category?: string;
  isPremium?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Content[]> => {
  try {
    let query = supabase.from('content').select('*');

    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.isPremium !== undefined) {
      query = query.eq('is_premium', options.isPremium);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения контента:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении контента:', error);
    return [];
  }
};

// Получить контент по ID
export const getContentById = async (contentId: string): Promise<Content | null> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) {
      console.error('Ошибка получения контента:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при получении контента:', error);
    return null;
  }
};

// ============================================
// ПРОГРЕСС ПОЛЬЗОВАТЕЛЯ
// ============================================

// Получить прогресс пользователя по контенту
export const getUserProgress = async (
  userId: string,
  contentId: string
): Promise<UserContentProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_content_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (error) {
      console.error('Ошибка получения прогресса:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при получении прогресса:', error);
    return null;
  }
};

// Обновить прогресс пользователя
export const updateUserProgress = async (
  userId: string,
  contentId: string,
  progress: number,
  lastPosition?: number
): Promise<UserContentProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('user_content_progress')
      .upsert({
        user_id: userId,
        content_id: contentId,
        progress,
        last_position: lastPosition || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления прогресса:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении прогресса:', error);
    return null;
  }
};

// ============================================
// ЗАКЛАДКИ
// ============================================

// Добавить закладку
export const addBookmark = async (userId: string, contentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, content_id: contentId });

    if (error) {
      console.error('Ошибка добавления закладки:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при добавлении закладки:', error);
    return false;
  }
};

// Удалить закладку
export const removeBookmark = async (userId: string, contentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId);

    if (error) {
      console.error('Ошибка удаления закладки:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении закладки:', error);
    return false;
  }
};

// Проверить, есть ли закладка
export const isBookmarked = async (userId: string, contentId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_id', contentId);

    if (error) {
      console.error('Ошибка проверки закладки:', error.message);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Неожиданная ошибка при проверке закладки:', error);
    return false;
  }
};

// Получить все закладки пользователя
export const getUserBookmarks = async (userId: string): Promise<Bookmark[]> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения закладок:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении закладок:', error);
    return [];
  }
};

// ============================================
// КОММЕНТАРИИ
// ============================================

// Получить комментарии к контенту
export const getContentComments = async (contentId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения комментариев:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении комментариев:', error);
    return [];
  }
};

// Добавить комментарий
export const addComment = async (
  userId: string,
  contentId: string,
  text: string,
  parentId?: string
): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        content_id: contentId,
        text,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Ошибка добавления комментария:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при добавлении комментария:', error);
    return null;
  }
};

// ============================================
// ЧАТ
// ============================================

// Получить сообщения чата
export const getChatMessages = async (userId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка получения сообщений чата:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении сообщений чата:', error);
    return [];
  }
};

// Отправить сообщение в чат
export const sendChatMessage = async (
  userId: string,
  message: string
): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, message })
      .select()
      .single();

    if (error) {
      console.error('Ошибка отправки сообщения:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при отправке сообщения:', error);
    return null;
  }
};

// ============================================
// ПОДПИСКИ
// ============================================

// Получить подписку пользователя
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Ошибка получения подписки:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при получении подписки:', error);
    return null;
  }
};

// Проверить, активна ли подписка
export const isSubscriptionActive = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return false;
    }

    return subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  } catch (error) {
    console.error('Неожиданная ошибка при проверке подписки:', error);
    return false;
  }
};