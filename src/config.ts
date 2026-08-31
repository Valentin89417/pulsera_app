// Конфигурация приложения
export const CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // WordPress Media Library
  WP_URL: process.env.EXPO_PUBLIC_WP_URL || '',
  WP_USER: process.env.EXPO_PUBLIC_WP_USER || '',
  WP_APP_PASSWORD: process.env.EXPO_PUBLIC_WP_APP_PASSWORD || '',
} as const;

// Базовый URL для WP REST API
export const WP_API_BASE = `${CONFIG.WP_URL}/wp-json/wp/v2`;
