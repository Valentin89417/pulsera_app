import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { getContent, deleteContent, updateContent } from '../../services/api';
import { notifyNewContent } from '../../services/notifications';
import { ContentItem } from '../../types';
import { isScheduled, formatPublishLabel } from '../../utils/contentPublish';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

export default function ArticlesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  // id статьи, которая сейчас удаляется: показываем спиннер вместо кнопок
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getContent({ limit: 100 });
      setArticles(data);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadArticles();
    }, [])
  );

  const handleDelete = (item: ContentItem) => {
    // Пока идёт удаление, новые подтверждения не открываем
    if (deletingId) return;

    Alert.alert(
      'Удаление',
      `Удалить "${item.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            // Удаление стирает все файлы статьи из WordPress Media Library —
            // это может занять время, поэтому показываем спиннер вместо кнопок
            setDeletingId(item.id);
            try {
              const success = await deleteContent(item.id);
              if (success) {
                setArticles((prev) => prev.filter((a) => a.id !== item.id));
              } else {
                Alert.alert('Ошибка', 'Не удалось удалить статью. Попробуйте ещё раз.');
              }
            } catch (error) {
              console.error('Ошибка удаления статьи:', error);
              Alert.alert('Ошибка', 'Не удалось удалить статью. Попробуйте ещё раз.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Публикация запланированного материала: дата → «сейчас» + push подписчикам
  const handlePublishNow = (item: ContentItem) => {
    Alert.alert(
      'Опубликовать сейчас',
      `«${item.title}» станет виден всем, подписчики получат push-уведомление.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Опубликовать',
          onPress: async () => {
            const updated = await updateContent(item.id, {
              published_at: new Date().toISOString(),
            });

            if (!updated) {
              Alert.alert('Ошибка', 'Не удалось изменить дату публикации');
              return;
            }

            await notifyNewContent(item.id, item.title);
            await loadArticles();
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'video': return 'Видео';
      case 'audio': return 'Аудио';
      case 'course': return 'Курс';
      default: return '';
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

  const renderArticle = ({ item }: { item: ContentItem }) => (
    <View style={styles.articleCard}>
      <View style={styles.articleInfo}>
        <View style={styles.articleTypeRow}>
          <FontAwesome name={getTypeIcon(item.type) as any} size={14} color={colors.primary} />
          <Text style={styles.articleType}>{getTypeLabel(item.type)}</Text>
        </View>
        <Text style={styles.articleTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.articleMeta}>
          {item.category} · {item.is_premium ? 'Премиум' : 'Бесплатно'}
        </Text>
        {isScheduled(item) && (
          <View style={styles.scheduledRow}>
            <FontAwesome name="clock-o" size={11} color={colors.primary} />
            <Text style={styles.scheduledText}>
              Запланировано · {formatPublishLabel(item.published_at)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.articleActions}>
        {deletingId === item.id ? (
          // Удаление идёт — вместо кнопок показываем спиннер
          <View style={styles.deletingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            {isScheduled(item) && (
              <TouchableOpacity
                style={[styles.publishButton, deletingId !== null && styles.actionDisabled]}
                onPress={() => handlePublishNow(item)}
                disabled={deletingId !== null}
              >
                <FontAwesome name="bullhorn" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.editButton, deletingId !== null && styles.actionDisabled]}
              onPress={() => router.push({ pathname: '/admin/article-edit', params: { id: item.id } })}
              disabled={deletingId !== null}
            >
              <FontAwesome name="pencil" size={18} color={colors.cardIconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, deletingId !== null && styles.actionDisabled]}
              onPress={() => handleDelete(item)}
              disabled={deletingId !== null}
            >
              <FontAwesome name="trash-o" size={18} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Управление статьями</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/admin/article-edit')}
          >
            <Text style={styles.addButtonText}>+ Создать</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="file-text-o" size={48} color={colors.primary} />
              <Text style={styles.emptyText}>Пока нет статей</Text>
              <Text style={styles.emptyHint}>Нажмите "Создать" чтобы добавить первую</Text>
            </View>
          }
        />
      )}
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
  articleTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  articleInfo: {
    flex: 1,
  },
  articleType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  articleMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  scheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  scheduledText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  publishButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Место под спиннер: сохраняем ширину двух кнопок, чтобы карточка не дёргалась
  deletingBox: {
    minWidth: 88,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.4,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.cardIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  loader: {
    marginTop: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
