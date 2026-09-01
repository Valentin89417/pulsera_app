import { supabase, Database } from './supabase';
import { CommentWithAuthor } from '../types/content';
import { deleteContentFiles } from '../utils/upload';
import { removeDownload } from '../utils/offlineCache';

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
    // Сначала пытаемся получить профиль
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Ошибка получения профиля:', error.message);
      return null;
    }

    // Если профиль есть — возвращаем
    if (data) {
      return data;
    }

    // Если профиля нет — создаём (на случай если триггер не сработал)
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select()
      .single();

    if (insertError) {
      console.error('Ошибка создания профиля:', insertError.message);
      return null;
    }

    return newProfile;
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

// Получить категории с количеством использований
export const getCategories = async (): Promise<{ name: string; count: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Ошибка получения категорий:', error.message);
      return [];
    }

    const counts = new Map<string, number>();
    for (const row of data) {
      if (row.category) {
        counts.set(row.category, (counts.get(row.category) || 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Неожиданная ошибка при получении категорий:', error);
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

// Проверить какие ID контента существуют в Supabase
export const getExistingContentIds = async (ids: string[]): Promise<Set<string>> => {
  if (ids.length === 0) return new Set();
  try {
    const { data, error } = await supabase
      .from('content')
      .select('id')
      .in('id', ids);

    if (error) {
      console.error('Ошибка проверки контента:', error.message);
      return new Set(ids); // при ошибке считаем все существующими
    }

    return new Set(data.map(c => c.id));
  } catch {
    return new Set(ids);
  }
};

// Создать контент
export const createContent = async (data: {
  title: string;
  description?: string;
  type: Content['type'];
  category: string;
  content_data?: Record<string, unknown>;
  is_premium?: boolean;
  subscription_tier?: Content['subscription_tier'];
}): Promise<Content | null> => {
  try {
    const { data: newContent, error } = await supabase
      .from('content')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания контента:', error.message);
      return null;
    }

    return newContent;
  } catch (error) {
    console.error('Неожиданная ошибка при создании контента:', error);
    return null;
  }
};

// Обновить контент
export const updateContent = async (
  contentId: string,
  updates: Partial<Pick<Content, 'title' | 'description' | 'type' | 'category' | 'content_data' | 'is_premium' | 'subscription_tier'>>
): Promise<Content | null> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .update(updates)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления контента:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении контента:', error);
    return null;
  }
};

// Удалить контент
export const deleteContent = async (contentId: string): Promise<boolean> => {
  try {
    // Получаем контент перед удалением (нужны данные о файлах)
    const { data: content, error: fetchError } = await supabase
      .from('content')
      .select('content_data')
      .eq('id', contentId)
      .single();

    if (fetchError) {
      console.error('Ошибка получения контента для удаления файлов:', fetchError.message);
    }

    // Удаляем связанные файлы из WordPress Media Library
    if (content?.content_data) {
      await deleteContentFiles(content.content_data as Record<string, unknown>);
    }

    // Удаляем запись из Supabase
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', contentId);

    if (error) {
      console.error('Ошибка удаления контента:', error.message);
      return false;
    }

    // Удаляем локальный кэш (скачанные файлы)
    await removeDownload(contentId);

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении контента:', error);
    return false;
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

// Получить комментарии к контенту (с именем автора)
export const getContentComments = async (contentId: string): Promise<CommentWithAuthor[]> => {
  try {
    // Получаем комментарии
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка получения комментариев:', error.message);
      return [];
    }

    if (!comments || comments.length === 0) return [];

    // Получаем уникальные user_id и parent_id
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const parentIds = [...new Set(comments.filter(c => c.parent_id).map(c => c.parent_id!))];

    // Получаем профили авторов
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    // Получаем родительские комментарии
    const { data: parentComments } = parentIds.length > 0
      ? await supabase
          .from('comments')
          .select('id, text')
          .in('id', parentIds)
      : { data: [] };

    // Создаём мапы
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const parentsMap = new Map(parentComments?.map(c => [c.id, c]) || []);

    // Объединяем данные
    return comments.map(comment => ({
      ...comment,
      profiles: profilesMap.get(comment.user_id) || null,
      parent_text: comment.parent_id ? parentsMap.get(comment.parent_id)?.text || null : null,
    })) as CommentWithAuthor[];
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
// КОММЕНТАРИИ (АДМИН)
// ============================================

// Тип комментария с автором и названием контента
export interface AdminComment {
  id: string;
  user_id: string;
  content_id: string;
  text: string;
  parent_id: string | null;
  created_at: string;
  author_name: string | null;
  content_title: string | null;
  content_type: string | null;
}

// Получить все комментарии (для админа)
export const getAllComments = async (): Promise<AdminComment[]> => {
  try {
    // Получаем все комментарии
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения комментариев:', error.message);
      return [];
    }

    if (!comments || comments.length === 0) return [];

    // Получаем уникальные user_id и content_id
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const contentIds = [...new Set(comments.map(c => c.content_id))];

    // Получаем профили авторов
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    // Получаем контент
    const { data: contents } = await supabase
      .from('content')
      .select('id, title, type')
      .in('id', contentIds);

    // Создаём мапы
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const contentsMap = new Map(contents?.map(c => [c.id, c]) || []);

    // Объединяем данные
    return comments.map(comment => ({
      ...comment,
      author_name: profilesMap.get(comment.user_id)?.display_name || null,
      content_title: contentsMap.get(comment.content_id)?.title || null,
      content_type: contentsMap.get(comment.content_id)?.type || null,
    }));
  } catch (error) {
    console.error('Неожиданная ошибка при получении комментариев:', error);
    return [];
  }
};

// Удалить комментарий (для админа)
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Ошибка удаления комментария:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении комментария:', error);
    return false;
  }
};

// Обновить комментарий
export const updateComment = async (commentId: string, text: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ text })
      .eq('id', commentId);

    if (error) {
      console.error('Ошибка обновления комментария:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении комментария:', error);
    return false;
  }
};

// ============================================
// ЧАТ
// ============================================

// Получить сообщения чата пользователя
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
  message: string,
  sender: 'user' | 'author' = 'user'
): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, message, sender })
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

// Редактировать сообщение
export const editChatMessage = async (messageId: string, newMessage: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ message: newMessage, edited: true })
      .eq('id', messageId);

    if (error) {
      console.error('Ошибка редактирования сообщения:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при редактировании:', error);
    return false;
  }
};

// Удалить сообщение
export const deleteChatMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Ошибка удаления сообщения:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении:', error);
    return false;
  }
};

// Тип: пользователь чата с последним сообщением (для админа)
export interface AdminChatUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Получить список пользователей чата (для админа)
export const getAdminChatUsers = async (): Promise<AdminChatUser[]> => {
  try {
    // Получаем все уникальные user_id из чата
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .order('created_at', { ascending: false });

    if (chatError) {
      console.error('Ошибка получения пользователей чата:', chatError.message);
      return [];
    }

    if (!chatData || chatData.length === 0) return [];

    const uniqueUserIds = [...new Set(chatData.map(c => c.user_id))];

    // Получаем профили
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', uniqueUserIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Для каждого пользователя получаем последнее сообщение и непрочитанные
    const result: AdminChatUser[] = [];

    for (const userId of uniqueUserIds) {
      // Последнее сообщение
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('message, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Непрочитанные сообщения (от пользователя, которые автор ещё не видел)
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('sender', 'user')
        .eq('read', false);

      const profile = profilesMap.get(userId);
      result.push({
        user_id: userId,
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        last_message: lastMsg?.message || '',
        last_message_at: lastMsg?.created_at || '',
        unread_count: count || 0,
      });
    }

    // Сортируем по дате последнего сообщения
    result.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    return result;
  } catch (error) {
    console.error('Неожиданная ошибка при получении пользователей чата:', error);
    return [];
  }
};

// Получить сообщения чата для админа (все сообщения диалога)
export const getAdminChatMessages = async (userId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка получения сообщений чата (админ):', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении сообщений чата (админ):', error);
    return [];
  }
};

// Отметить сообщения пользователя как прочитанные
export const markChatAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('sender', 'user')
      .eq('read', false);

    if (error) {
      console.error('Ошибка отметки сообщений как прочитанных:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при отметке сообщений:', error);
    return false;
  }
};

// Пользователь отмечает сообщения автора как прочитанные
export const markAuthorMessagesAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('sender', 'author')
      .eq('read', false);

    if (error) {
      console.error('Ошибка отметки сообщений автора как прочитанных:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при отметке сообщений автора:', error);
    return false;
  }
};

// Удалить чат с пользователем (все сообщения)
export const deleteChat = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка удаления чата:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении чата:', error);
    return false;
  }
};

// ============================================
// СТАТЬИ ДЛЯ АВТОДОПОЛНЕНИЯ @ В ЧАТЕ
// ============================================

// Тип статьи для автодополнения
export interface ArticleMention {
  id: string;
  title: string;
  type: Content['type'];
}

// Получить последние N статей для автодополнения
export const getPopularArticles = async (limit: number = 5): Promise<ArticleMention[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('id, title, type')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Ошибка получения статей:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении статей:', error);
    return [];
  }
};

// Поиск статей по началу названия
export const searchArticles = async (query: string): Promise<ArticleMention[]> => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('id, title, type')
      .ilike('title', `${query}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Ошибка поиска статей:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при поиске статей:', error);
    return [];
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

// ============================================
// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (АДМИН)
// ============================================

// Тип: пользователь для админ-панели
export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  subscription_tier: string | null;
  created_at: string | null;
}

// Получить всех пользователей (для админа)
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    // Получаем все профили
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения пользователей:', error.message);
      return [];
    }

    if (!profiles || profiles.length === 0) return [];

    return profiles.map(p => ({
      id: p.id,
      email: null, // email хранится в auth.users, не в profiles
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      role: p.role,
      subscription_tier: p.subscription_tier,
      created_at: p.created_at,
    }));
  } catch (error) {
    console.error('Неожиданная ошибка при получении пользователей:', error);
    return [];
  }
};

// Обновить роль пользователя (admin/user)
export const updateUserRole = async (
  userId: string,
  role: 'admin' | 'user'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Ошибка обновления роли:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении роли:', error);
    return false;
  }
};

// Обновить подписку пользователя
export const updateUserSubscription = async (
  userId: string,
  tier: 'free' | 'path' | 'awakening'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', userId);

    if (error) {
      console.error('Ошибка обновления подписки:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении подписки:', error);
    return false;
  }
};

// ============================================
// ЭКСПОРТ ЧАТА В MARKDOWN
// ============================================

// Форматирование даты для экспорта: [DD.MM.YYYY HH:MM]
const formatDateForExport = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Обработка ссылок на статьи в тексте для экспорта
const formatMessageForExport = (text: string): string => {
  // Заменяем [{title|uuid}] на «Название статьи»
  return text.replace(/\[\{([^\]|]+)\|([a-f0-9-]+)\}\]/g, '«$1»');
};

// Получить имя текущего пользователя (автора/админа)
const getCurrentUserName = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Автор';

    const profile = await getProfile(user.id);
    return profile?.display_name || 'Автор';
  } catch {
    return 'Автор';
  }
};

// Генерация Markdown содержимого чата
export const exportChatToMarkdown = async (userId: string): Promise<string | null> => {
  try {
    const [messages, userProfile, authorName] = await Promise.all([
      getAdminChatMessages(userId),
      getProfile(userId),
      getCurrentUserName(),
    ]);

    const userName = userProfile?.display_name || 'Пользователь';
    const now = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let md = `### Чат с ${userName}\n`;
    md += `*Экспортировано: ${now}*\n\n`;
    md += `---\n\n`;

    for (const msg of messages) {
      const senderName = msg.sender === 'author' ? authorName : userName;
      const date = formatDateForExport(msg.created_at);
      const text = formatMessageForExport(msg.message);
      const edited = msg.edited ? ' *(ред.)*' : '';

      md += `**[${date}] ${senderName}:**\n`;
      md += `${text}${edited}\n\n`;
    }

    return md;
  } catch (error) {
    console.error('Ошибка экспорта чата:', error);
    return null;
  }
};

// Шаринг чата как .md файл
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const shareChatAsMarkdown = async (userId: string, userName: string): Promise<boolean> => {
  try {
    const mdContent = await exportChatToMarkdown(userId);
    if (!mdContent) return false;

    // Безопасное имя файла
    const safeName = (userName || 'user').replace(/[^a-zA-Zа-яА-Я0-9]/g, '_').slice(0, 30);
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `chat_${safeName}_${timestamp}.md`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    // Записываем во временную папку
    await FileSystem.writeAsStringAsync(filePath, mdContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Проверяем доступность шаринга
    if (!(await Sharing.isAvailableAsync())) {
      console.error('Шаринг недоступен на этом устройстве');
      return false;
    }

    // Шарим файл
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/markdown',
      dialogTitle: `Экспорт чата с ${userName}`,
      UTI: 'net.daringfireball.markdown',
    });

    return true;
  } catch (error) {
    console.error('Ошибка шаринга чата:', error);
    return false;
  }
};