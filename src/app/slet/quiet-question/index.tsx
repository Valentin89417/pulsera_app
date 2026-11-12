import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { getQuietQuestions } from '../../../services/api';
import { QuietQuestionFeedItem } from '../../../types/quiet';
import { QuietQuestionCard } from '../../../components/QuietQuestionCard';

// Лента «Тихого вопроса»: активные вопросы сообщества
export default function QuietQuestionFeedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [questions, setQuestions] = useState<QuietQuestionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuestions = useCallback(async () => {
    const data = await getQuietQuestions();
    setQuestions(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQuestions();
    }, [loadQuestions])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  // Назад в «Слёт»; при прямом открытии — фолбэк на хаб
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet');
    }
  };

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

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Тихий вопрос</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Анонимные вопросы сообществу
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/slet/quiet-question/new')}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          hitSlop={8}
        >
          <FontAwesome name="plus" size={16} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="question-circle-o" size={48} color={colors.primaryAlpha20} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Пока тихо</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Задайте первый вопрос — а карта выпадет сама
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/slet/quiet-question/new')}
          >
            <Text style={[styles.emptyButtonText, { color: colors.onPrimary }]}>
              Задать вопрос
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <QuietQuestionCard
              item={item}
              onPress={() => router.push(`/slet/quiet-question/${item.id}`)}
            />
          )}
          ListHeaderComponent={
            <Text style={[styles.listHint, { color: colors.textMuted }]}>
              Вопрос живёт в ленте 7 дней. Отвечать можно анонимно — по одному ответу с человека.
            </Text>
          }
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
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  listHint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
