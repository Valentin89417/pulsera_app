// Константы приложения

// Размеры
export const SIZES = {
  // Шрифты
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,

  // Отступы
  xs4: 4,
  xs8: 8,
  sm12: 12,
  md16: 16,
  lg20: 20,
  xl24: 24,
  xxl32: 32,
  xxxl40: 40,

  // Радиусы скругления
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 9999,
};

// Типы контента
export const CONTENT_TYPES = {
  ARTICLE: 'article',
  VIDEO: 'video',
  AUDIO: 'audio',
  COURSE: 'course',
} as const;

// Категории контента
export const CONTENT_CATEGORIES = {
  MEDITATION: 'meditation',
  PRACTICE: 'practice',
  ART_THERAPY: 'art_therapy',
  SPIRITUAL: 'spiritual',
  PERSONAL: 'personal',
  COURSE: 'course',
} as const;

// Тарифы подписки
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PATH: 'path',
  AWAKENING: 'awakening',
} as const;

// Названия тарифов
export const TIER_NAMES = {
  free: 'Бесплатный',
  path: 'Путь',
  awakening: 'Пробуждение',
} as const;

// Описания тарифов
export const TIER_DESCRIPTIONS = {
  free: 'Базовый доступ к контенту',
  path: 'Все статьи, видео-медитации и аудио-практики',
  awakening: 'Всё из тарифа "Путь" + курсы + персональные разборы',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

// Лимиты
export const LIMITS = {
  CONTENT_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 50,
  CHAT_MESSAGES_PER_PAGE: 100,
  MAX_SEARCH_LENGTH: 100,
  MAX_COMMENT_LENGTH: 500,
  MAX_MESSAGE_LENGTH: 1000,
} as const;

// Время кэширования (в миллисекундах)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 минут
  MEDIUM: 30 * 60 * 1000, // 30 минут
  LONG: 60 * 60 * 1000, // 1 час
  DAY: 24 * 60 * 60 * 1000, // 1 день
} as const;