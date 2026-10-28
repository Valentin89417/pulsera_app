import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { getContent, getCategories } from '../../services/api';
import { ContentItem } from '../../types';
import { DownloadButton } from '../../components/DownloadButton';
import { AfishaSlider } from '../../components/AfishaSlider';
import { WeekCalendar } from '../../components/WeekCalendar';
import { DailyCard } from '../../components/DailyCard';
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
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
  categoriesSection: {
    marginBottom: 20,
  },
  categoriesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAlpha13,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  categoryChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipCount: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});

// Главный экран — лента контента
export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Прокрутка ленты к сфокусированному полю ввода (DailyCard в футере)
  const listRef = useRef<FlatList<ContentItem>>(null);
  const containerRef = useRef<View>(null);
  const focusedNodeRef = useRef<View | null>(null);
  const keyboardTopRef = useRef<number | null>(null);
  const contentOffsetRef = useRef(0);

  // Прокрутить ленту так, чтобы блок с полем ввода был виден над клавиатурой
  const scrollFocusedInputIntoView = useCallback(() => {
    const node = focusedNodeRef.current;
    const container = containerRef.current;
    if (!node || !container) return;

    node.measureInWindow((_nx, nodeY, _nw, nodeH) => {
      container.measureInWindow((_cx, containerY, _cw, containerH) => {
        // Нижняя граница видимой области: дно экрана или верх клавиатуры
        let visibleBottom = containerY + containerH;
        if (keyboardTopRef.current != null) {
          visibleBottom = Math.min(visibleBottom, keyboardTopRef.current);
        }
        const MARGIN = 24;
        const delta = nodeY + nodeH + MARGIN - visibleBottom;
        if (delta > 0) {
          listRef.current?.scrollToOffset({
            offset: contentOffsetRef.current + delta,
            animated: true,
          });
        }
      });
    });
  }, []);

  // Фокус на поле ввода внутри DailyCard: запоминаем блок и прокручиваем
  const handleInputFocus = useCallback(
    (node: View | null) => {
      focusedNodeRef.current = node;
      if (node) scrollFocusedInputIntoView();
    },
    [scrollFocusedInputIntoView]
  );

  // После показа клавиатуры — прокрутка с учётом её верхней границы
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      keyboardTopRef.current = event.endCoordinates.screenY;
      // Даём кадр на ресайз окна (Android adjustResize) перед замером
      requestAnimationFrame(() => scrollFocusedInputIntoView());
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardTopRef.current = null;
      focusedNodeRef.current = null;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFocusedInputIntoView]);

  // Загрузка контента
  const loadContent = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Последние 4 материала — остальное в каталоге
      const data = await getContent({ limit: 4 });
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

  const loadCategories = async () => {
    const data = await getCategories();
    setCategories(data.slice(0, 25));
  };

  useFocusEffect(
    useCallback(() => {
      loadContent();
      loadCategories();
    }, [])
  );

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

  // Рендер заголовка: афиша + категории
  const renderHeader = () => (
    <>
      <AfishaSlider />
      {categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>Популярные категории</Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: item.name } })}
              activeOpacity={0.7}
            >
              <FontAwesome name="tag" size={12} color={colors.primary} />
              <Text style={styles.categoryChipText}>{item.name}</Text>
              <Text style={styles.categoryChipCount}>{item.count}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      )}
    </>
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
    <View style={styles.container} ref={containerRef}>
      {/* Заголовок */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PULSERA | Стая</Text>
        <Text style={styles.headerSubtitle}>Путь к себе, среди своих.</Text>
      </View>

      {/* Лента */}
      <FlatList
        ref={listRef}
        data={content}
        renderItem={renderContentCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() => (
          <>
            <WeekCalendar />
            <DailyCard onInputFocus={handleInputFocus} />
          </>
        )}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          contentOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
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
