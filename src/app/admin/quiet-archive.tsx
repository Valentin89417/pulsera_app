import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import { getAdminQuietArchive, setQuietQuestionHidden } from '../../services/api';
import { AdminQuietQuestion } from '../../types/quiet';
import { formatQuestionDate, formatAnswerTime } from '../../utils/quietQuestion';

// Админка → «Архив вопросов»: завершённые «Тихие вопросы» с авторами
export default function AdminQuietArchiveScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [questions, setQuestions] = useState<AdminQuietQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    const data = await getAdminQuietArchive();
    setQuestions(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) loadQuestions();
    }, [isAdmin, loadQuestions])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin');
    }
  };

  const handleToggleHidden = async (item: AdminQuietQuestion) => {
    setBusyId(item.id);
    const ok = await setQuietQuestionHidden(item.id, !item.is_hidden);
    setBusyId(null);

    if (ok) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, is_hidden: !q.is_hidden } : q))
      );
    }
  };

  const header = (
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
      <Text style={[styles.headerTitle, { color: colors.text }]}>Архив вопросов</Text>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centered}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Доступ запрещён</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="archive" size={44} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Архив пуст</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Сюда попадают вопросы после 7 дней в ленте
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: item.is_hidden ? colors.error : colors.cardBorder,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <FontAwesome name="user-o" size={13} color={colors.textMuted} />
                <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.author_name || 'Без имени'}
                </Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>
                  {formatQuestionDate(item.created_at)}
                </Text>
                {item.is_hidden && (
                  <View style={[styles.hiddenBadge, { backgroundColor: colors.error + '20' }]}>
                    <Text style={[styles.hiddenBadgeText, { color: colors.error }]}>скрыт</Text>
                  </View>
                )}
              </View>

              <View style={styles.questionRow}>
                <Image source={{ uri: item.card_image_url }} style={styles.image} resizeMode="cover" />
                <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
              </View>

              <Text style={[styles.answersTitle, { color: colors.textMuted }]}>
                Ответы · {item.answers.length}
              </Text>

              {item.answers.map((answer, index) => (
                <View
                  key={answer.id}
                  style={[styles.answer, { borderTopColor: colors.border }]}
                >
                  <View style={styles.answerHeader}>
                    <Text style={[styles.answerLabel, { color: colors.textMuted }]}>
                      Ответ {index + 1}
                    </Text>
                    <Text style={[styles.answerTime, { color: colors.textMuted }]}>
                      {formatAnswerTime(answer.created_at)}
                    </Text>
                    {answer.is_hidden && (
                      <Text style={[styles.answerHidden, { color: colors.error }]}>скрыт</Text>
                    )}
                  </View>
                  <Text style={[styles.answerBody, { color: colors.textSecondary }]}>
                    {answer.body}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.toggleButton, { borderTopColor: colors.border }]}
                onPress={() => handleToggleHidden(item)}
                disabled={busyId === item.id}
              >
                {busyId === item.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <FontAwesome
                      name={item.is_hidden ? 'eye' : 'eye-slash'}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={[styles.toggleText, { color: colors.primary }]}>
                      {item.is_hidden ? 'Показать автору' : 'Скрыть у автора'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
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
    fontSize: 18,
    fontWeight: '600',
  },
  centered: {
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
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  author: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 140,
  },
  date: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
  },
  hiddenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hiddenBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  questionRow: {
    flexDirection: 'row',
  },
  image: {
    width: 56,
    height: 74,
    borderRadius: 8,
    marginRight: 12,
  },
  question: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  answersTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  answer: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  answerTime: {
    fontSize: 11,
    flex: 1,
  },
  answerHidden: {
    fontSize: 11,
    fontWeight: '600',
  },
  answerBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
