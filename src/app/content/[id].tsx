import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getContentById } from '../../services/api';
import { ContentItem } from '../../types';
import { AudioPlayer } from '../../components/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer';
import { BookmarkButton } from '../../components/BookmarkButton';
import { CommentsSection } from '../../components/CommentsSection';
import { PremiumGate } from '../../components/PremiumGate';
import { useSubscription } from '../../hooks/useAuth';

// Экран детального просмотра контента
export default function ContentDetailScreen() {
  const { id, replyTo } = useLocalSearchParams<{ id: string; replyTo?: string }>();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasAccess } = useSubscription();

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
      } else {
        setError('Контент не найден');
      }
    } catch (err) {
      console.error('Ошибка загрузки контента:', err);
      setError('Не удалось загрузить контент');
    } finally {
      setLoading(false);
    }
  };

  // Иконка типа контента
  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

  // Название типа контента
  const getTypeName = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'video': return 'Видео';
      case 'audio': return 'Аудио';
      case 'course': return 'Курс';
      default: return 'Контент';
    }
  };

  // Дата публикации
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
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  if (error || !content) {
    return (
        <View style={styles.centered}>
          <FontAwesome name="exclamation-triangle" size={48} color="#6c63ff" />
        <Text style={styles.errorText}>{error || 'Контент не найден'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Извлекаем данные из content_data
  const body = (content.content_data as { body?: string })?.body || '';
  const audioUrl = (content.content_data as { audio_url?: string })?.audio_url;
  const videoUrl = (content.content_data as { video_url?: string })?.video_url;

  const isAudioContent = content.type === 'audio' && audioUrl;
  const isVideoContent = content.type === 'video' && videoUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Шапка с кнопкой назад */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color="#6c63ff" />
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {content.is_premium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>Премиум</Text>
              </View>
            )}
            <BookmarkButton contentId={content.id} />
          </View>
        </View>

        {/* Контент — скроллится с клавиатурой */}
        <KeyboardAwareScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          {/* Тип и категория */}
          <View style={styles.meta}>
            <FontAwesome name={getTypeIcon(content.type) as any} size={18} color="#6c63ff" style={styles.typeIcon} />
            <Text style={styles.typeName}>{getTypeName(content.type)}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.category}>{content.category}</Text>
          </View>

          {/* Заголовок */}
          <Text style={styles.title}>{content.title}</Text>

          {/* Описание */}
          {content.description && (
            <Text style={styles.description}>{content.description}</Text>
          )}

          {/* Дата */}
          <Text style={styles.date}>{formatDate(content.created_at)}</Text>

          {/* Разделитель */}
          <View style={styles.divider} />

        {/* Медиа-плеер (видео / аудио) или текст — с PremiumGate для премиум-контента */}
        {content.is_premium && !hasAccess(content.subscription_tier || 'path') ? (
          <PremiumGate
            requiredTier={content.subscription_tier || 'path'}
            contentTitle={content.title}
          >
            {/* Контент (размыт за замком) */}
            <View>
              {isVideoContent ? (
                <VideoPlayer uri={videoUrl!} title={content.title} />
              ) : isAudioContent ? (
                <AudioPlayer uri={audioUrl!} title={content.title} />
              ) : body ? (
                <Text style={styles.body}>{body}</Text>
              ) : (
                <View style={styles.noContent}>
                  <FontAwesome name="envelope-o" size={48} color="#6c63ff" />
                  <Text style={styles.noContentText}>Контент пока не добавлен</Text>
                </View>
              )}
            </View>
          </PremiumGate>
        ) : (
          <>
            {isVideoContent ? (
              <VideoPlayer uri={videoUrl!} title={content.title} />
            ) : isAudioContent ? (
              <AudioPlayer uri={audioUrl!} title={content.title} />
            ) : body ? (
              <Text style={styles.body}>{body}</Text>
            ) : (
            <View style={styles.noContent}>
              <FontAwesome name="envelope-o" size={48} color="#6c63ff" />
                <Text style={styles.noContentText}>Контент пока не добавлен</Text>
              </View>
            )}
          </>
        )}

        {/* Разделитель перед комментариями */}
        <View style={styles.divider} />

        {/* Комментарии с модалкой ввода */}
        <CommentsSection contentId={content.id} replyTo={replyTo} />

        {/* Дополнительный отступ внизу */}
        <View style={{ height: 20 }} />
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
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
    color: '#6c63ff',
    fontSize: 16,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: '#6c63ff22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  premiumText: {
    color: '#6c63ff',
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
    color: '#6c63ff',
    fontWeight: '600',
  },
  dot: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  category: {
    fontSize: 14,
    color: '#999',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#999',
    marginBottom: 12,
    lineHeight: 24,
  },
  date: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 28,
    marginBottom: 40,
  },
  noContent: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  noContentText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
