// Палитры цветов для светлой и тёмной тем
// Светлая тема основана на дизайне pulsera.ru

export type ThemeColors = {
  // Основные
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryLight: string;
  onPrimary: string;
  gold: string;
  copper: string;
  cardBorder: string;
  cardIconBg: string;
  cardIconColor: string;
  inputBg: string;

  // Текст
  text: string;
  textSecondary: string;
  textMuted: string;

  // Границы
  border: string;
  borderLight: string;

  // Статусные
  success: string;
  error: string;

  // Альфа-варианты (для полупрозрачных элементов)
  primaryAlpha10: string;
  primaryAlpha13: string;
  primaryAlpha20: string;
  primaryAlpha27: string;
  surfaceAlpha98: string;
  overlay: string;
  whiteAlpha60: string;
  whiteAlpha70: string;

  // Специфичные
  placeholder: string;
  statusBar: 'light' | 'dark';
};

// Тёмная тема (текущая)
export const darkColors: ThemeColors = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#1f2b47',
  primary: '#6c63ff',
  primaryLight: '#8b83ff',
  onPrimary: '#ffffff',
  gold: '#ffc107',
  copper: '#a5593b',
  cardBorder: '#333333',
  cardIconBg: '#1a1a2e',
  cardIconColor: '#6c63ff',
  inputBg: '#16213e',

  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',

  border: '#333333',
  borderLight: '#444444',

  success: '#4caf50',
  error: '#ff4444',

  primaryAlpha10: 'rgba(108, 99, 255, 0.1)',
  primaryAlpha13: 'rgba(108, 99, 255, 0.13)',
  primaryAlpha20: 'rgba(108, 99, 255, 0.2)',
  primaryAlpha27: 'rgba(108, 99, 255, 0.27)',
  surfaceAlpha98: 'rgba(22, 33, 62, 0.98)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  whiteAlpha60: 'rgba(255, 255, 255, 0.6)',
  whiteAlpha70: 'rgba(255, 255, 255, 0.7)',

  placeholder: '#666666',
  statusBar: 'light',
};

// Светлая тема (pulsera.ru)
export const lightColors: ThemeColors = {
  background: '#fffee0',
  surface: '#ffffff',
  surfaceLight: '#f5f0dc',
  primary: '#014960',
  primaryLight: '#015b78',
  onPrimary: '#fbf9d5',
  gold: '#fcb900',
  copper: '#a5593b',
  cardBorder: '#a5593b',
  cardIconBg: '#a5593b',
  cardIconColor: '#fbf9d5',
  inputBg: '#fffee0',

  text: '#10242b',
  textSecondary: '#4d4d4d',
  textMuted: '#a5593b',

  border: '#e0d5c0',
  borderLight: '#ebe4d4',

  success: '#4caf50',
  error: '#ff4444',

  primaryAlpha10: 'rgba(1, 73, 96, 0.1)',
  primaryAlpha13: 'rgba(1, 73, 96, 0.13)',
  primaryAlpha20: 'rgba(1, 73, 96, 0.2)',
  primaryAlpha27: 'rgba(1, 73, 96, 0.27)',
  surfaceAlpha98: 'rgba(255, 255, 255, 0.98)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  whiteAlpha60: 'rgba(16, 36, 43, 0.6)',
  whiteAlpha70: 'rgba(16, 36, 43, 0.7)',

  placeholder: '#888888',
  statusBar: 'dark',
};
