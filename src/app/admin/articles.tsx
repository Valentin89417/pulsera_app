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

// Список статей (админ)
export default function ArticlesScreen() {
  const router = useRouter();

  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка статей
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

  // Удаление статьи
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

  // Тип контента
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

  // Рендер статьи
  const renderArticle = ({ item }: { item: ContentItem }) => (
    <View style={styles.articleCard}>
      <View style={styles.articleInfo}>
        <View style={styles.articleTypeRow}>
          <FontAwesome name={getTypeIcon(item.type) as any} size={14} color="#6c63ff" />
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
          <FontAwesome name="pencil" size={18} color="#6c63ff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <FontAwesome name="trash-o" size={18} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color="#6c63ff" />
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

      {/* Список */}
      {loading ? (
        <ActivityIndicator size="large" color="#6c63ff" style={styles.loader} />
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="file-text-o" size={48} color="#6c63ff" />
              <Text style={styles.emptyText}>Пока нет статей</Text>
              <Text style={styles.emptyHint}>Нажмите "Создать" чтобы добавить первую</Text>
            </View>
          }
        />
      )}
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
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
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
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  articleInfo: {
    flex: 1,
  },
  articleType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  articleMeta: {
    fontSize: 12,
    color: '#666',
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#1a1a2e',
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
    color: '#fff',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: '#666',
  },
});
