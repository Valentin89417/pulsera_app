import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { getContent } from '../../services/api';
import { ContentItem, ContentType } from '../../types';
import { DownloadButton } from '../../components/DownloadButton';
import { BookmarkButton } from '../../components/BookmarkButton';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

const FILTERS: { key: ContentType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Все', icon: 'magic' },
  { key: 'article', label: 'Статьи', icon: 'file-text-o' },
  { key: 'video', label: 'Видео', icon: 'film' },
  { key: 'audio', label: 'Аудио', icon: 'headphones' },
  { key: 'course', label: 'Курсы', icon: 'book' },
];

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.onPrimary,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  // Карточка с изображением
  cardWithImage: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 21 / 9,
    backgroundColor: colors.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.cardIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCategory: {
    fontSize: 12,
    color: colors.textMuted,
  },
  premiumBadge: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  // Карточка без изображения (текущий вид)
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minHeight: 100,
  },
  cardLeft: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 14,
  },
  cardType: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.cardIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTypeIcon: {
    fontSize: 24,
  },
  cardLeftButtons: {
    flexDirection: 'row',
    marginBottom: -7,
    gap: 4,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTextTop: {
    marginBottom: 0,
  },
  cardTitleOld: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardDescriptionOld: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardCategoryOld: {
    fontSize: 12,
    color: colors.textMuted,
  },
  premiumBadgeOld: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumTextOld: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
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
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function CatalogScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const loadContent = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const options: Parameters<typeof getContent>[0] = { limit: 50 };
      if (activeFilter !== 'all') {
        options.type = activeFilter;
      }

      const data = await getContent(options);
      setContent(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки каталога:', err);
      setError('Не удалось загрузить контент');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [activeFilter]);

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

  const getImageUrl = (item: ContentItem): string | null => {
    return (item.content_data as { image_url?: string })?.image_url || null;
  };

  const renderContentCard = ({ item }: { item: ContentItem }) => {
    const imageUrl = getImageUrl(item);

    if (imageUrl) {
      return (
        <TouchableOpacity
          style={styles.cardWithImage}
          onPress={() => router.push(`/content/${item.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
            <View style={styles.cardTypeBadge}>
              <FontAwesome name={getTypeIcon(item.type) as any} size={14} color={colors.cardIconColor} />
            </View>
            <View style={styles.cardImageActions}>
              <DownloadButton item={item} size="small" />
              <BookmarkButton contentId={item.id} size="small" />
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}
            <View style={styles.cardFooter}>
              <View style={styles.cardFooterLeft}>
                <Text style={styles.cardCategory}>{item.category}</Text>
                {item.is_premium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>Премиум</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardFooterRight}>
                <FontAwesome name="calendar" size={11} color={colors.textMuted} />
                <Text style={styles.cardDate}>
                  {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/content/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardType}>
            <FontAwesome name={getTypeIcon(item.type) as any} size={34} color={colors.cardIconColor} />
          </View>
          <View style={styles.cardLeftButtons}>
            <DownloadButton item={item} size="small" />
            <BookmarkButton contentId={item.id} size="small" />
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTextTop}>
            <Text style={styles.cardTitleOld} numberOfLines={2}>{item.title}</Text>
            {item.description && (
              <Text style={styles.cardDescriptionOld} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.cardMetaLeft}>
              <Text style={styles.cardCategoryOld}>{item.category}</Text>
              {item.is_premium && (
                <View style={styles.premiumBadgeOld}>
                  <Text style={styles.premiumTextOld}>Премиум</Text>
                </View>
              )}
            </View>
            <View style={styles.cardMetaRight}>
              <FontAwesome name="calendar" size={11} color={colors.textMuted} />
              <Text style={styles.cardDate}>
                {new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color={colors.primary} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadContent()}>
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="search" size={48} color={colors.primary} />
        <Text style={styles.emptyText}>Ничего не найдено</Text>
        <Text style={styles.emptyHint}>Попробуйте изменить фильтр</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Каталог</Text>
        <Text style={styles.headerSubtitle}>Практики, медитации, курсы</Text>
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setActiveFilter(item.key)}
            >
              <FontAwesome name={item.icon as any} size={14} color={activeFilter === item.key ? colors.onPrimary : colors.textSecondary} />
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.key && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={content}
        renderItem={renderContentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadContent(true)}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
