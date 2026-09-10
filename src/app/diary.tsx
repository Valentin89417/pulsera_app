import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { getUserDiaryEntries } from '../services/api';
import { DailyCard as DailyCardType, DailyCardResponse } from '../types/content';

// Формат даты ответа: "10 октября 2026, 10:30"
const formatResponseDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
};

// Формат даты карточки: "10.03.2026"
const formatCardDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};

interface DiaryEntry {
  card: DailyCardType;
  responses: DailyCardResponse[];
}

export default function DiaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserDiaryEntries(user.id);
    setEntries(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [user])
  );

  const getPhotoResponse = (responses: DailyCardResponse[]) =>
    responses.find((r) => r.response_type === 'photo');

  const getSummaryResponses = (responses: DailyCardResponse[]) =>
    responses
      .filter((r) => r.response_type === 'summary')
      .sort((a, b) => (a.question_index ?? 0) - (b.question_index ?? 0));

  const renderEntry = ({ item }: { item: DiaryEntry }) => {
    const photoResponse = getPhotoResponse(item.responses);
    const summaryResponses = getSummaryResponses(item.responses);

    return (
      <View style={styles.entryCard}>
        {/* Заголовок и дата */}
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatCardDate(item.card.card_date)}</Text>
          <Text style={styles.entryTitle} numberOfLines={1}>{item.card.title}</Text>
        </View>

        {/* Фото и вопрос */}
        <View style={styles.entryContent}>
          <TouchableOpacity onPress={() => setSelectedImage(item.card.image_url)}>
            <Image source={{ uri: item.card.image_url }} style={styles.thumbnail} />
          </TouchableOpacity>
          <View style={styles.entryQuestionContainer}>
            <Text style={styles.entryQuestion}>{item.card.photo_question}</Text>
          </View>
        </View>

        {/* Ответ на фото */}
        {photoResponse && (
          <View style={styles.responseBlock}>
            <Text style={styles.responseText}>{photoResponse.answer}</Text>
            <Text style={styles.responseDate}>
              {formatResponseDate(photoResponse.created_at)}
            </Text>
          </View>
        )}

        {/* Итоговые вопросы */}
        {summaryResponses.length > 0 && (
          <View style={styles.summarySection}>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryTitle}>Вопросы для подведения итогов</Text>

            {summaryResponses.map((response) => {
              const questionIndex = response.question_index ?? 0;
              const question = item.card.summary_questions[questionIndex] || `Вопрос ${questionIndex + 1}`;

              return (
                <View key={response.id} style={styles.summaryItem}>
                  <Text style={styles.summaryQuestion}>{question}</Text>
                  <Text style={styles.summaryAnswer}>{response.answer}</Text>
                  <Text style={styles.summaryDate}>
                    {formatResponseDate(response.created_at)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мой дневник</Text>
      </View>

      {/* Список */}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.card.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome name="book" size={48} color={colors.primary} />
              <Text style={styles.emptyText}>Пока нет записей</Text>
              <Text style={styles.emptyHint}>
                Ответьте на сегодняшнее «Слово стаи» на главной
              </Text>
            </View>
          )
        }
      />

      {/* Модалка с полноразмерным фото */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <FontAwesome name="times" size={24} color={colors.onPrimary} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  entryHeader: {
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  entryContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  entryQuestionContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  entryQuestion: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  responseBlock: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  responseDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  summarySection: {
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 12,
  },
  summaryQuestion: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryAnswer: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  summaryDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 8,
  },
});
