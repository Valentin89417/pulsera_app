import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { getTodaysCard, getUserCardResponse, createDailyCardResponse } from '../services/api';
import { DailyCard as DailyCardType } from '../types/content';

// Проверка: показывать ли блок итогов (после 17:00 до 04:00)
const shouldShowSummary = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 17 || hour < 4;
};

export function DailyCard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [card, setCard] = useState<DailyCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoAnswer, setPhotoAnswer] = useState('');
  const [photoResponded, setPhotoResponded] = useState(false);
  const [summaryAnswers, setSummaryAnswers] = useState<string[]>([]);
  const [summaryResponded, setSummaryResponded] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadCard = useCallback(async () => {
    try {
      setLoading(true);
      const todayCard = await getTodaysCard();
      if (!todayCard) {
        setCard(null);
        return;
      }

      setCard(todayCard);
      setSummaryAnswers(todayCard.summary_questions.map(() => ''));
      setSummaryResponded(todayCard.summary_questions.map(() => false));

      // Проверяем ответы пользователя
      if (user) {
        const photoResponse = await getUserCardResponse(user.id, todayCard.id, 'photo');
        if (photoResponse) {
          setPhotoResponded(true);
        }

        const responded = [...summaryResponded];
        for (let i = 0; i < todayCard.summary_questions.length; i++) {
          const response = await getUserCardResponse(user.id, todayCard.id, 'summary', i);
          if (response) {
            responded[i] = true;
          }
        }
        setSummaryResponded(responded);
      }
    } catch (error) {
      console.error('Ошибка загрузки карточки дня:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCard();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [loadCard]);

  const handlePlayAudio = async () => {
    if (!card?.audio_url) return;

    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound && !isPlaying) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: card.audio_url },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Ошибка воспроизведения аудио:', error);
      Alert.alert('Ошибка', 'Не удалось воспроизвести аудио');
    }
  };

  const handlePhotoSubmit = async () => {
    if (!user || !card || !photoAnswer.trim()) return;

    setSubmitting(true);
    try {
      const response = await createDailyCardResponse({
        user_id: user.id,
        card_id: card.id,
        response_type: 'photo',
        answer: photoAnswer.trim(),
      });

      if (response) {
        setPhotoResponded(true);
        setPhotoAnswer('');
        Alert.alert(
          'Ответ сохранён',
          'Хотите открыть дневник?',
          [
            { text: 'Остаться', style: 'cancel' },
            { text: 'Дневник', onPress: () => router.push('/diary') },
          ]
        );
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSummarySubmit = async (index: number) => {
    if (!user || !card || !summaryAnswers[index].trim()) return;

    setSubmitting(true);
    try {
      const response = await createDailyCardResponse({
        user_id: user.id,
        card_id: card.id,
        response_type: 'summary',
        question_index: index,
        answer: summaryAnswers[index].trim(),
      });

      if (response) {
        const newResponded = [...summaryResponded];
        newResponded[index] = true;
        setSummaryResponded(newResponded);

        const newAnswers = [...summaryAnswers];
        newAnswers[index] = '';
        setSummaryAnswers(newAnswers);

        Alert.alert(
          'Ответ сохранён',
          'Хотите открыть дневник?',
          [
            { text: 'Остаться', style: 'cancel' },
            { text: 'Дневник', onPress: () => router.push('/diary') },
          ]
        );
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить ответ');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!card) {
    return null;
  }

  const showSummary = shouldShowSummary();
  const hasSummary = card.summary_questions.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Слово стаи</Text>

      {/* Заголовок карточки */}
      <Text style={styles.cardTitle}>{card.title}</Text>

      {/* Фото с аудио */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: card.image_url }} style={styles.image} />
        {card.audio_url && (
          <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio}>
            <FontAwesome
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={colors.onPrimary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Вопрос к фото */}
      <Text style={styles.question}>{card.photo_question}</Text>

      {/* Ответ на фото */}
      {photoResponded ? (
        <TouchableOpacity style={styles.diaryButton} onPress={() => router.push('/diary')}>
          <FontAwesome name="book" size={14} color={colors.primary} />
          <Text style={styles.diaryButtonText}>Мой дневник</Text>
          <FontAwesome name="arrow-right" size={12} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={photoAnswer}
            onChangeText={setPhotoAnswer}
            placeholder="Ваш ответ..."
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!submitting}
          />
          <TouchableOpacity
            style={[styles.submitButton, (!photoAnswer.trim() || submitting) && styles.submitButtonDisabled]}
            onPress={handlePhotoSubmit}
            disabled={!photoAnswer.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={styles.submitButtonText}>Ответить</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Блок итогов (после 17:00 до 04:00) */}
      {showSummary && hasSummary && (
        <View style={styles.summarySection}>
          <View style={styles.summaryDivider} />
          <Text style={styles.summaryTitle}>Вопросы для подведения итогов</Text>

          {card.summary_questions.map((question, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryQuestion}>{question}</Text>

              {summaryResponded[index] ? (
                <TouchableOpacity style={styles.diaryButton} onPress={() => router.push('/diary')}>
                  <FontAwesome name="book" size={14} color={colors.primary} />
                  <Text style={styles.diaryButtonText}>Мой дневник</Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={summaryAnswers[index]}
                    onChangeText={(v) => {
                      const newAnswers = [...summaryAnswers];
                      newAnswers[index] = v;
                      setSummaryAnswers(newAnswers);
                    }}
                    placeholder="Ваш ответ..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    editable={!submitting}
                  />
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!summaryAnswers[index].trim() || submitting) && styles.submitButtonDisabled,
                    ]}
                    onPress={() => handleSummarySubmit(index)}
                    disabled={!summaryAnswers[index].trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.submitButtonText}>Ответить</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  audioButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  question: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  inputContainer: {
    gap: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 44,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  diaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 10,
    paddingVertical: 12,
  },
  diaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  summarySection: {
    marginTop: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryQuestion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
});
