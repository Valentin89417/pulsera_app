import { create } from 'zustand';
import storage from '../utils/storage';
import { ThemeColors, darkColors, lightColors } from '../utils/themeColors';

const THEME_KEY = '@pulsera_theme';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightColors,

  setTheme: (mode: ThemeMode) => {
    const colors = mode === 'dark' ? darkColors : lightColors;
    set({ mode, colors });
    storage.setItem(THEME_KEY, mode);
  },

  toggleTheme: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  loadTheme: async () => {
    try {
      const saved = await storage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') {
        const colors = saved === 'dark' ? darkColors : lightColors;
        set({ mode: saved, colors });
      }
    } catch {
      // Используем тему по умолчанию (dark)
    }
  },
}));
