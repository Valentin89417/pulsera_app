import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getContentById, createContent, updateContent } from '../../services/api';
import { ContentItem, ContentType } from '../../types';
import { pickFile, uploadFile, UploadFileType } from '../../utils/upload';

// Типы контента
const CONTENT_TYPES: { key: ContentType; label: string }[] = [
  { key: 'article', label: 'Статья' },
  { key: 'video', label: 'Видео' },
  { key: 'audio', label: 'Аудио' },
  { key: 'course', label: 'Курс' },
];

// Тарифы
const TIERS: { key: ContentItem['subscription_tier']; label: string }[] = [
  { key: 'free', label: 'Бесплатно' },
  { key: 'path', label: 'Путь' },
  { key: 'awakening', label: 'Пробуждение' },
];

// Экран создания/редактирования статьи
export default function ArticleEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFilename, setAudioFilename] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFilename, setVideoFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [type, setType] = useState<ContentType>('article');
  const [category, setCategory] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<ContentItem['subscription_tier']>('free');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Загрузка статьи при редактировании
  useEffect(() => {
    if (isEditing) {
      loadArticle();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const article = await getContentById(id!);
      if (article) {
        setTitle(article.title);
        setDescription(article.description || '');
        setBody((article.content_data as { body?: string })?.body || '');
        setAudioUrl((article.content_data as { audio_url?: string })?.audio_url || '');
        setAudioFilename((article.content_data as { audio_filename?: string })?.audio_filename || '');
        setVideoUrl((article.content_data as { video_url?: string })?.video_url || '');
        setVideoFilename((article.content_data as { video_filename?: string })?.video_filename || '');
        setType(article.type);
        setCategory(article.category);
        setIsPremium(article.is_premium);
        setSubscriptionTier(article.subscription_tier);
      }
    } catch (error) {
      console.error('Ошибка загрузки статьи:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка файла
  const handleUploadFile = async (fileType: UploadFileType) => {
    try {
      const file = await pickFile(fileType);
      if (!file) return;

      setUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, fileType, setUploadProgress);

      if (fileType === 'audio') {
        setAudioUrl(result.url);
        setAudioFilename(result.filename);
      } else if (fileType === 'video') {
        setVideoUrl(result.url);
        setVideoFilename(result.filename);
      }

      Alert.alert('Готово', 'Файл загружен');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить файл';
      Alert.alert('Ошибка', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Удалить загруженный файл
  const handleRemoveFile = (fileType: UploadFileType) => {
    if (fileType === 'audio') {
      setAudioUrl('');
      setAudioFilename('');
    } else if (fileType === 'video') {
      setVideoUrl('');
      setVideoFilename('');
    }
  };

  // Сохранение
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите заголовок');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Ошибка', 'Введите категорию');
      return;
    }

    try {
      setSaving(true);

      // Формируем content_data в зависимости от типа
      const contentData: Record<string, unknown> = {};
      if (type === 'article') {
        contentData.body = body.trim();
      } else if (type === 'audio') {
        contentData.audio_url = audioUrl.trim();
        contentData.audio_filename = audioFilename;
      } else if (type === 'video') {
        contentData.video_url = videoUrl.trim();
        contentData.video_filename = videoFilename;
      }

      console.log('[SAVE] type:', type, 'contentData:', contentData);

      if (isEditing) {
        const result = await updateContent(id!, {
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          category: category.trim(),
          content_data: contentData,
          is_premium: isPremium,
          subscription_tier: subscriptionTier,
        });

        if (result) {
          console.log('[SAVE] saved content_data:', result.content_data);
          Alert.alert('Готово', 'Статья обновлена', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      } else {
        const result = await createContent({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          category: category.trim(),
          content_data: contentData,
          is_premium: isPremium,
          subscription_tier: subscriptionTier,
        });

        if (result) {
          console.log('[SAVE] created content_data:', result.content_data);
          Alert.alert('Готово', 'Статья создана', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color="#6c63ff" />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Редактирование' : 'Новая статья'}
        </Text>
      </View>

      {/* Форма */}
      <View style={styles.form}>
        {/* Заголовок */}
        <View style={styles.field}>
          <Text style={styles.label}>Заголовок *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введите заголовок"
            placeholderTextColor="#666"
          />
        </View>

        {/* Описание */}
        <View style={styles.field}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Краткое описание"
            placeholderTextColor="#666"
          />
        </View>

        {/* Категория */}
        <View style={styles.field}>
          <Text style={styles.label}>Категория *</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="meditation, practice, spiritual..."
            placeholderTextColor="#666"
          />
        </View>

        {/* Тип контента */}
        <View style={styles.field}>
          <Text style={styles.label}>Тип контента</Text>
          <View style={styles.chipRow}>
            {CONTENT_TYPES.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.chip, type === item.key && styles.chipActive]}
                onPress={() => setType(item.key)}
              >
                <Text style={[styles.chipText, type === item.key && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Поле для загрузки аудио (только для типа audio) */}
        {type === 'audio' && (
          <View style={styles.field}>
            <Text style={styles.label}>Аудио файл *</Text>
            {audioUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="music" size={24} color="#6c63ff" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {audioFilename || 'audio.mp3'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemoveFile('audio')}
                >
                  <Text style={styles.removeFileText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={() => handleUploadFile('audio')}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#6c63ff" size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="music" size={32} color="#6c63ff" />
                    <Text style={styles.uploadText}>Выбрать аудио файл</Text>
                    <Text style={styles.uploadHint}>MP3, WAV, OGG (до 50 МБ)</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Поле для загрузки видео (только для типа video) */}
        {type === 'video' && (
          <View style={styles.field}>
            <Text style={styles.label}>Видео файл *</Text>
            {videoUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="film" size={24} color="#6c63ff" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {videoFilename || 'video.mp4'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemoveFile('video')}
                >
                  <Text style={styles.removeFileText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={() => handleUploadFile('video')}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color="#6c63ff" size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="film" size={32} color="#6c63ff" />
                    <Text style={styles.uploadText}>Выбрать видео файл</Text>
                    <Text style={styles.uploadHint}>MP4, MOV, WebM (до 50 МБ)</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Поле для текста статьи (только для типа article) */}
        {type === 'article' && (
          <View style={styles.field}>
            <Text style={styles.label}>Текст статьи</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={body}
              onChangeText={setBody}
              placeholder="Полный текст статьи..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Платный контент */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Платный контент</Text>
          <Switch
            value={isPremium}
            onValueChange={setIsPremium}
            trackColor={{ false: '#333', true: '#6c63ff' }}
            thumbColor={isPremium ? '#fff' : '#999'}
          />
        </View>

        {/* Тариф */}
        {isPremium && (
          <View style={styles.field}>
            <Text style={styles.label}>Требуемый тариф</Text>
            <View style={styles.chipRow}>
              {TIERS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.chip, subscriptionTier === item.key && styles.chipActive]}
                  onPress={() => setSubscriptionTier(item.key)}
                >
                  <Text style={[styles.chipText, subscriptionTier === item.key && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Кнопка сохранить */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Сохранить' : 'Создать'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    color: '#6c63ff',
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    paddingHorizontal: 20,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  chipText: {
    color: '#999',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#666',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#6c63ff',
    fontWeight: '600',
  },
  filePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6c63ff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  removeFileButton: {
    backgroundColor: '#ff444422',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeFileText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '600',
  },
});
