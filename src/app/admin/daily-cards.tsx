import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import {
  getAllDailyCards,
  createDailyCard,
  updateDailyCard,
  deleteDailyCard,
} from '../../services/api';
import { DailyCard } from '../../types/content';
import { pickFile, uploadFile, deleteFile, UploadResult } from '../../utils/upload';

// Конвертация DD.MM.YYYY → YYYY-MM-DD
const parseDateInput = (input: string): string | null => {
  const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return null;
  return `${y}-${month}-${day}`;
};

// Конвертация YYYY-MM-DD → DD.MM.YYYY
const formatDateDisplay = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
};

export default function DailyCardsAdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [cards, setCards] = useState<DailyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Модалка
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<DailyCard | null>(null);
  const [title, setTitle] = useState('');
  const [photoQuestion, setPhotoQuestion] = useState('');
  const [summaryQuestions, setSummaryQuestions] = useState<string[]>(['', '', '', '']);
  const [dateInput, setDateInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);

  const loadCards = async () => {
    setLoading(true);
    const data = await getAllDailyCards();
    setCards(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  const resetForm = () => {
    setTitle('');
    setPhotoQuestion('');
    setSummaryQuestions(['', '', '', '']);
    setDateInput('');
    setImageUrl(null);
    setImageFilename(null);
    setAudioUrl(null);
    setAudioFilename(null);
    setEditingCard(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (card: DailyCard) => {
    setEditingCard(card);
    setTitle(card.title);
    setPhotoQuestion(card.photo_question);
    setSummaryQuestions(
      card.summary_questions.length > 0
        ? [...card.summary_questions, ...Array(Math.max(0, 4 - card.summary_questions.length)).fill('')]
        : ['', '', '', '']
    );
    setDateInput(formatDateDisplay(card.card_date));
    setImageUrl(card.image_url);
    setImageFilename(card.image_filename);
    setAudioUrl(card.audio_url);
    setAudioFilename(card.audio_filename);
    setShowModal(true);
  };

  const handleUploadImage = async () => {
    try {
      const file = await pickFile('image');
      if (!file) return;
      setUploading(true);
      setUploadProgress(0);
      const result: UploadResult = await uploadFile(file, 'image', setUploadProgress);
      setImageUrl(result.url);
      setImageFilename(result.filename);
    } catch (err) {
      console.error('Ошибка загрузки фото:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить изображение');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadAudio = async () => {
    try {
      const file = await pickFile('audio');
      if (!file) return;
      setUploading(true);
      setUploadProgress(0);
      const result: UploadResult = await uploadFile(file, 'audio', setUploadProgress);
      setAudioUrl(result.url);
      setAudioFilename(result.filename);
    } catch (err) {
      console.error('Ошибка загрузки аудио:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить аудио');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAudio = () => {
    Alert.alert('Удалить аудио?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          if (audioFilename) {
            deleteFile(audioFilename).catch(() => {});
          }
          setAudioUrl(null);
          setAudioFilename(null);
        },
      },
    ]);
  };

  const handleSave = async () => {
    // Валидация
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите заголовок');
      return;
    }
    if (!imageUrl) {
      Alert.alert('Ошибка', 'Загрузите фото');
      return;
    }
    if (!photoQuestion.trim()) {
      Alert.alert('Ошибка', 'Введите вопрос к фото');
      return;
    }
    const parsedDate = parseDateInput(dateInput);
    if (!parsedDate) {
      Alert.alert('Ошибка', 'Введите дату в формате ДД.ММ.ГГГГ');
      return;
    }

    // Фильтруем пустые вопросы
    const filteredQuestions = summaryQuestions.filter((q) => q.trim());

    const cardData = {
      title: title.trim(),
      image_url: imageUrl,
      image_filename: imageFilename,
      photo_question: photoQuestion.trim(),
      summary_questions: filteredQuestions,
      audio_url: audioUrl,
      audio_filename: audioFilename,
      card_date: parsedDate,
    };

    if (editingCard) {
      // Обновление
      const ok = await updateDailyCard(editingCard.id, cardData);
      if (ok) {
        setCards(
          cards.map((c) =>
            c.id === editingCard.id ? { ...c, ...cardData } : c
          )
        );
        setShowModal(false);
        resetForm();
        Alert.alert('Готово', 'Карточка обновлена');
      } else {
        Alert.alert('Ошибка', 'Не удалось обновить карточку. Возможно, на эту дату уже есть карточка.');
      }
    } else {
      // Создание
      const newCard = await createDailyCard(cardData);
      if (newCard) {
        setCards([newCard, ...cards]);
        setShowModal(false);
        resetForm();
        Alert.alert('Готово', 'Карточка создана');
      } else {
        Alert.alert('Ошибка', 'Не удалось создать карточку. Возможно, на эту дату уже есть карточка.');
      }
    }
  };

  const handleDelete = (card: DailyCard) => {
    Alert.alert(
      'Удалить карточку?',
      `"${card.title}" — ${formatDateDisplay(card.card_date)}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            if (card.image_filename) {
              await deleteFile(card.image_filename).catch(() => {});
            }
            if (card.audio_filename) {
              await deleteFile(card.audio_filename).catch(() => {});
            }
            const ok = await deleteDailyCard(card.id);
            if (ok) {
              setCards(cards.filter((c) => c.id !== card.id));
            }
          },
        },
      ]
    );
  };

  const addQuestionField = () => {
    if (summaryQuestions.length < 6) {
      setSummaryQuestions([...summaryQuestions, '']);
    }
  };

  const removeQuestionField = (index: number) => {
    if (summaryQuestions.length > 1) {
      setSummaryQuestions(summaryQuestions.filter((_, i) => i !== index));
    }
  };

  const updateQuestionField = (index: number, value: string) => {
    const updated = [...summaryQuestions];
    updated[index] = value;
    setSummaryQuestions(updated);
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.backButton}>
              <FontAwesome name="arrow-left" size={16} color={colors.primary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.accessDenied}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Слово стаи</Text>
          <TouchableOpacity
            style={[styles.addButton, uploading && styles.addButtonDisabled]}
            onPress={openCreateModal}
            disabled={uploading}
          >
            <FontAwesome name="plus" size={14} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="puzzle-piece" size={48} color={colors.primary} />
            <Text style={styles.emptyText}>Нет карточек</Text>
            <Text style={styles.emptyHint}>Нажмите + чтобы создать</Text>
          </View>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardCard}>
              <Image source={{ uri: card.image_url }} style={styles.cardPreview} />

              <View style={styles.cardInfo}>
                <Text style={styles.cardDate}>{formatDateDisplay(card.card_date)}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                <Text style={styles.cardQuestion} numberOfLines={1}>{card.photo_question}</Text>
                {card.summary_questions.length > 0 && (
                  <Text style={styles.cardSummary}>
                    {card.summary_questions.length} вопрос(ов) для итогов
                  </Text>
                )}
                {card.audio_url && (
                  <View style={styles.audioBadge}>
                    <FontAwesome name="headphones" size={10} color={colors.primary} />
                    <Text style={styles.audioBadgeText}>Аудио</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => openEditModal(card)} style={styles.actionButton}>
                  <FontAwesome name="pencil" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(card)} style={styles.actionButton}>
                  <FontAwesome name="trash-o" size={14} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Модалка создания/редактирования */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingCard ? 'Редактировать карточку' : 'Новая карточка'}
              </Text>

              {/* Заголовок */}
              <Text style={styles.modalLabel}>Заголовок *</Text>
              <TextInput
                style={styles.modalInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Тема дня"
                placeholderTextColor={colors.textMuted}
              />

              {/* Дата */}
              <Text style={styles.modalLabel}>Дата (ДД.ММ.ГГГГ) *</Text>
              <TextInput
                style={styles.modalInput}
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="10.03.2026"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={10}
              />

              {/* Фото */}
              <Text style={styles.modalLabel}>Фото *</Text>
              {imageUrl ? (
                <View style={styles.imagePreviewRow}>
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                  <TouchableOpacity
                    onPress={() => {
                      if (imageFilename) deleteFile(imageFilename).catch(() => {});
                      setImageUrl(null);
                      setImageFilename(null);
                    }}
                    style={styles.removeImageButton}
                  >
                    <FontAwesome name="times" size={14} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadImage}>
                  <FontAwesome name="cloud-upload" size={20} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Загрузить фото</Text>
                </TouchableOpacity>
              )}

              {/* Вопрос к фото */}
              <Text style={styles.modalLabel}>Вопрос к фото *</Text>
              <TextInput
                style={styles.modalInput}
                value={photoQuestion}
                onChangeText={setPhotoQuestion}
                placeholder="Что вы чувствуете, глядя на это?"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              {/* Вопросы для итогов */}
              <View style={styles.modalLabelRow}>
                <Text style={styles.modalLabel}>Вопросы для итогов (4-6)</Text>
                {summaryQuestions.length < 6 && (
                  <TouchableOpacity onPress={addQuestionField}>
                    <FontAwesome name="plus-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {summaryQuestions.map((q, i) => (
                <View key={i} style={styles.questionRow}>
                  <TextInput
                    style={[styles.modalInput, styles.questionInput]}
                    value={q}
                    onChangeText={(v) => updateQuestionField(i, v)}
                    placeholder={`Вопрос ${i + 1}`}
                    placeholderTextColor={colors.textMuted}
                  />
                  {summaryQuestions.length > 1 && (
                    <TouchableOpacity onPress={() => removeQuestionField(i)} style={styles.removeQuestionButton}>
                      <FontAwesome name="times" size={12} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Аудио */}
              <Text style={styles.modalLabel}>Аудио (опционально)</Text>
              {audioUrl ? (
                <View style={styles.audioPreviewRow}>
                  <FontAwesome name="headphones" size={20} color={colors.primary} />
                  <Text style={styles.audioPreviewText} numberOfLines={1}>Аудио загружено</Text>
                  <TouchableOpacity onPress={handleRemoveAudio} style={styles.removeAudioButton}>
                    <FontAwesome name="times" size={14} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadAudio}>
                  <FontAwesome name="cloud-upload" size={20} color={colors.primary} />
                  <Text style={styles.uploadButtonText}>Загрузить аудио</Text>
                </TouchableOpacity>
              )}

              {/* Кнопки */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.modalCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSave}>
                  <Text style={styles.modalSaveText}>
                    {editingCard ? 'Сохранить' : 'Создать'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
    paddingBottom: 12,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
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
  },
  cardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  cardDate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  cardQuestion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardSummary: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  audioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  audioBadgeText: {
    fontSize: 10,
    color: colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha10,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  // Модалка
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: colors.text,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionInput: {
    flex: 1,
  },
  removeQuestionButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    paddingVertical: 20,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  removeImageButton: {
    marginLeft: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  audioPreviewText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  removeAudioButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha10,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
