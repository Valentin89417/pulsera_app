import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { useAuthStore } from '../../../store/authStore';
import {
  getQuietQuestion,
  getQuietAnswers,
  createQuietAnswer,
  updateQuietAnswer,
  deleteQuietQuestion,
} from '../../../services/api';
import { QuietQuestionView, QuietAnswerView } from '../../../types/quiet';
import { QuietAnswerItem } from '../../../components/QuietAnswerItem';
import {
  formatDaysLeft,
  formatQuestionDate,
  formatEditDeadline,
  formatEditTimeLeft,
  isEditWindowOpen,
  isQuestionArchived,
} from '../../../utils/quietQuestion';

const ANSWER_MAX_LENGTH = 1000;

// Детальная «Тихого вопроса»: карта, вопрос, анонимные ответы
export default function QuietQuestionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [question, setQuestion] = useState<QuietQuestionView | null>(null);
  const [answers, setAnswers] = useState<QuietAnswerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadQuestion = useCallback(async () => {
    if (!id || !user) return;

    const data = await getQuietQuestion(id, user.id);
    setQuestion(data);

    if (data) {
      const answerList = await getQuietAnswers(id, user.id);
      setAnswers(answerList);
    }

    setLoading(false);
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      loadQuestion();
    }, [loadQuestion])
  );

  // Назад в ленту; при прямом открытии — фолбэк на список
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet/quiet-question');
    }
  };

  const archived = question ? isQuestionArchived(question.expires_at) : false;
  const editOpen = question ? !archived && isEditWindowOpen(question.created_at) : false;
  const ownAnswer = answers.find((a) => a.is_own) || null;
  const canDelete = !!question?.is_own && (archived || editOpen);
  // Композер показываем, пока можно ответить или пока идёт правка своего ответа
  const showComposer = !archived && (!ownAnswer || !!editingAnswerId);

  // Отправка нового ответа или сохранение правки
  const handleSendAnswer = async () => {
    if (!user || !question || !answerText.trim() || sending) return;

    setSending(true);
    setError(null);

    if (editingAnswerId) {
      const ok = await updateQuietAnswer(editingAnswerId, answerText.trim());
      if (!ok) {
        setError('Не удалось сохранить правку — время на правки истекло');
      } else {
        setEditingAnswerId(null);
        setAnswerText('');
        await loadQuestion();
      }
    } else {
      const result = await createQuietAnswer(question.id, user.id, answerText.trim());
      if (!result.ok) {
        setError(result.error || 'Не удалось отправить ответ');
      } else {
        setAnswerText('');
        await loadQuestion();
      }
    }

    setSending(false);
  };

  const handleStartEdit = () => {
    if (!ownAnswer) return;
    setEditingAnswerId(ownAnswer.id);
    setAnswerText(ownAnswer.body);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingAnswerId(null);
    setAnswerText('');
    setError(null);
  };

  const handleDelete = async () => {
    if (!question || deleting) return;

    setDeleting(true);
    const ok = await deleteQuietQuestion(question.id);
    setDeleting(false);

    if (!ok) {
      setError('Не удалось удалить вопрос');
      setShowDeleteConfirm(false);
      return;
    }

    // Возврат туда, откуда пришли: из ленты или из архива
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet/quiet-question');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Тихий вопрос</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Тихий вопрос</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FontAwesome name="lock" size={40} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Вопрос недоступен</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Возможно, он уже в архиве и виден только автору
          </Text>
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
      {/* Хедер */}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Тихий вопрос</Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            hitSlop={8}
            style={styles.headerAction}
          >
            <FontAwesome name="trash-o" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Карта — момент раскрытия после публикации */}
        <Image
          source={{ uri: question.card_image_url }}
          style={[styles.cardImage, { backgroundColor: colors.surfaceLight }]}
          resizeMode="contain"
        />

        <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatQuestionDate(question.created_at)}
          </Text>
          <View style={styles.metaDot} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {formatDaysLeft(question.expires_at)}
          </Text>
          {question.is_own && (
            <>
              <View style={styles.metaDot} />
              <Text style={[styles.metaText, { color: colors.primary }]}>Ваш вопрос</Text>
            </>
          )}
        </View>

        {archived && (
          <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome name="archive" size={14} color={colors.primary} />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Вопрос в архиве: в общей ленте он больше не показывается
            </Text>
          </View>
        )}

        {/* Подтверждение удаления */}
        {showDeleteConfirm && (
          <View style={[styles.deleteCard, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>
              Удалить вопрос?
            </Text>
            <Text style={[styles.deleteText, { color: colors.textMuted }]}>
              Он исчезнет из ленты и архива вместе со всеми ответами. Это действие необратимо.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteCancel, { borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>
                  Отмена
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirm, { backgroundColor: colors.error }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.deleteConfirmText, { color: colors.onPrimary }]}>
                    Удалить
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Ответы */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Ответы · {answers.length}
        </Text>

        {answers.length === 0 ? (
          <Text style={[styles.emptyAnswers, { color: colors.textMuted }]}>
            Пока никто не ответил. Ваш ответ может стать первым.
          </Text>
        ) : (
          answers.map((answer, index) => (
            <QuietAnswerItem
              key={answer.id}
              index={index + 1}
              answer={answer}
              canEdit={answer.is_own && editOpen}
              onEdit={handleStartEdit}
            />
          ))
        )}

        {!archived && ownAnswer && !editingAnswerId && (
          <Text style={[styles.editHint, { color: colors.textMuted }]}>
            {editOpen
              ? `Правки ответа доступны ${formatEditDeadline(question.created_at)} (ещё ${formatEditTimeLeft(question.created_at)})`
              : 'Время на правку ответа истекло'}
          </Text>
        )}

        {/* Ошибки вне композера (например, при удалении вопроса) */}
        {!showComposer && !!error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}
      </ScrollView>

      {/* Композер закреплён внизу: клавиатура его не перекрывает */}
      {showComposer && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          {!!error && (
            <Text style={[styles.footerError, { color: colors.error }]}>{error}</Text>
          )}

          <TextInput
            style={[
              styles.answerInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: editingAnswerId ? colors.primary : colors.border,
                color: colors.text,
              },
            ]}
            value={answerText}
            onChangeText={setAnswerText}
            placeholder={editingAnswerId ? 'Исправьте ответ...' : 'Ваш ответ — анонимно...'}
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={ANSWER_MAX_LENGTH}
            textAlignVertical="top"
          />

          {editingAnswerId ? (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editCancel, { borderColor: colors.border }]}
                onPress={handleCancelEdit}
                disabled={sending}
              >
                <Text style={[styles.editCancelText, { color: colors.textSecondary }]}>
                  Отмена
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, styles.sendButtonInline, { backgroundColor: colors.primary }]}
                onPress={handleSendAnswer}
                disabled={!answerText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.sendButtonText, { color: colors.onPrimary }]}>
                    Сохранить
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: answerText.trim() ? colors.primary : colors.primaryAlpha27,
                },
              ]}
              onPress={handleSendAnswer}
              disabled={!answerText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[styles.sendButtonText, { color: colors.onPrimary }]}>
                  Ответить анонимно
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  headerAction: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cardImage: {
    width: '100%',
    height: 320,
    borderRadius: 18,
    marginBottom: 20,
  },
  question: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.5)',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  deleteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  deleteCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirm: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 28,
    marginBottom: 12,
  },
  emptyAnswers: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  footerError: {
    fontSize: 13,
    marginBottom: 8,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 21,
  },
  sendButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  sendButtonInline: {
    flex: 1,
    marginTop: 0,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    fontSize: 13,
    marginTop: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
