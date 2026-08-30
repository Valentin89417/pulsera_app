import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getContentComments, addComment, updateComment, deleteComment } from '../services/api';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { useAdmin } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { CommentWithAuthor } from '../types';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

interface CommentsSectionProps {
  contentId: string;
  replyTo?: string | null;
}

export function CommentsSection({ contentId, replyTo }: CommentsSectionProps) {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [replyToComment, setReplyToComment] = useState<CommentWithAuthor | null>(null);
  const [editingComment, setEditingComment] = useState<CommentWithAuthor | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadComments = useCallback(async () => {
    try {
      const data = await getContentComments(contentId);
      setComments(data);

      if (replyTo) {
        const found = data.find(c => c.id === replyTo);
        setReplyToComment(found || null);
        if (found) setShowModal(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId, replyTo]);

  useEffect(() => {
    loadComments();

    channelRef.current = supabase
      .channel(`comments:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `content_id=eq.${contentId}`,
        },
        async () => {
          await loadComments();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [contentId, loadComments]);

  const handleReply = (comment: CommentWithAuthor) => {
    setReplyToComment(comment);
    setEditingComment(null);
    setShowModal(true);
  };

  const handleEdit = (comment: CommentWithAuthor) => {
    setEditingComment(comment);
    setReplyToComment(null);
    setShowModal(true);
  };

  const handleDelete = (comment: CommentWithAuthor) => {
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
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async (text: string) => {
    if (!user) return;

    if (editingComment) {
      const success = await updateComment(editingComment.id, text);
      if (success) {
        setComments(prev =>
          prev.map(c => c.id === editingComment.id ? { ...c, text } : c)
        );
      }
    } else {
      await addComment(user.id, contentId, text, replyToComment?.id || undefined);
    }

    setReplyToComment(null);
    setEditingComment(null);
    setShowModal(false);
  };

  const handleClose = () => {
    setShowModal(false);
    setReplyToComment(null);
    setEditingComment(null);
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Комментарии ({comments.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.addButtonContent}>
            <FontAwesome name="pencil" size={13} color={colors.onPrimary} />
            <Text style={styles.addButtonText}>Написать</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>Пока нет комментариев. Будьте первым!</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              currentUserId={user?.id}
              isAdmin={isAdmin}
              onReply={() => handleReply(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          scrollEnabled={false}
        />
      )}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingComment
                  ? 'Редактировать комментарий'
                  : replyToComment
                    ? 'Ответ на комментарий'
                    : 'Новый комментарий'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <FontAwesome name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {replyToComment && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyText} numberOfLines={2}>
                  {replyToComment.text}
                </Text>
              </View>
            )}

            <CommentInput
              onSubmit={handleSubmit}
              initialText={editingComment?.text || ''}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalClose: {
    fontSize: 20,
    color: colors.textMuted,
  },
  replyBanner: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
