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
  const { updateProfile } = useAuthStore();
  
  const tier = profile?.subscription_tier || 'free';
  const isPremium = tier === 'path' || tier === 'awakening';
  const isAwakening = tier === 'awakening';
  
  // Проверка доступа к контенту
  const hasAccess = (requiredTier: 'free' | 'path' | 'awakening') => {
    const tierLevels = { free: 0, path: 1, awakening: 2 };
    return tierLevels[tier] >= tierLevels[requiredTier];
  };

  // Тестирование: включение подписки (только для админов)
  const activateSubscription = async (newTier: 'path' | 'awakening') => {
    try {
      const { error } = await updateProfile({ subscription_tier: newTier });
      return { error };
    } catch (error) {
      return { error: 'Ошибка активации подписки' };
    }
  };

  // Тестирование: отключение подписки (только для админов)
  const deactivateSubscription = async () => {
    try {
      const { error } = await updateProfile({ subscription_tier: 'free' });
      return { error };
    } catch (error) {
      return { error: 'Ошибка деактивации подписки' };
    }
  };

  return {
    tier,
    isPremium,
    isAwakening,
    hasAccess,
    activateSubscription,
    deactivateSubscription,
  };
};

// Хук для проверки роли админа
export const useAdmin = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  return { isAdmin };
};