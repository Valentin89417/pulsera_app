import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getAllComments, deleteComment, AdminComment } from '../../services/api';
import { useAdmin } from '../../hooks/useAuth';

// Элемент комментария в списке
function CommentListItem({
  item,
  onDelete,
  onNavigate,
}: {
  item: AdminComment;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  // Иконка типа контента
  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'article': return '📝';
      case 'video': return '🎬';
      case 'audio': return '🎧';
      case 'course': return '📚';
      default: return '📄';
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.card}>
      {/* Шапка карточки */}
      <View style={styles.cardHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.author_name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{item.author_name || 'Аноним'}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Текст комментария */}
      <Text style={styles.commentText}>{item.text}</Text>

      {/* Контент, к которому привязан комментарий */}
      <TouchableOpacity style={styles.contentLink} onPress={onNavigate}>
        <Text style={styles.contentIcon}>{getTypeIcon(item.content_type)}</Text>
        <Text style={styles.contentTitle} numberOfLines={1}>
          {item.content_title || 'Контент удалён'}
        </Text>
        <Text style={styles.goArrow}>→</Text>
      </TouchableOpacity>

      {/* Действия */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.replyButton} onPress={onNavigate}>
          <Text style={styles.replyText}>Ответить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Удалить</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Экран управления комментариями
export default function AdminCommentsScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) loadComments();
  }, [isAdmin]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getAllComments();
      setComments(data);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setLoading(false);
    }
  };

  // Удаление комментария
  const handleDelete = (comment: AdminComment) => {
    Alert.alert(
      'Удалить комментарий',
      `"${comment.text.substring(0, 50)}..."`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteComment(comment.id);
            if (success) {
              setComments(prev => prev.filter(c => c.id !== comment.id));
            } else {
              Alert.alert('Ошибка', 'Не удалось удалить комментарий. Проверьте права доступа.');
            }
          },
        },
      ]
    );
  };

  // Навигация к контенту (с ответом)
  const handleNavigate = (contentId: string, commentId: string) => {
    router.push(`/content/${contentId}?replyTo=${commentId}`);
  };

  // Если не админ
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.accessDeniedIcon}>🔒</Text>
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backNav}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Комментарии</Text>
        <Text style={styles.headerCount}>{comments.length} всего</Text>
      </View>

      {/* Список */}
      {loading ? (
        <ActivityIndicator size="large" color="#6c63ff" style={styles.loader} />
      ) : comments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>Комментариев пока нет</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentListItem
              item={item}
              onDelete={() => handleDelete(item)}
              onNavigate={() => handleNavigate(item.content_id, item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backNav: {
    marginBottom: 8,
  },
  backButton: {
    color: '#6c63ff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c63ff33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c63ff',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 12,
  },
  contentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  contentIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  contentTitle: {
    flex: 1,
    fontSize: 13,
    color: '#999',
  },
  goArrow: {
    fontSize: 16,
    color: '#6c63ff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  replyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6c63ff22',
  },
  replyText: {
    color: '#6c63ff',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ff444422',
  },
  deleteText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: '500',
  },
  accessDeniedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
