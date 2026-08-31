import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { getContentById } from '../../services/api';
import { ContentItem } from '../../types';
import { AudioPlayer } from '../../components/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer';
import { BookmarkButton } from '../../components/BookmarkButton';
import { DownloadButton } from '../../components/DownloadButton';
import { CommentsSection } from '../../components/CommentsSection';
import { useSubscription } from '../../hooks/useAuth';
import { readDownloadedArticle, getDownloadedMediaUri } from '../../utils/offlineCache';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import { getMarkdownStyles } from '../../utils/markdownStyles';
import { MarkdownImage } from '../../components/MarkdownImage';

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeName: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  dot: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 24,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  bodyContainer: {
    marginBottom: 40,
  },
  noContent: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  noContentText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  premiumBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  premiumDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primaryAlpha27,
  },
  premiumLockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryAlpha13,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  premiumTier: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  premiumButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ContentDetailScreen() {
  const { id, replyTo } = useLocalSearchParams<{ id: string; replyTo?: string }>();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offlineBody, setOfflineBody] = useState<string | null>(null);
  const [offlineMediaUri, setOfflineMediaUri] = useState<string | null>(null);
  const { hasAccess } = useSubscription();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const markdownStyles = getMarkdownStyles(colors);

  // Кастомное правило для images — используем MarkdownImage с определением пропорций
  const markdownRules = {
    image: (node: any) => {
      const { src, alt } = node.attributes;
      return (
        <MarkdownImage key={node.key} uri={src} alt={alt} />
      );
    },
  };

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getContentById(id);
      if (data) {
        setContent(data);

        // Проверяем офлайн-кэш для контента
        const body = (data.content_data as { body?: string })?.body;
        const audioUrl = (data.content_data as { audio_url?: string })?.audio_url;
        const videoUrl = (data.content_data as { video_url?: string })?.video_url;

        // Проверяем офлайн-кэш: если файл скачан — используем локальный
        if (data.type === 'article') {
          const cached = await readDownloadedArticle(data.id);
          if (cached) setOfflineBody(cached);
        }

        if (data.type === 'audio') {
          const localUri = await getDownloadedMediaUri(data.id, 'audio');
          if (localUri) {
            setOfflineMediaUri(localUri);
          }
        }

        if (data.type === 'video') {
          const localUri = await getDownloadedMediaUri(data.id, 'video');
          if (localUri) {
            setOfflineMediaUri(localUri);
          }
        }
      } else {
        setError('Контент не найден');
      }
    } catch (err) {
      console.error('Ошибка загрузки контента:', err);
      // Пробуем загрузить из кэша
      if (id) {
        const cachedText = await readDownloadedArticle(id);
        if (cachedText) {
          setOfflineBody(cachedText);
          setError(null);
        } else {
          setError('Не удалось загрузить контент');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

  const getTypeName = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'video': return 'Видео';
      case 'audio': return 'Аудио';
      case 'course': return 'Курс';
      default: return 'Контент';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !content) {
    return (
        <View style={styles.centered}>
          <FontAwesome name="exclamation-triangle" size={48} color={colors.primary} />
        <Text style={styles.errorText}>{error || 'Контент не найден'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const body = offlineBody || (content.content_data as { body?: string })?.body || '';
  const audioUrl = offlineMediaUri || (content.content_data as { audio_url?: string })?.audio_url;
  const videoUrl = offlineMediaUri || (content.content_data as { video_url?: string })?.video_url;

  // Премиум-контент
  const cd = content.content_data as Record<string, any>;
  const premiumBody = cd?.premium_body || '';
  const premiumAudioUrl = cd?.premium_audio_url || '';
  const premiumVideoUrl = cd?.premium_video_url || '';

  const isAudioContent = content.type === 'audio' && audioUrl;
  const isVideoContent = content.type === 'video' && videoUrl;
  const hasPremiumContent = content.is_premium && !hasAccess(content.subscription_tier || 'path');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {content.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Премиум</Text>
              </View>
            )}
            <DownloadButton item={content} />
            <BookmarkButton contentId={content.id} />
          </View>
        </View>

        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          <View style={styles.meta}>
            <FontAwesome name={getTypeIcon(content.type) as any} size={18} color={colors.primary} style={styles.typeIcon} />
            <Text style={styles.typeName}>{getTypeName(content.type)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.category}>{content.category}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          {content.description && (
            <Text style={styles.description}>{content.description}</Text>
          )}

          <Text style={styles.date}>{formatDate(content.created_at)}</Text>

          <View style={styles.divider} />

          {/* Бесплатный контент */}
          {isVideoContent ? (
            <VideoPlayer uri={videoUrl!} title={content.title} />
          ) : isAudioContent ? (
            <AudioPlayer uri={audioUrl!} title={content.title} />
          ) : body ? (
            <View style={styles.bodyContainer}>
              <Markdown style={markdownStyles} rules={markdownRules}>{body}</Markdown>
            </View>
          ) : (
            <View style={styles.noContent}>
              <FontAwesome name="envelope-o" size={48} color={colors.primary} />
              <Text style={styles.noContentText}>Контент пока не добавлен</Text>
            </View>
          )}

          {/* Блок "Подписаться" для премиум-контента */}
          {hasPremiumContent && (
            <View style={styles.premiumBlock}>
              <View style={styles.premiumDivider}>
                <View style={styles.premiumDividerLine} />
                <View style={styles.premiumLockIcon}>
                  <FontAwesome name="lock" size={18} color={colors.primary} />
                </View>
                <View style={styles.premiumDividerLine} />
              </View>
              <Text style={styles.premiumTitle}>Полная версия доступна по подписке</Text>
              <Text style={styles.premiumTier}>
                Тариф: «{content.subscription_tier === 'awakening' ? 'Пробуждение' : 'Путь'}»
              </Text>
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => router.push('/subscription')}
              >
                <Text style={styles.premiumButtonText}>Подписаться</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Премиум-контент (если есть доступ) */}
          {content.is_premium && !hasPremiumContent && (
            <>
              {content.type === 'article' && premiumBody ? (
                <View style={styles.bodyContainer}>
                  <Markdown style={markdownStyles} rules={markdownRules}>{premiumBody}</Markdown>
                </View>
              ) : content.type === 'audio' && premiumAudioUrl ? (
                <AudioPlayer uri={premiumAudioUrl} title={content.title + ' (полная версия)'} />
              ) : content.type === 'video' && premiumVideoUrl ? (
                <VideoPlayer uri={premiumVideoUrl} title={content.title + ' (полная версия)'} />
              ) : null}
            </>
          )}

        <View style={styles.divider} />

        <CommentsSection contentId={content.id} replyTo={replyTo} />

        <View style={{ height: 20 }} />
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
