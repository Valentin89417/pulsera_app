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
import { FontAwesome } from '@expo/vector-icons';
import { getAllComments, deleteComment, AdminComment } from '../../services/api';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

function CommentListItem({
  item,
  onDelete,
  onNavigate,
  colors,
}: {
  item: AdminComment;
  onDelete: () => void;
  onNavigate: () => void;
  colors: ThemeColors;
}) {
  const styles = createStyles(colors);

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

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

      <Text style={styles.commentText}>{item.text}</Text>

      <TouchableOpacity style={styles.contentLink} onPress={onNavigate}>
        <FontAwesome name={getTypeIcon(item.content_type) as any} size={16} color={colors.primary} style={styles.contentIcon} />
        <Text style={styles.contentTitle} numberOfLines={1}>
          {item.content_title || 'Контент удалён'}
        </Text>
        <FontAwesome name="arrow-right" size={16} color={colors.primary} />
      </TouchableOpacity>

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

export default function AdminCommentsScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  const styles = createStyles(colors);

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

  const handleNavigate = (contentId: string, commentId: string) => {
    router.push(`/content/${contentId}?replyTo=${commentId}`);
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.backButton}>
              <FontAwesome name="arrow-left" size={16} color={colors.primary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backNav}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Комментарии</Text>
        <Text style={styles.headerCount}>{comments.length} всего</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : comments.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="comment-o" size={48} color={colors.primary} />
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
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerCount: {
    fontSize: 14,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primaryAlpha20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  commentText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  contentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    color: colors.textSecondary,
  },
  goArrow: {
    fontSize: 16,
    color: colors.primary,
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
    backgroundColor: colors.primaryAlpha13,
  },
  replyText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.primaryAlpha13,
  },
  deleteText: {
    color: colors.error,
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
    color: colors.text,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
