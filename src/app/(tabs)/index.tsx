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
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getContent } from '../../services/api';
import { ContentItem } from '../../types';
import { DownloadButton } from '../../components/DownloadButton';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

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
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardType: {
    fontSize: 24,
  },
  premiumBadge: {
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
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

// Главный экран — лента контента
export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка контента
  const loadContent = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getContent({ limit: 20 });
      setContent(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки контента:', err);
      setError('Не удалось загрузить контент');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

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

  // Рендер карточки контента
  const renderContentCard = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/content/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <FontAwesome name={getTypeIcon(item.type) as any} size={24} color={colors.primary} />
        {item.is_premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Премиум</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      {item.description && (
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.cardActions}>
          <DownloadButton item={item} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Пустой список
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
          <FontAwesome name="leaf" size={48} color={colors.primary} />
        <Text style={styles.emptyText}>Пока нет контента</Text>
        <Text style={styles.emptyHint}>Скоро здесь появятся практики и медитации</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет, {profile?.display_name || 'Путник'} 👋</Text>
        <Text style={styles.headerTitle}>Что нового сегодня?</Text>
      </View>

      {/* Лента */}
      <FlatList
        data={content}
        renderItem={renderContentCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
