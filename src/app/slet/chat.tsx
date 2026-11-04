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
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import { supabase } from '../../services/supabase';
import {
  getCommunityMessages,
  sendCommunityMessage,
  editCommunityMessage,
  deleteCommunityMessage,
  ArticleMention,
  CommunityMessageWithProfile,
  getAllUserIds,
} from '../../services/api';
import { batchSend, updateLastCommunityActive } from '../../services/notifications';
import { useChatStore } from '../../store/chatStore';
import { CommunityChatBubble } from '../../components/CommunityChatBubble';
import { ArticleAutocomplete } from '../../components/ArticleAutocomplete';

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const nowYear = now.getFullYear();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return 'Сегодня';
  if (isYesterday) return 'Вчера';
  if (year === nowYear) return `${day}.${month}`;
  return `${day}.${month}.${year}`;
}

// Чат «Пожужжим» — бывший чат сообщества, теперь раздел «Слёта»
export default function PozhuzhimScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { setActiveChatScreen } = useChatStore();

  const [messages, setMessages] = useState<CommunityMessageWithProfile[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<CommunityMessageWithProfile | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const loadMessagesRef = useRef<(() => Promise<void>) | null>(null);

  // Установка активного экрана «Пожужжим» + обновление timestamp активности
  useEffect(() => {
    setActiveChatScreen('slet-chat');
    if (user) {
      updateLastCommunityActive(user.id);
    }
    return () => setActiveChatScreen(null);
  }, []);

  // Загрузка сообщений
  const loadMessages = useCallback(async () => {
    try {
      const data = await getCommunityMessages(100);
      setMessages(data);
    } catch (error) {
      console.error('Ошибка загрузки сообщений «Пожужжим»:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  loadMessagesRef.current = loadMessages;

  useEffect(() => {
    loadMessages();

    // Realtime подписка
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
        },
        () => {
          loadMessagesRef.current?.();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

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
        const success = await editCommunityMessage(editingMessage.id, inputText.trim());
        if (success) {
          setMessages(prev =>
            prev.map(m => m.id === editingMessage.id ? { ...m, message: inputText.trim(), edited: true } : m)
          );
        }
        setEditingMessage(null);
      } else {
        await sendCommunityMessage(user.id, inputText.trim());

        // Отправляем push всем пользователям кроме отправителя (с батчингом)
        const allUserIds = await getAllUserIds();
        const otherUserIds = allUserIds.filter((id) => id !== user.id);

        const senderName = profile?.display_name || 'Пользователь';
        const preview = inputText.trim().slice(0, 80);

        for (const recipientId of otherUserIds) {
          batchSend(recipientId, {
            title: 'Пожужжим',
            body: `${senderName}: ${preview}`,
            data: { screen: 'slet-chat' },
          }, 'community');
        }
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
  const handleEdit = (msg: CommunityMessageWithProfile) => {
    setEditingMessage(msg);
    setInputText(msg.message);
  };

  // Удаление сообщения
  const handleDelete = async (msg: CommunityMessageWithProfile) => {
    const success = await deleteCommunityMessage(msg.id);
    if (success) {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  // Назад в «Слёт»; при прямом открытии экрана — фолбэк на хаб
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet');
    }
  };

  const styles = createStyles(colors);

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 10,
        },
      ]}
    >
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={18} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Пожужжим</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Чат сообщества</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {renderHeader()}

      {/* Сообщения */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comments" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Пожужжим</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Начните разговор первым — здесь можно поговорить обо всём, что откликается
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMessage?.user_id === item.user_id;
            const isOwn = item.user_id === user?.id;

            // Показываем разделитель даты при смене дня
            const prevDate = prevMessage ? new Date(prevMessage.created_at).toDateString() : null;
            const curDate = new Date(item.created_at).toDateString();
            const showDateSeparator = !prevDate || prevDate !== curDate;

            return (
              <>
                {showDateSeparator && (
                  <View style={styles.dateSeparator}>
                    <Text style={[styles.dateSeparatorText, { color: colors.textMuted, backgroundColor: colors.surface }]}>
                      {formatDateSeparator(item.created_at)}
                    </Text>
                  </View>
                )}
                <CommunityChatBubble
                  message={item.message}
                  authorName={item.profiles?.display_name}
                  authorAvatarUrl={item.profiles?.avatar_url}
                  createdAt={item.created_at}
                  isOwn={isOwn}
                  isConsecutive={isConsecutive}
                  edited={item.edited}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                />
              </>
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
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    marginHorizontal: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
