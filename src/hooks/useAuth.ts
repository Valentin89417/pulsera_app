import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

// Хук для проверки аутентификации
export const useAuth = () => {
  const { user, session, profile, isLoading, isInitialized, initialize } = useAuthStore();
  
  // Инициализация при монтировании
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
  };
};

// Хук для защиты маршрутов
export const useProtectedRoute = () => {
  const { user, isLoading, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    // Определяем, является ли текущий маршрут защищенным
    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';

    // Если пользователь не авторизован и пытается доступаться к защищенному маршруту
    if (!user && inProtectedGroup) {
      router.replace('/(auth)/login');
    } 
    // Если пользователь авторизован и находится на экране авторизации
    else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, isInitialized, segments, router]);
};

// Хук для получения информации о подписке
export const useSubscription = () => {
  const { profile } = useAuth();
  
  const tier = profile?.subscription_tier || 'free';
  const isPremium = tier === 'path' || tier === 'awakening';
  const isAwakening = tier === 'awakening';
  
  // Проверка доступа к контенту
  const hasAccess = (requiredTier: 'free' | 'path' | 'awakening') => {
    const tierLevels = { free: 0, path: 1, awakening: 2 };
    return tierLevels[tier] >= tierLevels[requiredTier];
  };

  return {
    tier,
    isPremium,
    isAwakening,
    hasAccess,
  };
};