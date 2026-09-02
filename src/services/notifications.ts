import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useChatStore } from '../store/chatStore';
import { NotificationType } from '../types/user';

// Expo Push API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Время батчинга (мс)
const BATCH_DELAY = 30_000;

// Время offline в community (мс)
const COMMUNITY_OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 минут

// Кэш для модуля notifications (динамический импорт)
let NotificationsModule: typeof import('expo-notifications') | null = null;
let moduleLoadAttempted = false;

// Попытка загрузить expo-notifications (динамически, чтобы не падать в Expo Go)
const loadNotificationsModule = async (): Promise<typeof import('expo-notifications') | null> => {
  if (moduleLoadAttempted) return NotificationsModule;
  moduleLoadAttempted = true;

  try {
    // Проверяем, работаем ли мы в Expo Go (нет нативного модуля)
    const { default: Constants } = await import('expo-constants');
    const executionEnvironment = Constants?.executionEnvironment;

    if (executionEnvironment === 'storeClient') {
      // Expo Go — push не работают, возвращаем null
      console.log('[Notifications] Expo Go detected — push disabled');
      return null;
    }

    // Development build или production — загружаем модуль
    NotificationsModule = await import('expo-notifications');
    return NotificationsModule;
  } catch (error) {
    console.log('[Notifications] Module not available:', error);
    return null;
  }
};

// Буфер батчинга: ключ — recipientUserId
const batchBuffers = new Map<string, {
  notifications: Array<{ title: string; body: string; data?: Record<string, unknown> }>;
  timer: ReturnType<typeof setTimeout>;
}>();

// ============================================
// РЕГИСТРАЦИЯ ТОКЕНА
// ============================================

// Запрос разрешения и получение Expo Push токена
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) return null; // Expo Go — пропускаем

    // Проверяем разрешение
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push-уведомления не разрешены');
      return null;
    }

    // Получаем Expo Push Token
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch (error) {
    console.error('Ошибка регистрации push-уведомлений:', error);
    return null;
  }
};

// Сохранение токена в Supabase (UPSERT)
export const savePushToken = async (userId: string, token: string): Promise<void> => {
  try {
    const platform = Platform.OS === 'android' ? 'android' : 'ios';

    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, platform },
        { onConflict: 'user_id,token' }
      );

    if (error) {
      console.error('Ошибка сохранения push-токена:', error.message);
    }
  } catch (error) {
    console.error('Неожиданная ошибка при сохранении токена:', error);
  }
};

// Удаление токена при logout
export const removePushToken = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Ошибка удаления push-токена:', error.message);
    }
  } catch (error) {
    console.error('Неожиданная ошибка при удалении токена:', error);
  }
};

// ============================================
// ОТПРАВКА PUSH
// ============================================

// Получить токены для списка пользователей
export const getPushTokens = async (userIds: string[]): Promise<Array<{ user_id: string; token: string }>> => {
  if (userIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', userIds);

    if (error) {
      console.error('Ошибка получения push-токенов:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Неожиданная ошибка при получении токенов:', error);
    return [];
  }
};

// Отправка push-уведомлений через Expo Push API
export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Ошибка Expo Push API:', response.status, errorData);
    }
  } catch (error) {
    console.error('Неожиданная ошибка при отправке push:', error);
  }
};

// ============================================
// ПРОВЕРКИ ПЕРЕД ОТПРАВКОЙ
// ============================================

// Проверка: пользователь на экране чата?
const isInChat = (screenKey: string): boolean => {
  const { activeChatScreen } = useChatStore.getState();
  return activeChatScreen === screenKey;
};

// Проверка: пользователь offline в community > 5 мин?
const checkCommunityOffline = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_community_active')
      .eq('id', userId)
      .single();

    if (error || !data) return true; // Если нет данных — считаем offline

    const lastActive = new Date(data.last_community_active).getTime();
    const now = Date.now();
    return now - lastActive > COMMUNITY_OFFLINE_THRESHOLD;
  } catch {
    return true;
  }
};

// ============================================
// БАТЧИНГ
// ============================================

// Батченная отправка (с буферизацией 30 сек)
export const batchSend = async (
  targetUserId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> },
  type: NotificationType
): Promise<void> => {
  try {
    // Проверяем настройку уведомлений получателя
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`notif_${type}`)
      .eq('id', targetUserId)
      .single();

    if (error || !profile) return;

    // Проверяем: включены ли уведомления этого типа?
    if (!(profile as Record<string, unknown>)[`notif_${type}`]) return;

    // Проверяем: активен ли получатель на соответствующем экране?
    if (type === 'chat' && isInChat('chat')) return;
    if (type === 'community' && isInChat('community')) return;

    // Для community: проверяем offline > 5 мин
    if (type === 'community') {
      const isOffline = await checkCommunityOffline(targetUserId);
      if (!isOffline) return; // Пользователь активен — push не нужен
    }

    // Добавляем в буфер
    const existing = batchBuffers.get(targetUserId);

    if (existing) {
      // Обновляем буфер, перезапускаем таймер
      existing.notifications.push(notification);
      clearTimeout(existing.timer);
      existing.timer = setTimeout(() => flushBatch(targetUserId), BATCH_DELAY);
    } else {
      // Новый буфер
      batchBuffers.set(targetUserId, {
        notifications: [notification],
        timer: setTimeout(() => flushBatch(targetUserId), BATCH_DELAY),
      });
    }
  } catch (error) {
    console.error('Ошибка batchSend:', error);
  }
};

// Отправка буфера
const flushBatch = async (targetUserId: string): Promise<void> => {
  const buffer = batchBuffers.get(targetUserId);
  if (!buffer) return;

  batchBuffers.delete(targetUserId);

  // Получаем токены получателя
  const tokens = await getPushTokens([targetUserId]);
  if (tokens.length === 0) return;

  const tokenList = tokens.map((t) => t.token);

  let title: string;
  let body: string;

  if (buffer.notifications.length === 1) {
    // Одно уведомление — отправляем как есть
    title = buffer.notifications[0].title;
    body = buffer.notifications[0].body;
  } else {
    // Несколько — группируем
    title = `${buffer.notifications.length} новых уведомлений`;
    // Показываем первые 3, остальное считаем
    const previews = buffer.notifications
      .slice(0, 3)
      .map((n) => n.body)
      .join('\n');
    body = buffer.notifications.length > 3
      ? `${previews}\n...и ещё ${buffer.notifications.length - 3}`
      : previews;
  }

  await sendPushNotification(tokenList, title, body, buffer.notifications[0].data);
};

// ============================================
// ОБРАБОТКА УВЕДОМЛЕНИЙ
// ============================================

// Настройка обработчика foreground-уведомлений
export const setupNotificationListeners = async () => {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return; // Expo Go — пропускаем

  // Когда приложение открыто — показываем уведомление в-app
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

// ============================================
// ОБНОВЛЕНИЕ АКТИВНОСТИ
// ============================================

// Обновить timestamp активности в community
export const updateLastCommunityActive = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_community_active: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Ошибка обновления last_community_active:', error.message);
    }
  } catch (error) {
    console.error('Неожиданная ошибка при обновлении активности:', error);
  }
};

// ============================================
// ОТПРАВКА БЕЗ БАТЧИНГА (для статических событий)
// ============================================

// Отправить push сразу (без батча) — для новых статей
export const sendImmediatePush = async (
  targetUserIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> => {
  const tokens = await getPushTokens(targetUserIds);
  if (tokens.length === 0) return;

  const tokenList = tokens.map((t) => t.token);
  await sendPushNotification(tokenList, title, body, data);
};
