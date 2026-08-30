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
} from 'react-native';
import { getContentComments, addComment } from '../services/api';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { CommentWithAuthor } from '../types';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

// Секция комментариев с модалкой ввода
interface CommentsSectionProps {
  contentId: string;
  replyTo?: string | null;
}

export function CommentsSection({ contentId, replyTo }: CommentsSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [replyToComment, setReplyToComment] = useState<CommentWithAuthor | null>(null);
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

  // Ответ на конкретный комментарий
  const handleReply = (comment: CommentWithAuthor) => {
    setReplyToComment(comment);
    setShowModal(true);
  };

  // Отправка комментария
  const handleSubmit = async (text: string) => {
    if (!user) return;
    await addComment(user.id, contentId, text, replyToComment?.id || undefined);
    setReplyToComment(null);
    setShowModal(false);
  };

  // Закрытие модалки
  const handleClose = () => {
    setShowModal(false);
    setReplyToComment(null);
  };

  return (
    <View style={styles.container}>
      {/* Заголовок + кнопка */}
      <View style={styles.header}>
        <Text style={styles.title}>Комментарии ({comments.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addButtonText}>✍️ Написать</Text>
        </TouchableOpacity>
      </View>

      {/* Список */}
      {loading ? (
        <ActivityIndicator size="small" color="#6c63ff" style={styles.loader} />
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>Пока нет комментариев. Будьте первым!</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem comment={item} onReply={() => handleReply(item)} />
          )}
          scrollEnabled={false}
        />
      )}

      {/* Модалка ввода */}
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
          {/* Пустая область для закрытия по тапу */}
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Контент модалки */}
          <View style={styles.modalContent}>
            {/* Заголовок модалки */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {replyToComment ? 'Ответ на комментарий' : 'Новый комментарий'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Индикатор ответа */}
            {replyToComment && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyText} numberOfLines={2}>
                  {replyToComment.text}
                </Text>
              </View>
            )}

            {/* Поле ввода */}
            <CommentInput onSubmit={handleSubmit} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  // Модалка
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1e1e2e',
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
    color: '#fff',
  },
  modalClose: {
    fontSize: 20,
    color: '#666',
  },
  replyBanner: {
    backgroundColor: '#6c63ff22',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  replyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});
