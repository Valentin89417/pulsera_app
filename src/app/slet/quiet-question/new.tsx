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
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeColors } from '../../../utils/themeColors';
import { getAvailableMakDecks, createQuietQuestion } from '../../../services/api';
import { AvailableMakDeck } from '../../../types/quiet';

const QUESTION_MAX_LENGTH = 500;

// Создание «Тихого вопроса»: текст + колода, карта выпадает после публикации
export default function NewQuietQuestionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [question, setQuestion] = useState('');
  const [decks, setDecks] = useState<AvailableMakDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    const data = await getAvailableMakDecks();
    setDecks(data);
    setLoadingDecks(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet/quiet-question');
    }
  };

  const canPublish = question.trim().length > 0 && !!selectedDeckId && !publishing;

  const handlePublish = async () => {
    if (!canPublish || !selectedDeckId) return;

    setError(null);
    setPublishing(true);

    const result = await createQuietQuestion(selectedDeckId, question.trim());

    setPublishing(false);

    if (!result.id) {
      setError(result.error || 'Не удалось опубликовать вопрос');
      return;
    }

    // Заменяем экран создания детальной — чтобы «назад» вело в ленту
    router.replace(`/slet/quiet-question/${result.id}`);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Новый вопрос</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: colors.text }]}>Ваш вопрос</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Спрашивайте от себя — имя не будет видно другим
        </Text>

        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={question}
            onChangeText={setQuestion}
            placeholder="О чём хочется спросить сообщество?"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={QUESTION_MAX_LENGTH}
            textAlignVertical="top"
          />
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {question.length} / {QUESTION_MAX_LENGTH}
          </Text>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Близкая по теме колода</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Карта выпадет случайно после публикации — выбирать её нельзя
        </Text>

        {loadingDecks ? (
          <ActivityIndicator color={colors.primary} style={styles.decksLoader} />
        ) : decks.length === 0 ? (
          <View style={[styles.emptyDecks, { borderColor: colors.border }]}>
            <FontAwesome name="inbox" size={28} color={colors.primaryAlpha27} />
            <Text style={[styles.emptyDecksText, { color: colors.textMuted }]}>
              Колоды пока не готовы. Загляните чуть позже.
            </Text>
          </View>
        ) : (
          <View style={styles.decks}>
            {decks.map((deck) => {
              const selected = deck.id === selectedDeckId;
              return (
                <TouchableOpacity
                  key={deck.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedDeckId(deck.id)}
                  style={[
                    styles.deckCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? colors.primary : colors.cardBorder,
                      borderWidth: selected ? 2 : 1,
                    },
                  ]}
                >
                  {deck.cover_url ? (
                    <Image source={{ uri: deck.cover_url }} style={styles.deckCover} />
                  ) : (
                    <View style={[styles.deckCover, styles.deckCoverEmpty, { backgroundColor: colors.cardIconBg }]}>
                      <FontAwesome name="clone" size={20} color={colors.cardIconColor} />
                    </View>
                  )}

                  <View style={styles.deckBody}>
                    <Text style={[styles.deckTitle, { color: colors.text }]}>{deck.title}</Text>
                    {!!deck.description && (
                      <Text style={[styles.deckDescription, { color: colors.textMuted }]} numberOfLines={2}>
                        {deck.description}
                      </Text>
                    )}
                    <Text style={[styles.deckMeta, { color: colors.textMuted }]}>
                      {deck.cards_count} карт
                    </Text>
                  </View>

                  <FontAwesome
                    name={selected ? 'check-circle' : 'circle-o'}
                    size={20}
                    color={selected ? colors.primary : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!!error && (
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.publishButton,
            { backgroundColor: canPublish ? colors.primary : colors.primaryAlpha27 },
          ]}
          onPress={handlePublish}
          disabled={!canPublish}
        >
          {publishing ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={[styles.publishButtonText, { color: colors.onPrimary }]}>
              Задать вопрос анонимно
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: colors.textMuted }]}>
          Вопрос будет в ленте 7 дней, затем уйдёт в ваш архив. Ответы на него тоже анонимные.
        </Text>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  input: {
    minHeight: 130,
    fontSize: 15,
    lineHeight: 22,
  },
  counter: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
  },
  decksLoader: {
    marginVertical: 20,
  },
  decks: {
    gap: 10,
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
  },
  deckCover: {
    width: 52,
    height: 68,
    borderRadius: 8,
    marginRight: 12,
  },
  deckCoverEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckBody: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  deckDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  deckMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyDecks: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyDecksText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  error: {
    fontSize: 13,
    marginTop: 16,
  },
  publishButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
  },
});
