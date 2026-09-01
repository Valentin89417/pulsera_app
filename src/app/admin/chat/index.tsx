import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { getAdminChatUsers, AdminChatUser } from '../../../services/api';

export default function AdminChatListScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();

  const [chatUsers, setChatUsers] = useState<AdminChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChatUsers = useCallback(async () => {
    try {
      const data = await getAdminChatUsers();
      setChatUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadChatUsers();
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChatUsers();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Чат с пользователями</Text>
      </View>

      {/* Список чатов */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : chatUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comment-o" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Пока нет сообщений
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatUsers}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chatItem, { borderBottomColor: colors.border }]}
              onPress={() => router.push(`/admin/chat/${item.user_id}`)}
            >
              {/* Аватар */}
              {item.avatar_url ? (
                <View style={styles.avatar}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                    {item.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                    {item.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}

              {/* Информация */}
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                    {item.display_name || 'Пользователь'}
                  </Text>
                  <Text style={[styles.chatTime, { color: colors.textMuted }]}>
                    {formatTime(item.last_message_at)}
                  </Text>
                </View>
                <Text style={[styles.chatLastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.last_message}
                </Text>
              </View>

              {/* Бейдж непрочитанных */}
              {item.unread_count > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
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
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
  },
  chatLastMessage: {
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
