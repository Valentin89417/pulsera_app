import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSubscription, useAdmin } from '../../hooks/useAuth';

// Экран профиля
export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const { tier, isPremium } = useSubscription();
  const { isAdmin } = useAdmin();

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
      case 'awakening': return '#ffd700';
      case 'path': return '#6c63ff';
      default: return '#666';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>

      {/* Аватар и имя */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.display_name || 'Путник'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.userId}>ID: {user?.id}</Text>
      </View>

      {/* Статус подписки */}
      <View style={[styles.subscriptionCard, { borderColor: getTierColor() }]}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionLabel}>Ваш тариф</Text>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor() + '22' }]}>
            <Text style={[styles.tierText, { color: getTierColor() }]}>{getTierLabel()}</Text>
          </View>
        </View>
        {!isPremium && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('/subscription')}
          >
            <Text style={styles.upgradeText}>Улучшить подписку</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Меню */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/bookmarks')}
        >
          <FontAwesome name="heart" size={20} color="#6c63ff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Закладки</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="download" size={20} color="#6c63ff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Скачанное</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="cog" size={20} color="#6c63ff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Настройки</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="comment-o" size={20} color="#6c63ff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Чат с автором</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="question-circle" size={20} color="#6c63ff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Помощь</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Админ — только для админов */}
      {isAdmin && (
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin')}
          >
          <FontAwesome name="shield" size={20} color="#6c63ff" style={styles.menuIcon} />
            <Text style={styles.menuText}>Админ панель</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Кнопка выхода */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      {/* Версия */}
      <Text style={styles.version}>Pulsera v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
    color: '#fff',
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
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  userId: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  subscriptionCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#999',
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
    backgroundColor: '#6c63ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  menuArrow: {
    fontSize: 24,
    color: '#666',
  },
  signOutButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#ff4444',
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 20,
  },
});
