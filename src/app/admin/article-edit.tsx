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
  Image,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getContentById, createContent, updateContent, getAllUserIds, getUserNotificationPrefs } from '../../services/api';
import { sendImmediatePush } from '../../services/notifications';
import { ContentItem, ContentType, GalleryImage } from '../../types';
import { pickFile, pickImageFiles, uploadFile, UploadFileType } from '../../utils/upload';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { CategoryInput } from '../../components/CategoryInput';
import { parseGalleryImages, toStoredGallery } from '../../utils/gallery';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

const CONTENT_TYPES: { key: ContentType; label: string }[] = [
  { key: 'article', label: 'Статья' },
  { key: 'video', label: 'Видео' },
  { key: 'audio', label: 'Аудио' },
  { key: 'course', label: 'Курс' },
];

const TIERS: { key: ContentItem['subscription_tier']; label: string }[] = [
  { key: 'free', label: 'Бесплатно' },
  { key: 'path', label: 'Путь' },
  { key: 'awakening', label: 'Пробуждение' },
];

export default function ArticleEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFilename, setImageFilename] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFilename, setAudioFilename] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFilename, setVideoFilename] = useState('');
  // Фотокарусель статьи (обычная и платная)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [premiumGalleryImages, setPremiumGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryUpload, setGalleryUpload] = useState<{ current: number; total: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [type, setType] = useState<ContentType>('article');
  const [category, setCategory] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<ContentItem['subscription_tier']>('free');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Премиум-контент (то, что скрывается за подпиской)
  const [premiumBody, setPremiumBody] = useState('');
  const [premiumAudioUrl, setPremiumAudioUrl] = useState('');
  const [premiumAudioFilename, setPremiumAudioFilename] = useState('');
  const [premiumVideoUrl, setPremiumVideoUrl] = useState('');
  const [premiumVideoFilename, setPremiumVideoFilename] = useState('');

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
        setImageUrl((article.content_data as { image_url?: string })?.image_url || '');
        setImageFilename((article.content_data as { image_filename?: string })?.image_filename || '');
        setAudioUrl((article.content_data as { audio_url?: string })?.audio_url || '');
        setAudioFilename((article.content_data as { audio_filename?: string })?.audio_filename || '');
        setVideoUrl((article.content_data as { video_url?: string })?.video_url || '');
        setVideoFilename((article.content_data as { video_filename?: string })?.video_filename || '');
        setType(article.type);
        setCategory(article.category);
        setIsPremium(article.is_premium);
        setSubscriptionTier(article.subscription_tier);

        // Загрузка премиум-контента
        const cd = article.content_data as Record<string, any>;
        setPremiumBody(cd?.premium_body || '');
        setPremiumAudioUrl(cd?.premium_audio_url || '');
        setPremiumAudioFilename(cd?.premium_audio_filename || '');
        setPremiumVideoUrl(cd?.premium_video_url || '');
        setPremiumVideoFilename(cd?.premium_video_filename || '');

        // Фотокарусель статьи
        setGalleryImages(parseGalleryImages(cd?.images));
        setPremiumGalleryImages(parseGalleryImages(cd?.premium_images));
      }
    } catch (error) {
      console.error('Ошибка загрузки статьи:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (fileType: UploadFileType) => {
    try {
      const file = await pickFile(fileType);
      if (!file) return;

      setUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, fileType, setUploadProgress);

      if (fileType === 'image') {
        setImageUrl(result.url);
        setImageFilename(result.filename);
      } else if (fileType === 'audio') {
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

  const handleRemoveFile = (fileType: UploadFileType) => {
    if (fileType === 'image') {
      setImageUrl('');
      setImageFilename('');
    } else if (fileType === 'audio') {
      setAudioUrl('');
      setAudioFilename('');
    } else if (fileType === 'video') {
      setVideoUrl('');
      setVideoFilename('');
    }
  };

  const handleUploadPremiumFile = async (fileType: 'audio' | 'video') => {
    try {
      const file = await pickFile(fileType);
      if (!file) return;

      setUploading(true);
      setUploadProgress(0);

      const result = await uploadFile(file, fileType, setUploadProgress);

      if (fileType === 'audio') {
        setPremiumAudioUrl(result.url);
        setPremiumAudioFilename(result.filename);
      } else if (fileType === 'video') {
        setPremiumVideoUrl(result.url);
        setPremiumVideoFilename(result.filename);
      }

      Alert.alert('Готово', 'Премиум-файл загружен');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить файл';
      Alert.alert('Ошибка', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePremiumFile = (fileType: 'audio' | 'video') => {
    if (fileType === 'audio') {
      setPremiumAudioUrl('');
      setPremiumAudioFilename('');
    } else if (fileType === 'video') {
      setPremiumVideoUrl('');
      setPremiumVideoFilename('');
    }
  };

  // ----- Фотокарусель статьи -----
  type GalleryTarget = 'public' | 'premium';

  const setGalleryByTarget = (
    target: GalleryTarget,
    updater: (prev: GalleryImage[]) => GalleryImage[]
  ) => {
    if (target === 'public') {
      setGalleryImages(updater);
    } else {
      setPremiumGalleryImages(updater);
    }
  };

  // Выбор пачкой, загрузка по очереди — ошибка одного файла не отменяет остальные
  const handleAddGalleryImages = async (target: GalleryTarget) => {
    try {
      const files = await pickImageFiles();
      if (files.length === 0) return;

      setUploading(true);
      setUploadProgress(0);
      setGalleryUpload({ current: 0, total: files.length });

      const uploaded: GalleryImage[] = [];
      let failed = 0;

      for (let i = 0; i < files.length; i++) {
        setGalleryUpload({ current: i + 1, total: files.length });
        try {
          const result = await uploadFile(files[i], 'image', setUploadProgress);
          uploaded.push({ url: result.url, filename: result.filename });
        } catch (error) {
          console.error('Ошибка загрузки фото галереи:', error);
          failed += 1;
        }
      }

      if (uploaded.length > 0) {
        setGalleryByTarget(target, (prev) => [...prev, ...uploaded]);
      }

      if (failed > 0) {
        Alert.alert(
          'Загрузка завершена',
          `Не удалось загрузить ${failed} из ${files.length} файлов. Остальные добавлены в карусель.`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить изображения';
      Alert.alert('Ошибка', message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setGalleryUpload(null);
    }
  };

  const handleRemoveGalleryImage = (target: GalleryTarget, index: number) => {
    setGalleryByTarget(target, (prev) => prev.filter((_, i) => i !== index));
  };

  // Порядок фото в редакторе = порядок слайдов в карусели
  const handleMoveGalleryImage = (target: GalleryTarget, index: number, direction: -1 | 1) => {
    setGalleryByTarget(target, (prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

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

      const contentData: Record<string, unknown> = {};
      if (imageUrl.trim()) {
        contentData.image_url = imageUrl.trim();
        contentData.image_filename = imageFilename;
      }

      // Текст — для любого типа контента (статья, видео, аудио, курс)
      if (body.trim()) {
        contentData.body = body.trim();
      }

      // Фотокарусель статьи (обычный набор)
      if (galleryImages.length > 0) {
        contentData.images = toStoredGallery(galleryImages);
      }

      if (type === 'audio') {
        contentData.audio_url = audioUrl.trim();
        contentData.audio_filename = audioFilename;
      } else if (type === 'video') {
        contentData.video_url = videoUrl.trim();
        contentData.video_filename = videoFilename;
      }

      // Премиум-контент
      if (isPremium) {
        // Платный текст — для любого типа контента
        if (premiumBody.trim()) {
          contentData.premium_body = premiumBody.trim();
        }

        // Платная фотокарусель статьи
        if (premiumGalleryImages.length > 0) {
          contentData.premium_images = toStoredGallery(premiumGalleryImages);
        }

        if (type === 'audio' && premiumAudioUrl.trim()) {
          contentData.premium_audio_url = premiumAudioUrl.trim();
          contentData.premium_audio_filename = premiumAudioFilename;
        } else if (type === 'video' && premiumVideoUrl.trim()) {
          contentData.premium_video_url = premiumVideoUrl.trim();
          contentData.premium_video_filename = premiumVideoFilename;
        }
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

          // Отправляем push-уведомление о новой статье
          try {
            const allUserIds = await getAllUserIds();
            const prefs = await getUserNotificationPrefs(allUserIds);
            const subscribedIds = prefs
              .filter((p) => p.notif_articles)
              .map((p) => p.id);

            if (subscribedIds.length > 0) {
              await sendImmediatePush(
                subscribedIds,
                'Новая публикация',
                `${title.trim()}`,
                { screen: 'content', contentId: result.id }
              );
            }
          } catch (pushError) {
            console.error('Ошибка отправки push о новой статье:', pushError);
          }

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

  const styles = createStyles(colors);

  // Блок управления фотокаруселью (обычной или платной)
  const renderGalleryEditor = (
    target: GalleryTarget,
    title: string,
    hint: string,
    images: GalleryImage[],
    premium = false
  ) => (
    <View style={styles.field}>
      {premium ? (
        <View style={styles.premiumSectionHeader}>
          <FontAwesome name="lock" size={14} color={colors.primary} />
          <Text style={styles.premiumSectionTitle}>{title}</Text>
        </View>
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
      <Text style={styles.hint}>{hint}</Text>

      {images.length > 0 && (
        <View style={styles.galleryGrid}>
          {images.map((image, index) => (
            <View key={`${image.url}-${index}`} style={styles.galleryItem}>
              <Image
                source={{ uri: image.url }}
                style={styles.galleryThumb}
                resizeMode="cover"
              />
              <View style={styles.galleryItemActions}>
                <TouchableOpacity
                  style={[
                    styles.galleryIconButton,
                    (index === 0 || uploading) && styles.galleryIconButtonDisabled,
                  ]}
                  onPress={() => handleMoveGalleryImage(target, index, -1)}
                  disabled={index === 0 || uploading}
                >
                  <FontAwesome name="chevron-left" size={10} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.galleryIconButton, uploading && styles.galleryIconButtonDisabled]}
                  onPress={() => handleRemoveGalleryImage(target, index)}
                  disabled={uploading}
                >
                  <FontAwesome name="times" size={11} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.galleryIconButton,
                    (index === images.length - 1 || uploading) && styles.galleryIconButtonDisabled,
                  ]}
                  onPress={() => handleMoveGalleryImage(target, index, 1)}
                  disabled={index === images.length - 1 || uploading}
                >
                  <FontAwesome name="chevron-right" size={10} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={() => handleAddGalleryImages(target)}
        disabled={uploading}
      >
        {uploading && galleryUpload ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.uploadingText}>
              {galleryUpload.current}/{galleryUpload.total} · {uploadProgress}%
            </Text>
          </View>
        ) : (
          <>
            <FontAwesome name="plus" size={18} color={colors.primary} />
            <Text style={styles.uploadText}>Добавить фото</Text>
            <Text style={styles.uploadHint}>Можно выбрать несколько сразу</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Редактирование' : 'Новая статья'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Заголовок *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Введите заголовок"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Краткое описание"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Категория *</Text>
          <CategoryInput
            value={category}
            onChangeText={setCategory}
            colors={colors}
            placeholder="meditation, practice, spiritual..."
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Превью изображение</Text>
          {imageUrl ? (
            <View style={styles.filePreview}>
              <View style={styles.fileInfo}>
                <FontAwesome name="image" size={24} color={colors.primary} />
                <Text style={styles.fileName} numberOfLines={1}>
                  {imageFilename || 'preview.jpg'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => handleRemoveFile('image')}
              >
                <Text style={styles.removeFileText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={() => handleUploadFile('image')}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                </View>
              ) : (
                <>
                  <FontAwesome name="image" size={32} color={colors.primary} />
                  <Text style={styles.uploadText}>Выбрать изображение</Text>
                  <Text style={styles.uploadHint}>JPG, PNG, WebP</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

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

        {type === 'article' &&
          renderGalleryEditor(
            'public',
            'Фотографии статьи (карусель)',
            'Показываются в начале статьи, перед текстом. Первое фото — первый слайд. Фото не обрезаются, высота кадра одинаковая.',
            galleryImages
          )}

        {type === 'article' &&
          isPremium &&
          renderGalleryEditor(
            'premium',
            'Платные фотографии статьи',
            'Видят только участники с доступом. Если не заполнено — показывается обычная карусель.',
            premiumGalleryImages,
            true
          )}

        {type === 'audio' && (
          <View style={styles.field}>
            <Text style={styles.label}>Аудио файл *</Text>
            {audioUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="music" size={24} color={colors.primary} />
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
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="music" size={32} color={colors.primary} />
                    <Text style={styles.uploadText}>Выбрать аудио файл</Text>
                    <Text style={styles.uploadHint}>MP3, WAV, OGG</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {type === 'video' && (
          <View style={styles.field}>
            <Text style={styles.label}>Видео файл *</Text>
            {videoUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="film" size={24} color={colors.primary} />
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
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="film" size={32} color={colors.primary} />
                    <Text style={styles.uploadText}>Выбрать видео файл</Text>
                    <Text style={styles.uploadHint}>MP4, MOV, WebM</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Текст доступен для любого типа контента: статья, видео, аудио, курс */}
        <View style={styles.field}>
          <Text style={styles.label}>Текст статьи (Markdown)</Text>
          <MarkdownEditor
            value={body}
            onChangeText={setBody}
            placeholder="Пишите текст в формате Markdown..."
          />
          <Text style={styles.hint}>
            Необязательно: текст можно добавить к любому типу контента — у видео и аудио он покажется под плеером.
          </Text>
          <Text style={styles.hint}>
            **жирный** _курсив_ ~~зачёркивание~~ ## заголовки - списки {'>'} цитаты `код` [ссылки](url) ![картинки](url)
          </Text>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Платный контент</Text>
          <Switch
            value={isPremium}
            onValueChange={setIsPremium}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isPremium ? colors.onPrimary : colors.textSecondary}
          />
        </View>

        {isPremium && (
          <View style={styles.field}>
            <Text style={styles.label}>Требуемый доступ</Text>
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

        {isPremium && (
          <View style={styles.field}>
            <View style={styles.premiumSectionHeader}>
              <FontAwesome name="lock" size={14} color={colors.primary} />
              <Text style={styles.premiumSectionTitle}>Платный текст статьи</Text>
            </View>
            <Text style={styles.hint}>
              Эта часть будет скрыта за подпиской. Показывается только подписчикам.
            </Text>
            <MarkdownEditor
              value={premiumBody}
              onChangeText={setPremiumBody}
              placeholder="Платная часть статьи..."
            />
          </View>
        )}

        {isPremium && type === 'audio' && (
          <View style={styles.field}>
            <View style={styles.premiumSectionHeader}>
              <FontAwesome name="lock" size={14} color={colors.primary} />
              <Text style={styles.premiumSectionTitle}>Платный аудио файл</Text>
            </View>
            {premiumAudioUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="music" size={24} color={colors.primary} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {premiumAudioFilename || 'premium_audio.mp3'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemovePremiumFile('audio')}
                >
                  <Text style={styles.removeFileText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={() => handleUploadPremiumFile('audio')}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="music" size={32} color={colors.primary} />
                    <Text style={styles.uploadText}>Выбрать премиум аудио</Text>
                    <Text style={styles.uploadHint}>Полная версия для подписчиков</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {isPremium && type === 'video' && (
          <View style={styles.field}>
            <View style={styles.premiumSectionHeader}>
              <FontAwesome name="lock" size={14} color={colors.primary} />
              <Text style={styles.premiumSectionTitle}>Платный видео файл</Text>
            </View>
            {premiumVideoUrl ? (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <FontAwesome name="film" size={24} color={colors.primary} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {premiumVideoFilename || 'premium_video.mp4'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => handleRemovePremiumFile('video')}
                >
                  <Text style={styles.removeFileText}>Удалить</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={() => handleUploadPremiumFile('video')}
                disabled={uploading}
              >
                {uploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.uploadingText}>{uploadProgress}%</Text>
                  </View>
                ) : (
                  <>
                    <FontAwesome name="film" size={32} color={colors.primary} />
                    <Text style={styles.uploadText}>Выбрать премиум видео</Text>
                    <Text style={styles.uploadHint}>Полная версия для подписчиков</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.primary,
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
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
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  textArea: {
    height: 200,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    flex: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryItem: {
    width: 96,
  },
  galleryThumb: {
    width: 96,
    height: 96,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  galleryItemActions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  galleryIconButton: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primaryAlpha13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIconButtonDisabled: {
    opacity: 0.3,
  },
  removeFileButton: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeFileText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  premiumSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
