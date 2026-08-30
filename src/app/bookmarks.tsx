import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { getUserBookmarks, getContentById } from '../../services/api';
import { ContentItem } from '../../types';

// Элемент списка закладок
function BookmarkItem({ item, onPress }: { item: ContentItem; onPress: () => void }) {
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardIcon}>{getTypeIcon(item.type)}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
      {item.is_premium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>★</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Экран закладок
export default function BookmarksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Получаем закладки
      const userBookmarks = await getUserBookmarks(user.id);
      
      // Загружаем контент для каждой закладки
      const contentPromises = userBookmarks.map(b => getContentById(b.content_id));
      const contentResults = await Promise.all(contentPromises);
      
      // Фильтруем null значения
      const validContent = contentResults.filter((c): c is ContentItem => c !== null);
      
      setBookmarks(validContent);
    } catch (error) {
      console.error('Ошибка загрузки закладок:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (id: string) => {
    router.push(`/content/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6c63ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Закладки</Text>
      </View>

      {/* Список закладок */}
      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💜</Text>
          <Text style={styles.emptyTitle}>Нет закладок</Text>
          <Text style={styles.emptyText}>
            Добавляйте контент в закладки нажимая ❤️ на странице статьи
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BookmarkItem
              item={item}
              onPress={() => handleItemPress(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#6c63ff',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 14,
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
  cardCategory: {
    fontSize: 13,
    color: '#999',
  },
  premiumBadge: {
    backgroundColor: '#6c63ff22',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumText: {
    color: '#6c63ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});
