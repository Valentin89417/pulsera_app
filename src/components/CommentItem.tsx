import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CommentWithAuthor } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserId?: string | null;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

export function CommentItem({ comment, currentUserId, onReply, onEdit, onDelete, isAdmin }: CommentItemProps) {
  const { colors } = useTheme();
  const authorName = comment.profiles?.display_name || 'Аноним';
  const avatarLetter = authorName.charAt(0).toUpperCase();
  const isReply = !!comment.parent_id;
  const isOwn = currentUserId === comment.user_id;
  const canDelete = isOwn || isAdmin;
  const canEdit = isOwn;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.wrapper, isReply && styles.replyWrapper]}>
      {isReply && <View style={styles.replyLine} />}

      <View style={styles.container}>
        <View style={[styles.avatar, isReply && styles.replyAvatar]}>
          <Text style={[styles.avatarText, isReply && styles.replyAvatarText]}>
            {avatarLetter}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.author}>{authorName}</Text>
            <Text style={styles.date}>{formatDate(comment.created_at)}</Text>
          </View>

          {isReply && comment.parent_text && (
            <View style={styles.replyTo}>
              <Text style={styles.replyToText} numberOfLines={1}>
                ↳ {comment.parent_text}
              </Text>
            </View>
          )}

          <Text style={styles.text}>{comment.text}</Text>

          <View style={styles.actions}>
            {onReply && (
              <TouchableOpacity style={styles.actionButton} onPress={onReply}>
                <Text style={styles.replyButtonText}>Ответить</Text>
              </TouchableOpacity>
            )}
            {canEdit && onEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
                <Text style={styles.editButtonText}>Редактировать</Text>
              </TouchableOpacity>
            )}
            {canDelete && onDelete && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  replyWrapper: {
    marginLeft: 20,
  },
  replyLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.primaryAlpha27,
    borderRadius: 1,
  },
  container: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  replyAvatarText: {
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  replyTo: {
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  replyToText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },
  text: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  editButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },
});
