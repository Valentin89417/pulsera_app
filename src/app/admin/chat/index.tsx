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
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { getAdminChatUsers, deleteChat, shareChatAsMarkdown, AdminChatUser } from '../../../services/api';

export default function AdminChatListScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();

  const [chatUsers, setChatUsers] = useState<AdminChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminChatUser | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeletePress = (user: AdminChatUser) => {
    setUserToDelete(user);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      const success = await deleteChat(userToDelete.user_id);
      if (success) {
        setDeleteModalVisible(false);
        setUserToDelete(null);
        loadChatUsers();
      } else {
        Alert.alert('Ошибка', 'Не удалось удалить чат');
      }
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      Alert.alert('Ошибка', 'Не удалось удалить чат');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportChat = async (user: AdminChatUser) => {
    try {
      await shareChatAsMarkdown(user.user_id, user.display_name || 'Пользователь');
    } catch (error) {
      console.error('Ошибка экспорта чата:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать чат');
    }
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
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
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

              {/* Кнопки действий */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleExportChat(item)}
                >
                  <FontAwesome name="download" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeletePress(item)}
                >
                  <FontAwesome name="trash-o" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* Модалка подтверждения удаления */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <FontAwesome name="trash" size={32} color={colors.error} style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Удалить чат?</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Вся переписка с пользователем {userToDelete?.display_name || 'Пользователь'} будет удалена безвозвратно.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Удалить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  actions: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
