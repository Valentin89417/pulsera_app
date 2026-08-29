import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getContent } from '../../services/api';
import { ContentItem, ContentType } from '../../types';

// Фильтры по типу контента
const FILTERS: { key: ContentType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Все', icon: '✨' },
  { key: 'article', label: 'Статьи', icon: '📝' },
  { key: 'video', label: 'Видео', icon: '🎬' },
  { key: 'audio', label: 'Аудио', icon: '🎧' },
  { key: 'course', label: 'Курсы', icon: '📚' },
];

// Экран каталога
export default function CatalogScreen() {
  const router = useRouter();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ContentType | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Загрузка контента
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

  // Загрузка при изменении фильтра
  useEffect(() => {
    loadContent();
  }, [activeFilter]);

  // Иконка типа контента
  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return '📝';
      case 'video': return '🎬';
      case 'audio': return '🎧';
      case 'course': return '📚';
      default: return '📄';
    }
  };

  // Рендер карточки контента
  const renderContentCard = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/content/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardType}>
        <Text style={styles.cardTypeIcon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          {item.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Премиум</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Пустой список
  const renderEmpty = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#6c63ff" style={styles.loader} />;
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadContent()}>
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>Ничего не найдено</Text>
        <Text style={styles.emptyHint}>Попробуйте изменить фильтр</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Каталог</Text>
        <Text style={styles.headerSubtitle}>Практики, медитации, курсы</Text>
      </View>

      {/* Фильтры */}
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
              <Text style={styles.filterIcon}>{item.icon}</Text>
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

      {/* Список контента */}
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
            tintColor="#6c63ff"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
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
    backgroundColor: '#16213e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#6c63ff',
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
  },
  cardType: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTypeIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardCategory: {
    fontSize: 12,
    color: '#666',
  },
  premiumBadge: {
    backgroundColor: '#6c63ff22',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumText: {
    color: '#6c63ff',
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
    color: '#fff',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: '#666',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
