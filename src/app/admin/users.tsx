import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import { getAllUsers, updateUserRole, updateUserSubscription, AdminUser } from '../../services/api';

type SubscriptionTier = 'free' | 'path' | 'awakening';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  // Обновить роль пользователя
  const handleToggleAdmin = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? 'назначить админом' : 'снять админа';

    Alert.alert(
      'Изменить роль',
      `${label} для ${user.display_name || 'пользователя'}?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Да',
          onPress: async () => {
            setUpdatingId(user.id);
            try {
              const success = await updateUserRole(user.id, newRole);
              if (success) {
                setUsers(prev =>
                  prev.map(u => u.id === user.id ? { ...u, role: newRole } : u)
                );
              }
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  // Обновить подписку пользователя
  const handleToggleSubscription = async (user: AdminUser) => {
    const currentTier = (user.subscription_tier || 'free') as SubscriptionTier;
    const options: { label: string; value: SubscriptionTier }[] = [
      { label: 'Начало', value: 'free' },
      { label: 'Путь', value: 'path' },
      { label: 'Пробуждение', value: 'awakening' },
    ];

    Alert.alert(
      'Изменить подписку',
      `Текущий доступ: ${getTierLabel(currentTier)}`,
      [
        ...options.map(opt => ({
          text: opt.label,
          onPress: async () => {
            if (opt.value === 'free') {
              // Сбрасываем подписку без даты
              setUpdatingId(user.id);
              try {
                const success = await updateUserSubscription(user.id, opt.value, null);
                if (success) {
                  setUsers(prev =>
                    prev.map(u => u.id === user.id ? { ...u, subscription_tier: opt.value } : u)
                  );
                }
              } finally {
                setUpdatingId(null);
              }
            } else {
              // Для платных уровней — спрашиваем дату окончания
              Alert.prompt(
                'Дата окончания',
                'Введите дату окончания (ДД.ММ.ГГГГ) или оставьте пустым для бессрочного',
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Бессрочно',
                    onPress: async () => {
                      setUpdatingId(user.id);
                      try {
                        const success = await updateUserSubscription(user.id, opt.value, null);
                        if (success) {
                          setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, subscription_tier: opt.value } : u)
                          );
                        }
                      } finally {
                        setUpdatingId(null);
                      }
                    },
                  },
                  {
                    text: 'Сохранить',
                    onPress: async (dateStr?: string) => {
                      let expiresAt: string | null = null;
                      if (dateStr) {
                        const parts = dateStr.split('.');
                        if (parts.length === 3) {
                          const [day, month, year] = parts;
                          expiresAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
                        }
                      }
                      setUpdatingId(user.id);
                      try {
                        const success = await updateUserSubscription(user.id, opt.value, expiresAt);
                        if (success) {
                          setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, subscription_tier: opt.value } : u)
                          );
                        }
                      } finally {
                        setUpdatingId(null);
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }
          },
        })),
        { text: 'Отмена', style: 'cancel' as const },
      ]
    );
  };

  const getTierLabel = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'awakening': return 'Пробуждение';
      case 'path': return 'Путь';
      default: return 'Начало';
    }
  };

  const getTierColor = (tier: SubscriptionTier): string => {
    switch (tier) {
      case 'awakening': return colors.gold;
      case 'path': return colors.primary;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const styles = createStyles(colors);

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.backButton}>
              <FontAwesome name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backButtonText, { color: colors.primary }]}>Назад</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.accessDenied}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={[styles.accessDeniedText, { color: colors.text }]}>Доступ запрещён</Text>
          <Text style={[styles.accessDeniedHint, { color: colors.textMuted }]}>Только для администраторов</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Хедер */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Пользователи</Text>
        <Text style={[styles.headerCount, { color: colors.textMuted }]}>{users.length}</Text>
      </View>

      {/* Список пользователей */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="users" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Нет пользователей
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const tier = (item.subscription_tier || 'free') as SubscriptionTier;
            const isAdminUser = item.role === 'admin';
            const isUpdating = updatingId === item.id;

            return (
              <View style={[styles.userItem, { borderBottomColor: colors.border }]}>
                {/* Аватар и основная информация */}
                <View style={styles.userMain}>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: isAdminUser ? colors.gold : colors.primary }]}>
                      <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                        {item.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {item.display_name || 'Без имени'}
                      </Text>
                      {isAdminUser && (
                        <View style={[styles.adminBadge, { backgroundColor: colors.gold + '22' }]}>
                          <FontAwesome name="shield" size={10} color={colors.gold} />
                          <Text style={[styles.adminBadgeText, { color: colors.gold }]}>Admin</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.userId, { color: colors.textMuted }]} numberOfLines={1}>
                      ID: {item.id.slice(0, 8)}...
                    </Text>

                    {item.created_at && (
                      <Text style={[styles.userDate, { color: colors.textMuted }]}>
                        {formatDate(item.created_at)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Управление */}
                <View style={styles.controls}>
                  {/* Подписка */}
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: getTierColor(tier) + '15' }]}
                    onPress={() => handleToggleSubscription(item)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Подписка</Text>
                        <View style={styles.controlValue}>
                          <Text style={[styles.controlValueText, { color: getTierColor(tier) }]}>
                            {getTierLabel(tier)}
                          </Text>
                          <FontAwesome name="chevron-down" size={10} color={colors.textMuted} />
                        </View>
                        {tier !== 'free' && item.subscription_expires_at && (
                          <Text style={[styles.controlExpiry, { color: colors.textMuted }]}>
                            до {formatDate(item.subscription_expires_at)}
                          </Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Роль */}
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: isAdminUser ? colors.gold + '15' : colors.primaryAlpha10 }]}
                    onPress={() => handleToggleAdmin(item)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Роль</Text>
                        <View style={styles.controlValue}>
                          <Text style={[styles.controlValueText, { color: isAdminUser ? colors.gold : colors.textMuted }]}>
                            {isAdminUser ? 'Admin' : 'User'}
                          </Text>
                          <FontAwesome name="chevron-down" size={10} color={colors.textMuted} />
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerCount: {
    fontSize: 14,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accessDeniedHint: {
    fontSize: 14,
  },
  userItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  userMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userId: {
    fontSize: 12,
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  controlLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  controlValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlValueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controlExpiry: {
    fontSize: 10,
    marginTop: 2,
  },
});
