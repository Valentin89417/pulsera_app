import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import storage from '../utils/storage';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useDownloadStore } from '../store/downloadStore';
import { setupNotificationListeners } from '../services/notifications';

const ONBOARDING_KEY = '@pulsera_onboarding_done';

// Корневой layout с auth и онбординг проверкой
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { initialize, user, isInitialized, isLoading, refreshProfile } = useAuthStore();
  const { colors, loadTheme } = useThemeStore();
  const { loadDownloads } = useDownloadStore();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [routerReady, setRouterReady] = useState(false);

  // Инициализация
  useEffect(() => {
    initialize();
    checkOnboarding();
    loadTheme();
    loadDownloads();
    setupNotificationListeners();
  }, []);

  // Обновление профиля при возвращении из фона (проверка подписки)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user) {
        refreshProfile();
      }
    });
    return () => subscription.remove();
  }, [user]);

  const checkOnboarding = async () => {
    try {
      const value = await storage.getItem(ONBOARDING_KEY);
      setOnboardingDone(value === 'true');
    } catch {
      setOnboardingDone(false);
    }
  };

  // Навигация — только при изменении ключевых состояний, БЕЗ segments в зависимостях
  useEffect(() => {
    if (!isInitialized || onboardingDone === null || isLoading) {
      return;
    }

    // Даём роутеру инициализироваться
    if (!routerReady) {
      setRouterReady(true);
      return;
    }

    const currentRoute = segments[0];

    // 1. Онбординг не пройден — на онбординг
    if (!onboardingDone && currentRoute !== 'onboarding') {
      router.replace('/onboarding');
      return;
    }

    // 2. Онбординг пройден, не авторизован — на логин
    if (onboardingDone && !user && currentRoute !== '(auth)') {
      router.replace('/(auth)/login');
      return;
    }

    // 3. Авторизован и на auth экране — на табы
    if (user && currentRoute === '(auth)') {
      router.replace('/(tabs)');
      return;
    }
  }, [isInitialized, user, onboardingDone, isLoading, routerReady]);

  // Загрузка
  if (!isInitialized || onboardingDone === null || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colors.statusBar} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="accountstatus"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="downloads" />
        <Stack.Screen name="help" />
      </Stack>
    </>
  );
}
