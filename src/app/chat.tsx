import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useSubscription } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { supabase } from '../services/supabase';
import { getChatMessages, sendChatMessage, editChatMessage, deleteChatMessage, markAuthorMessagesAsRead, getPopularArticles, searchArticles, ArticleMention } from '../services/api';
import { ChatMessage } from '../types/user';
import { ChatBubble } from '../components/ChatBubble';
import { ArticleAutocomplete } from '../components/ArticleAutocomplete';
import { ChatLockedScreen } from '../components/ChatLockedScreen';

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { hasAccess } = useSubscription();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const loadMessagesRef = useRef<(() => Promise<void>) | null>(null);

  // Проверка подписки
  if (!hasAccess('awakening')) {
    return <ChatLockedScreen />;
  }

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getChatMessages(user.id);
      setMessages(data);
      // Отмечаем сообщения автора как прочитанные
      await markAuthorMessagesAsRead(user.id);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  loadMessagesRef.current = loadMessages;

  useEffect(() => {
    loadMessages();

    // Realtime подписка
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (user) {
      channelRef.current = supabase
        .channel(`chat:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadMessagesRef.current?.();
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]);

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Обработка ввода @
  const handleTextChange = (text: string) => {
    setInputText(text);

    // Проверяем, набран ли @ в конце
    const atMatch = text.match(/@(\S*)$/);
    if (atMatch) {
      setShowAutocomplete(true);
      setAutocompleteQuery(atMatch[1]);
    } else {
      setShowAutocomplete(false);
      setAutocompleteQuery('');
    }
  };

  // Выбор статьи из автодополнения
  const handleArticleSelect = (article: ArticleMention) => {
    const newText = inputText.replace(/@\S*$/, `[{${article.title}|${article.id}}]`);
    setInputText(newText);
    setShowAutocomplete(false);
    setAutocompleteQuery('');
  };

  // Отправка сообщения
  const handleSend = async () => {
    if (!user || !inputText.trim() || sending) return;

    setSending(true);
    try {
      if (editingMessage) {
        // Редактирование
        const success = await editChatMessage(editingMessage.id, inputText.trim());
        if (success) {
          setMessages(prev =>
            prev.map(m => m.id === editingMessage.id ? { ...m, message: inputText.trim(), edited: true } : m)
          );
        }
        setEditingMessage(null);
      } else {
        // Отправка нового
        await sendChatMessage(user.id, inputText.trim(), 'user');
      }
      setInputText('');
      setShowAutocomplete(false);
    } catch (error) {
      console.error('Ошибка отправки:', error);
    } finally {
      setSending(false);
    }
  };

  // Редактирование сообщения
  const handleEdit = (msg: ChatMessage) => {
    setEditingMessage(msg);
    setInputText(msg.message);
  };

  // Удаление сообщения
  const handleDelete = async (msg: ChatMessage) => {
    const success = await deleteChatMessage(msg.id);
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Хедер */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.authorInfo}>
          <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.authorAvatarText, { color: colors.onPrimary }]}>Д</Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>Дина Кануникова</Text>
            <Text style={[styles.authorStatus, { color: colors.textMuted }]}>Автор</Text>
          </View>
        </View>
      </View>

      {/* Сообщения */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comment-o" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Напишите первое сообщение
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMessage?.sender === item.sender;
            return (
              <ChatBubble
                message={item.message}
                sender={item.sender as 'user' | 'author'}
                createdAt={item.created_at}
                read={item.read}
                isOwn={item.sender === 'user'}
                isConsecutive={isConsecutive}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            );
          }}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Автодополнение @ */}
      <ArticleAutocomplete
        visible={showAutocomplete}
        query={autocompleteQuery}
        onSelect={handleArticleSelect}
      />

      {/* Поле ввода */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        {editingMessage && (
          <View style={[styles.editBar, { backgroundColor: colors.primary + '15' }]}>
            <FontAwesome name="pencil" size={12} color={colors.primary} />
            <Text style={[styles.editBarText, { color: colors.primary }]}>Редактирование</Text>
            <TouchableOpacity onPress={handleCancelEdit}>
              <FontAwesome name="times" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder={editingMessage ? 'Редактировать сообщение...' : 'Напишите сообщение...'}
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <FontAwesome name={editingMessage ? 'check' : 'paper-plane'} size={16} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  authorAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorStatus: {
    fontSize: 12,
  },
  messagesList: {
    paddingVertical: 12,
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
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  editBarText: {
    flex: 1,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
