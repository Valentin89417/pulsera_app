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
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getUserBookmarks, getContentById } from '../services/api';
import { ContentItem } from '../types';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

function BookmarkItem({ item, onPress, colors }: { item: ContentItem; onPress: () => void; colors: ThemeColors }) {
  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

  const createBookmarkStyles = (colors: ThemeColors) => StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
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
      color: colors.text,
      marginBottom: 4,
    },
    cardCategory: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    premiumBadge: {
      backgroundColor: colors.primaryAlpha13,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    premiumText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });

  const styles = createBookmarkStyles(colors);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <FontAwesome name={getTypeIcon(item.type) as any} size={28} color={colors.primary} style={styles.cardIcon} />
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

export default function BookmarksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    backText: {
      color: colors.primary,
      fontSize: 16,
      marginLeft: 6,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 40,
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
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  const styles = createStyles(colors);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const userBookmarks = await getUserBookmarks(user.id);
      
      const contentPromises = userBookmarks.map(b => getContentById(b.content_id));
      const contentResults = await Promise.all(contentPromises);
      
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Закладки</Text>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="heart" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Нет закладок</Text>
          <Text style={styles.emptyText}>
            Добавляйте контент в закладки нажимая
            <FontAwesome name="heart" size={14} color={colors.error} />
            на странице статьи
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
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
