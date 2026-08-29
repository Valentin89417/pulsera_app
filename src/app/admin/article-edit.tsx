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
import { getContentById, createContent, updateContent } from '../../services/api';
import { ContentItem, ContentType } from '../../types';

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
  const [videoUrl, setVideoUrl] = useState('');
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
        setVideoUrl((article.content_data as { video_url?: string })?.video_url || '');
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
      } else if (type === 'video') {
        contentData.video_url = videoUrl.trim();
      }

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
          <Text style={styles.backButton}>← Назад</Text>
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

        {/* Поле для URL аудио (только для типа audio) */}
        {type === 'audio' && (
          <View style={styles.field}>
            <Text style={styles.label}>URL аудио файла *</Text>
            <TextInput
              style={styles.input}
              value={audioUrl}
              onChangeText={setAudioUrl}
              placeholder="https://...supabase.co/storage/v1/object/public/content/audio/file.mp3"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Загрузите MP3 в Supabase Storage и вставьте URL
            </Text>
          </View>
        )}

        {/* Поле для URL видео (только для типа video) */}
        {type === 'video' && (
          <View style={styles.field}>
            <Text style={styles.label}>URL видео файла *</Text>
            <TextInput
              style={styles.input}
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://...supabase.co/storage/v1/object/public/content/video/file.mp4"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Загрузите MP4 в Supabase Storage и вставьте URL
            </Text>
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
    color: '#6c63ff',
    fontSize: 16,
    marginBottom: 8,
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
});
