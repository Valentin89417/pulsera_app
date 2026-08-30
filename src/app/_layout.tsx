import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import storage from '../utils/storage';
import { useAuthStore } from '../store/authStore';

const ONBOARDING_KEY = '@pulsera_onboarding_done';

// Корневой layout с auth и онбординг проверкой
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { initialize, user, isInitialized, isLoading } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [routerReady, setRouterReady] = useState(false);

  // Инициализация
  useEffect(() => {
    initialize();
    checkOnboarding();
  }, []);

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
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="subscription"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
