import { useThemeStore } from '../store/themeStore';

// Хук для получения текущих цветов темы
export function useTheme() {
  return useThemeStore();
}
