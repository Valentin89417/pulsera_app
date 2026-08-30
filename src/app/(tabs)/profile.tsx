import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSubscription, useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

// Экран профиля
export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const { tier, isPremium } = useSubscription();
  const { isAdmin } = useAdmin();
  const { mode, colors } = useTheme();
  const styles = createStyles(colors);

  // Выход из аккаунта
  const handleSignOut = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // Уровень подписки для отображения
  const getTierLabel = () => {
    switch (tier) {
      case 'awakening': return 'Пробуждение';
      case 'path': return 'Путь';
      default: return 'Бесплатный';
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'awakening': return colors.gold;
      case 'path': return colors.primary;
      default: return colors.textMuted;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
      </View>

      {/* Аватар и имя */}
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
            {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{profile?.display_name || 'Путник'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      {/* Статус подписки */}
      <View style={[styles.subscriptionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.subscriptionHeader}>
          <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>Ваш тариф</Text>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor() + '22' }]}>
            <Text style={[styles.tierText, { color: getTierColor() }]}>{getTierLabel()}</Text>
          </View>
        </View>
        {!isPremium && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/subscription')}
          >
            <Text style={[styles.upgradeText, { color: colors.onPrimary }]}>Улучшить подписку</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Меню */}
      <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/bookmarks')}
        >
          <FontAwesome name="heart" size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.text }]}>Закладки</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/downloads')}
        >
          <FontAwesome name="download" size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.text }]}>Скачанное</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <FontAwesome name="comment-o" size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.text }]}>Чат с автором</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <FontAwesome name="question-circle" size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.text }]}>Помощь</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/settings')}
        >
          <FontAwesome name="cog" size={20} color={colors.primary} style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: colors.text }]}>Настройки</Text>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Админ — только для админов */}
      {isAdmin && (
        <View style={[styles.menuSection, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/admin')}
          >
          <FontAwesome name="shield" size={20} color={colors.primary} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: colors.text }]}>Админ панель</Text>
            <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Кнопка выхода */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={[styles.signOutText, { color: colors.error }]}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      {/* Версия */}
      <Text style={[styles.version, { color: colors.textMuted }]}>Pulsera v1.0.0</Text>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  subscriptionCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionLabel: {
    fontSize: 14,
  },
  tierBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 24,
  },
  signOutButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});
