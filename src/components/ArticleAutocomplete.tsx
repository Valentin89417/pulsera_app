import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getPopularArticles, searchArticles, ArticleMention } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface ArticleAutocompleteProps {
  visible: boolean;
  query: string;
  onSelect: (article: ArticleMention) => void;
}

// Выпадающий список статей при вводе @ в чате
export function ArticleAutocomplete({ visible, query, onSelect }: ArticleAutocompleteProps) {
  const { colors } = useTheme();
  const [articles, setArticles] = useState<ArticleMention[]>([]);
  const [loading, setLoading] = useState(false);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = query.length > 0
        ? await searchArticles(query)
        : await getPopularArticles(5);
      setArticles(data);
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (visible) {
      loadArticles();
    }
  }, [visible, loadArticles]);

  if (!visible) return null;

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : articles.length === 0 ? (
        <Text style={styles.empty}>Ничего не найдено</Text>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelect(item)}
            >
              <FontAwesome name="file-text-o" size={14} color={colors.primary} style={styles.icon} />
              <Text style={styles.itemText} numberOfLines={1}>{item.title}</Text>
              <FontAwesome name={getTypeIcon(item.type)} size={12} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

function getTypeIcon(type: string): 'file-text-o' | 'video-camera' | 'headphones' | 'book' {
  switch (type) {
    case 'video': return 'video-camera';
    case 'audio': return 'headphones';
    case 'course': return 'book';
    default: return 'file-text-o';
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 280,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loader: {
    paddingVertical: 12,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  icon: {
    marginRight: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
});
