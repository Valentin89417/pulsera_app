import { useState, useEffect } from 'react';
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
import { FontAwesome } from '@expo/vector-icons';
import { getContent, deleteContent } from '../../services/api';
import { ContentItem } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

export default function ArticlesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = (item: ContentItem) => {
    Alert.alert(
      'Удаление',
      `Удалить "${item.title}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteContent(item.id);
            if (success) {
              setArticles(articles.filter(a => a.id !== item.id));
            }
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
      </View>
      <View style={styles.articleActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({ pathname: '/admin/article-edit', params: { id: item.id } })}
        >
          <FontAwesome name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <FontAwesome name="trash-o" size={18} color={colors.error} />
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Статьи</Text>
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
    fontSize: 28,
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
  articleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
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
    backgroundColor: colors.background,
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

const styles = createStyles({
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceLight: '#1f2b47',
  primary: '#6c63ff',
  primaryLight: '#8b83ff',
  onPrimary: '#ffffff',
  gold: '#ffc107',
  copper: '#a5593b',
  cardBorder: '#333333',
  cardIconBg: '#1a1a2e',
  cardIconColor: '#6c63ff',
  inputBg: '#16213e',
  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',
  border: '#333333',
  borderLight: '#444444',
  success: '#4caf50',
  error: '#ff4444',
  primaryAlpha10: 'rgba(108, 99, 255, 0.1)',
  primaryAlpha13: 'rgba(108, 99, 255, 0.13)',
  primaryAlpha20: 'rgba(108, 99, 255, 0.2)',
  primaryAlpha27: 'rgba(108, 99, 255, 0.27)',
  surfaceAlpha98: 'rgba(22, 33, 62, 0.98)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  whiteAlpha60: 'rgba(255, 255, 255, 0.6)',
  whiteAlpha70: 'rgba(255, 255, 255, 0.7)',
  placeholder: '#666666',
  statusBar: 'light',
});
