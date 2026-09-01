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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { supabase } from '../../../services/supabase';
import {
  getAdminChatMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  markChatAsRead,
  getProfile,
  getPopularArticles,
  searchArticles,
  ArticleMention,
} from '../../../services/api';
import { ChatMessage } from '../../../types/user';
import { ChatBubble } from '../../../components/ChatBubble';
import { ArticleAutocomplete } from '../../../components/ArticleAutocomplete';

export default function AdminChatDialogScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const loadMessagesRef = useRef<(() => Promise<void>) | null>(null);

  // Загрузка имени пользователя
  useEffect(() => {
    if (userId) {
      getProfile(userId).then(profile => {
        if (profile?.display_name) {
          setUserName(profile.display_name);
        }
      });
    }
  }, [userId]);

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getAdminChatMessages(userId);
      setMessages(data);

      // Отмечаем сообщения как прочитанные
      await markChatAsRead(userId);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  loadMessagesRef.current = loadMessages;

  useEffect(() => {
    loadMessages();

    // Realtime подписка
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (userId) {
      channelRef.current = supabase
        .channel(`admin-chat:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `user_id=eq.${userId}`,
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
  }, [userId]);

  // Автоскролл вниз
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

  // Отправка сообщения от автора
  const handleSend = async () => {
    if (!userId || !inputText.trim() || sending) return;

    setSending(true);
    try {
      if (editingMessage) {
        const success = await editChatMessage(editingMessage.id, inputText.trim());
        if (success) {
          setMessages(prev =>
            prev.map(m => m.id === editingMessage.id ? { ...m, message: inputText.trim(), edited: true } : m)
          );
        }
        setEditingMessage(null);
      } else {
        await sendChatMessage(userId, inputText.trim(), 'author');
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

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.accessDenied}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={[styles.accessDeniedText, { color: colors.text }]}>Доступ запрещён</Text>
          <Text style={[styles.accessDeniedHint, { color: colors.textMuted }]}>Только для администраторов</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
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

        <View style={styles.userInfo}>
          <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.userAvatarText, { color: colors.onPrimary }]}>
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{userName || 'Пользователь'}</Text>
            <Text style={[styles.userStatus, { color: colors.textMuted }]}>Пользователь</Text>
          </View>
        </View>
      </View>

      {/* Сообщения */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comment-o" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Нет сообщений
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
                isOwn={item.sender === 'author'}
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
            placeholder={editingMessage ? 'Редактировать сообщение...' : 'Напишите ответ...'}
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userStatus: {
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
