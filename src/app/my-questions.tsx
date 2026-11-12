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
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { useAuthStore } from '../store/authStore';
import { getMyArchivedQuestions, deleteQuietQuestion } from '../services/api';
import { QuietQuestionView } from '../types/quiet';
import { formatQuestionDate } from '../utils/quietQuestion';

// Профиль → «Архив вопросов»: завершённые «Тихие вопросы» автора
export default function MyQuestionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [questions, setQuestions] = useState<QuietQuestionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadQuestions = useCallback(async () => {
    if (!user) return;
    const data = await getMyArchivedQuestions(user.id);
    setQuestions(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [loadQuestions])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const ok = await deleteQuietQuestion(id);
    setDeletingId(null);
    setConfirmId(null);

    if (ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Архив вопросов</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.centered}>
          <FontAwesome name="archive" size={44} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Архив пуст</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Здесь появятся вопросы, которые прожили в ленте 7 дней
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
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(`/slet/quiet-question/${item.id}`)}
                style={styles.cardMain}
              >
                <Image source={{ uri: item.card_image_url }} style={styles.image} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <Text style={[styles.question, { color: colors.text }]} numberOfLines={3}>
                    {item.question}
                  </Text>
                  <Text style={[styles.date, { color: colors.textMuted }]}>
                    {formatQuestionDate(item.created_at)}
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
              </TouchableOpacity>

              {confirmId === item.id ? (
                <View style={[styles.confirmBar, { borderTopColor: colors.border }]}>
                  <Text style={[styles.confirmText, { color: colors.textSecondary }]}>
                    Удалить вопрос вместе с ответами?
                  </Text>
                  <View style={styles.confirmActions}>
                    <TouchableOpacity
                      onPress={() => setConfirmId(null)}
                      disabled={deletingId === item.id}
                      style={styles.confirmCancel}
                    >
                      <Text style={[styles.confirmCancelText, { color: colors.textSecondary }]}>
                        Нет
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={[styles.confirmDelete, { backgroundColor: colors.error }]}
                    >
                      {deletingId === item.id ? (
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      ) : (
                        <Text style={[styles.confirmDeleteText, { color: colors.onPrimary }]}>
                          Удалить
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setConfirmId(item.id)}
                  style={[styles.deleteButton, { borderTopColor: colors.border }]}
                >
                  <FontAwesome name="trash-o" size={14} color={colors.error} />
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>Удалить</Text>
                </TouchableOpacity>
              )}
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
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: 60,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  question: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    marginTop: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBar: {
    borderTopWidth: 1,
    padding: 12,
  },
  confirmText: {
    fontSize: 13,
    lineHeight: 19,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  confirmCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  confirmCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmDelete: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
